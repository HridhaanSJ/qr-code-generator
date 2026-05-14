import CommonTypes "common";

module {
  public type UserId = CommonTypes.UserId;
  public type Timestamp = CommonTypes.Timestamp;

  // Tracks click events per QR code entry
  public type ClickRecord = {
    qrEntryId : Text;
    clickCount : Nat;
  };

  // Records a confirmed ICP payment for analytics access
  public type PaymentRecord = {
    userId : UserId;
    timestamp : Timestamp;
    amountE8s : Nat;
  };
};
