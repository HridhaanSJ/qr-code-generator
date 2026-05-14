import CommonTypes "common";

module {
  public type UserId = CommonTypes.UserId;
  public type Timestamp = CommonTypes.Timestamp;

  public type QrEntry = {
    id : Nat;
    userId : UserId;
    url : Text;
    generatedAt : Timestamp;
    notes : Text; // max 30 chars
    compositeImage : ?Text;
  };

  public type StylePreset = {
    id : Nat;
    name : Text;
    dotColor : Text;
    bgColor : Text;
    logoData : ?Text; // base64 data URL
  };
};
