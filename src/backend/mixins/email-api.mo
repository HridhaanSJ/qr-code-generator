import List "mo:core/List";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Nat32 "mo:core/Nat32";
import EmailLib "../lib/email";
import EmailClient "mo:caffeineai-email/emailClient";
import Subscribers "mo:caffeineai-email-marketing/subscribers";

mixin (
  emailSignups : List.List<EmailLib.EmailSignup>,
  getAdmin : () -> ?Principal,
  subscribers : Subscribers.State,
  getWelcomeTopicId : () -> Nat,
  dripTemplates : List.List<EmailLib.DripTemplate>,
  dripEmailLog : List.List<EmailLib.DripEmailLog>,
) {
  public shared func signUpForEmail(firstName : Text, email : Text) : async Bool {
    if (firstName == "" or email == "") return false;
    let added = EmailLib.addSignup(emailSignups, firstName, email);
    if (not added) return false;

    // Subscribe to the welcome topic so they receive marketing emails
    let topicId = getWelcomeTopicId();
    ignore Subscribers.add(subscribers, topicId, email.toLower());

    // Send welcome email
    let htmlBody = "<p>Hi " # firstName # ",</p>"
      # "<p>Thank you for subscribing to <strong>QR Code Generator</strong> updates!</p>"
      # "<p>We'll keep you in the loop with new features, tips, and announcements.</p>"
      # "<p>— The QR Code Generator Team</p>"
      # "<p style=\"font-size:12px;color:#888;\">To unsubscribe, <a href=\"{{UNSUBSCRIBE_URL}}\">click here</a>.</p>";

    ignore await EmailClient.sendMarketingEmail(
      topicId,
      "updates",
      [{ email = email.toLower(); substitutions = ?[("{{firstName}}", firstName)] }],
      "Welcome to QR Code Generator!",
      htmlBody,
    );

    true;
  };

  public shared ({ caller }) func getEmailSignups() : async [EmailLib.EmailSignup] {
    switch (getAdmin()) {
      case (?admin) {
        if (caller != admin) Runtime.trap("Unauthorized");
      };
      case null {};
    };
    EmailLib.getSignups(emailSignups);
  };

  public shared ({ caller }) func removeEmailSignup(email : Text) : async Bool {
    switch (getAdmin()) {
      case (?admin) {
        if (caller != admin) Runtime.trap("Unauthorized");
      };
      case null {};
    };
    let lower = email.toLower();
    // Remove from marketing topic and drip log as well
    Subscribers.remove(subscribers, getWelcomeTopicId(), lower);
    EmailLib.removeDripLogsForEmail(dripEmailLog, lower);
    EmailLib.removeSignup(emailSignups, lower);
  };

  public shared ({ caller }) func broadcastToSubscribers(subject : Text, body : Text) : async Text {
    switch (getAdmin()) {
      case (?admin) {
        if (caller != admin) Runtime.trap("Unauthorized");
      };
      case null {};
    };

    let signups = EmailLib.getSignups(emailSignups);
    if (signups.size() == 0) return "{ \"err\": \"No subscribers to send to.\" }";

    let topicId = getWelcomeTopicId();
    let recipients = signups.map(
      func(s) {
        {
          email = s.email;
          substitutions = ?[("{{firstName}}", s.firstName)];
        };
      }
    );

    let unsubscribeFooter = "<p style=\"font-size:12px;color:#888;\">To unsubscribe, <a href=\"{{UNSUBSCRIBE_URL}}\">click here</a>.</p>";
    let bodyContent = if (body.contains(#text "{{UNSUBSCRIBE_URL}}")) { body } else { body # unsubscribeFooter };
    let htmlBody = "<p>Hi {{firstName}},</p>"
      # "<p>" # bodyContent # "</p>"
      # "<p>— The QR Code Generator Team</p>";

    let result = await EmailClient.sendMarketingEmail(
      topicId,
      "updates",
      recipients,
      subject,
      htmlBody,
    );

    switch (result) {
      case (#ok) { "{ \"ok\": " # Nat32.fromNat(signups.size()).toText() # " }" };
      case (#err(_)) { "{ \"err\": \"Failed to send broadcast. Please try again.\" }" };
    };
  };

  // ── Drip template management ────────────────────────────────────────────────

  public shared query ({ caller }) func getDripTemplates() : async [EmailLib.DripTemplate] {
    switch (getAdmin()) {
      case (?admin) {
        if (caller != admin) Runtime.trap("Unauthorized");
      };
      case null {};
    };
    EmailLib.getDripTemplates(dripTemplates);
  };

  public shared ({ caller }) func updateDripTemplate(id : Nat, subject : Text, htmlBody : Text) : async Bool {
    switch (getAdmin()) {
      case (?admin) {
        if (caller != admin) Runtime.trap("Unauthorized");
      };
      case null {};
    };
    if (subject == "" or htmlBody == "") return false;
    EmailLib.updateDripTemplate(dripTemplates, id, subject, htmlBody);
  };

  public shared query ({ caller }) func getDripEmailLog() : async [EmailLib.DripEmailLog] {
    switch (getAdmin()) {
      case (?admin) {
        if (caller != admin) Runtime.trap("Unauthorized");
      };
      case null {};
    };
    EmailLib.getDripEmailLog(dripEmailLog);
  };

};
