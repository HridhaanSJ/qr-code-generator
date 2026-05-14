import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Types "../types/analytics";

module {
  public type ClickMap = Map.Map<Text, Nat>;             // qrEntryId -> clickCount
  public type PaymentList = List.List<Types.PaymentRecord>;

  /// Increment click count for a QR entry; returns the new total.
  public func recordClick(clicks : ClickMap, qrEntryId : Text) : Nat {
    let prev = switch (clicks.get(qrEntryId)) {
      case (?n) { n };
      case null { 0 };
    };
    let next = prev + 1;
    clicks.add(qrEntryId, next);
    next;
  };

  /// Return current click count for a QR entry (0 if never clicked).
  public func getClickCount(clicks : ClickMap, qrEntryId : Text) : Nat {
    switch (clicks.get(qrEntryId)) {
      case (?n) { n };
      case null { 0 };
    };
  };

  /// Return all click counts for an array of QR entry IDs.
  public func getClickCountsForEntries(clicks : ClickMap, entryIds : [Text]) : [(Text, Nat)] {
    entryIds.map<Text, (Text, Nat)>(func(id) {
      (id, getClickCount(clicks, id))
    });
  };

  /// Record a confirmed ICP payment for analytics access.
  public func recordPayment(payments : PaymentList, userId : Principal, amountE8s : Nat) {
    payments.add({
      userId;
      timestamp = Time.now();
      amountE8s;
    });
  };

  /// Return true if the given user has already paid for analytics access.
  public func hasAnalyticsAccess(payments : PaymentList, userId : Principal) : Bool {
    payments.any(func(p : Types.PaymentRecord) : Bool {
      Principal.equal(p.userId, userId)
    });
  };

  /// Return all payment records (admin use only — caller must enforce access control).
  public func getAllPayments(payments : PaymentList) : [Types.PaymentRecord] {
    payments.toArray();
  };
};
