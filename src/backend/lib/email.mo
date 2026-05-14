import List "mo:core/List";
import Time "mo:core/Time";
import EmailTypes "../types/email";

module {
  public type EmailSignup = EmailTypes.EmailSignup;
  public type DripTemplate = EmailTypes.DripTemplate;
  public type DripEmailLog = EmailTypes.DripEmailLog;

  // ── Signup helpers ──────────────────────────────────────────────────────────

  public func addSignup(
    signups : List.List<EmailSignup>,
    firstName : Text,
    email : Text,
  ) : Bool {
    let lower = email.toLower();
    if (alreadySignedUp(signups, lower)) return false;
    signups.add({
      firstName;
      email = lower;
      signedUpAt = Time.now();
    });
    true;
  };

  public func getSignups(signups : List.List<EmailSignup>) : [EmailSignup] {
    signups.toArray();
  };

  public func removeSignup(
    signups : List.List<EmailSignup>,
    email : Text,
  ) : Bool {
    let lower = email.toLower();
    let sizeBefore = signups.size();
    let kept = signups.filter(func(s) { s.email.toLower() != lower });
    signups.clear();
    signups.addAll(kept.values());
    signups.size() < sizeBefore;
  };

  public func alreadySignedUp(
    signups : List.List<EmailSignup>,
    email : Text,
  ) : Bool {
    let lower = email.toLower();
    signups.find(func(s) { s.email.toLower() == lower }) != null;
  };

  // ── Drip template helpers ───────────────────────────────────────────────────

  /// Returns the default 4-template drip sequence.
  public func defaultDripTemplates() : [DripTemplate] {
    let now = Time.now();
    [
      {
        id = 0;
        name = "Welcome";
        delayDays = 0;
        subject = "Welcome to QR Code Generator!";
        htmlBody = "<p>Hi {{firstName}},</p>"
          # "<p>Thank you for subscribing to <strong>QR Code Generator</strong> updates!</p>"
          # "<p>We'll keep you in the loop with new features, tips, and announcements.</p>"
          # "<p>— The QR Code Generator Team</p>"
          # "<p style=\"font-size:12px;color:#888;\">To unsubscribe, <a href=\"{{UNSUBSCRIBE_URL}}\">click here</a>.</p>";
        version = 1;
        updatedAt = now;
      },
      {
        id = 1;
        name = "Update 1";
        delayDays = 10;
        subject = "How are you getting on with QR Code Generator?";
        htmlBody = "<p>Hi {{firstName}},</p>"
          # "<p>It's been 10 days since you joined — we hope you're enjoying the app!</p>"
          # "<p>Did you know you can save custom color presets and logos to speed up your workflow? Give it a try!</p>"
          # "<p>— The QR Code Generator Team</p>"
          # "<p style=\"font-size:12px;color:#888;\">To unsubscribe, <a href=\"{{UNSUBSCRIBE_URL}}\">click here</a>.</p>";
        version = 1;
        updatedAt = now;
      },
      {
        id = 2;
        name = "Update 2";
        delayDays = 30;
        subject = "A month with QR Code Generator 🎉";
        htmlBody = "<p>Hi {{firstName}},</p>"
          # "<p>You've been with us for a whole month — thank you!</p>"
          # "<p>Reminder: you can batch-download all your saved QR codes as a ZIP file from your My QRs page.</p>"
          # "<p>— The QR Code Generator Team</p>"
          # "<p style=\"font-size:12px;color:#888;\">To unsubscribe, <a href=\"{{UNSUBSCRIBE_URL}}\">click here</a>.</p>";
        version = 1;
        updatedAt = now;
      },
      {
        id = 3;
        name = "Update 3";
        delayDays = 40;
        subject = "Tips & tricks for QR Code Generator";
        htmlBody = "<p>Hi {{firstName}},</p>"
          # "<p>Here are a few tips to get the most out of QR Code Generator:</p>"
          # "<ul><li>Use the search bar to quickly find any saved code by URL or note.</li>"
          # "<li>Save style presets to keep your brand colors consistent.</li>"
          # "<li>Download all codes as a ZIP for batch printing.</li></ul>"
          # "<p>— The QR Code Generator Team</p>"
          # "<p style=\"font-size:12px;color:#888;\">To unsubscribe, <a href=\"{{UNSUBSCRIBE_URL}}\">click here</a>.</p>";
        version = 1;
        updatedAt = now;
      },
    ];
  };

  public func getDripTemplates(templates : List.List<DripTemplate>) : [DripTemplate] {
    templates.toArray();
  };

  public func updateDripTemplate(
    templates : List.List<DripTemplate>,
    id : Nat,
    subject : Text,
    htmlBody : Text,
  ) : Bool {
    var found = false;
    templates.mapInPlace(
      func(t) {
        if (t.id == id) {
          found := true;
          { t with subject; htmlBody; version = t.version + 1; updatedAt = Time.now() };
        } else { t };
      }
    );
    found;
  };

  // ── Drip log helpers ────────────────────────────────────────────────────────

  public func hasReceivedTemplate(
    log : List.List<DripEmailLog>,
    subscriberEmail : Text,
    templateId : Nat,
  ) : Bool {
    let lower = subscriberEmail.toLower();
    log.find(func(entry) { entry.subscriberEmail == lower and entry.templateId == templateId }) != null;
  };

  public func appendDripLog(
    log : List.List<DripEmailLog>,
    subscriberEmail : Text,
    templateId : Nat,
    versionSent : Nat,
  ) {
    log.add({
      subscriberEmail = subscriberEmail.toLower();
      templateId;
      versionSent;
      sentAt = Time.now();
    });
  };

  public func getDripEmailLog(log : List.List<DripEmailLog>) : [DripEmailLog] {
    log.toArray();
  };

  // Remove log entries for a given subscriber (called on removeEmailSignup)
  public func removeDripLogsForEmail(
    log : List.List<DripEmailLog>,
    email : Text,
  ) {
    let lower = email.toLower();
    let kept = log.filter(func(entry) { entry.subscriberEmail != lower });
    log.clear();
    log.addAll(kept.values());
  };
};
