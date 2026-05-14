import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Timer "mo:core/Timer";
import Time "mo:core/Time";
import ProfileTypes "types/profile";
import ProfileLib "lib/profile";
import EmailLib "lib/email";
import TickerLib "lib/ticker";
import _AnalyticsLib "lib/analytics";
import AnalyticsTypes "types/analytics";
import ProfileMixin "mixins/profile-api";
import EmailMixin "mixins/email-api";
import TickerMixin "mixins/ticker-api";
import StatsMixin "mixins/stats-api";
import AnalyticsMixin "mixins/analytics-api";
import Subscribers "mo:caffeineai-email-marketing/subscribers";
import UnsubscribeMixin "mo:caffeineai-email-marketing/unsubscribeMixin";
import EmailClient "mo:caffeineai-email/emailClient";

(with migration = func(old : {
  qrEntries : Map.Map<ProfileTypes.UserId, List.List<{
    id : Nat;
    userId : ProfileTypes.UserId;
    url : Text;
    generatedAt : ProfileTypes.Timestamp;
    notes : Text;
    compositeImage : ?Text;
  }>>;
  emailSignups : List.List<EmailLib.EmailSignup>;
}) : {
  qrEntries : Map.Map<ProfileTypes.UserId, List.List<ProfileLib.QrEntry>>;
  emailSignups : List.List<EmailLib.EmailSignup>;
} = {
  qrEntries = old.qrEntries.map<ProfileTypes.UserId, List.List<{
    id : Nat;
    userId : ProfileTypes.UserId;
    url : Text;
    generatedAt : ProfileTypes.Timestamp;
    notes : Text;
    compositeImage : ?Text;
  }>, List.List<ProfileLib.QrEntry>>(
    func(_, oldList) = oldList.map<{
      id : Nat;
      userId : ProfileTypes.UserId;
      url : Text;
      generatedAt : ProfileTypes.Timestamp;
      notes : Text;
      compositeImage : ?Text;
    }, ProfileLib.QrEntry>(
      func(e) = {
        id = e.id;
        userId = e.userId;
        url = e.url;
        generatedAt = e.generatedAt;
        notes = e.notes;
        compositeImage = e.compositeImage;
      },
    ),
  );
  emailSignups = old.emailSignups;
}) actor {
  // Admin principal — set at deploy time via first-run or hardcoded
  var adminPrincipal : ?Principal = null;

  // Profile state: per-user list of QR entries
  let qrEntries = Map.empty<ProfileTypes.UserId, List.List<ProfileLib.QrEntry>>();
  var nextEntryId : Nat = 0;

  // Style preset state: per-user list of style presets
  let stylePresets = Map.empty<ProfileTypes.UserId, List.List<ProfileLib.StylePreset>>();
  var nextPresetId : Nat = 0;

  // Email signup state
  let emailSignups = List.empty<EmailLib.EmailSignup>();

  // Email-marketing subscriber state (topic-based, for unsubscribe + marketing)
  let subscribers = Subscribers.new(["updates"]);
  let welcomeTopicId : Nat = 0; // "updates" topic is always topic 0

  // Drip email templates (4 defaults, admin-editable)
  let dripTemplates = List.fromArray<EmailLib.DripTemplate>(EmailLib.defaultDripTemplates());

  // Drip email send log (append-only, per subscriber/template)
  let dripEmailLog = List.empty<EmailLib.DripEmailLog>();

  // Ticker message state (up to 5)
  let tickerMessages = List.empty<TickerLib.TickerMessage>();
  var nextTickerId : Nat = 0;

  // Analytics state: click counts and payment records
  let clickCounts = Map.empty<Text, Nat>();
  let analyticsPayments = List.empty<AnalyticsTypes.PaymentRecord>();

  func getAdmin() : ?Principal { adminPrincipal };
  func getNextEntryId() : Nat { nextEntryId };
  func setNextEntryId(n : Nat) { nextEntryId := n };
  func getNextPresetId() : Nat { nextPresetId };
  func setNextPresetId(n : Nat) { nextPresetId := n };
  func getNextTickerId() : Nat { nextTickerId };
  func setNextTickerId(n : Nat) { nextTickerId := n };
  func getWelcomeTopicId() : Nat { welcomeTopicId };

  include ProfileMixin(qrEntries, getNextEntryId, setNextEntryId, stylePresets, getNextPresetId, setNextPresetId);
  include EmailMixin(emailSignups, getAdmin, subscribers, getWelcomeTopicId, dripTemplates, dripEmailLog);
  include TickerMixin(tickerMessages, getNextTickerId, setNextTickerId, getAdmin);
  include StatsMixin(qrEntries, getAdmin);
  include AnalyticsMixin(clickCounts, analyticsPayments, getAdmin, qrEntries);
  include UnsubscribeMixin(subscribers);

  // Admin setup: caller becomes admin if none set yet
  public shared ({ caller }) func claimAdmin() : async Bool {
    switch (adminPrincipal) {
      case (null) {
        adminPrincipal := ?caller;
        true;
      };
      case (?_) { false };
    };
  };

  public query func getAdminPrincipal() : async ?Principal {
    adminPrincipal;
  };

  // Daily drip cron: iterate all subscribers, send any due drip emails not yet sent
  ignore Timer.recurringTimer<system>(#hours(24), func() : async () {
    let nowNs = Time.now();
    let dayNs : Int = 86_400_000_000_000;
    let signups = EmailLib.getSignups(emailSignups);
    let templates = EmailLib.getDripTemplates(dripTemplates);
    for (signup in signups.values()) {
      for (tmpl in templates.values()) {
        if (tmpl.id != 0) { // Skip Welcome — sent at signup
          let dueAtNs : Int = signup.signedUpAt + (tmpl.delayDays : Int) * dayNs;
          if (nowNs >= dueAtNs and not EmailLib.hasReceivedTemplate(dripEmailLog, signup.email, tmpl.id)) {
            let result = await EmailClient.sendMarketingEmail(
              welcomeTopicId,
              "updates",
              [{ email = signup.email; substitutions = ?[("{{firstName}}", signup.firstName)] }],
              tmpl.subject,
              tmpl.htmlBody,
            );
            switch (result) {
              case (#ok) {
                EmailLib.appendDripLog(dripEmailLog, signup.email, tmpl.id, tmpl.version);
              };
              case (#err(_)) {};
            };
          };
        };
      };
    };
  });
};
