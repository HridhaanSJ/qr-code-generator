import CommonTypes "common";

module {
  public type Timestamp = CommonTypes.Timestamp;

  public type EmailSignup = {
    firstName : Text;
    email : Text;
    signedUpAt : Timestamp;
  };

  public type DripTemplate = {
    id : Nat;
    name : Text;
    delayDays : Nat;
    subject : Text;
    htmlBody : Text;
    version : Nat;
    updatedAt : Timestamp;
  };

  public type DripEmailLog = {
    subscriberEmail : Text;
    templateId : Nat;
    versionSent : Nat;
    sentAt : Timestamp;
  };
};
