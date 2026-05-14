import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import ProfileTypes "../types/profile";
import ProfileLib "../lib/profile";
import AnalyticsLib "../lib/analytics";
import AnalyticsTypes "../types/analytics";

mixin (
  clicks : AnalyticsLib.ClickMap,
  payments : AnalyticsLib.PaymentList,
  getAdmin : () -> ?Principal,
  qrEntries : Map.Map<ProfileTypes.UserId, List.List<ProfileLib.QrEntry>>,
) {
  // ICP Ledger actor type for block queries
  type Ledger = actor {
    query_blocks : shared query {
      start : Nat64;
      length : Nat64;
    } -> async {
      blocks : [{
        transaction : {
          operation : ?{
            #Transfer : {
              to : Blob;
              fee : { e8s : Nat64 };
              from : Blob;
              amount : { e8s : Nat64 };
            };
            #Mint : { to : Blob; amount : { e8s : Nat64 } };
            #Burn : { from : Blob; amount : { e8s : Nat64 } };
            #Approve : {
              fee : { e8s : Nat64 };
              from : Blob;
              allowance_e8s : Int;
              expires_at : ?{ timestamp_nanos : Nat64 };
              spender : Blob;
            };
          };
        };
      }];
      first_block_index : Nat64;
      archived_blocks : [{
        start : Nat64;
        length : Nat64;
        callback : shared query { start : Nat64; length : Nat64 } -> async {
          blocks : [{
            transaction : {
              operation : ?{
                #Transfer : {
                  to : Blob;
                  fee : { e8s : Nat64 };
                  from : Blob;
                  amount : { e8s : Nat64 };
                };
                #Mint : { to : Blob; amount : { e8s : Nat64 } };
                #Burn : { from : Blob; amount : { e8s : Nat64 } };
                #Approve : {
                  fee : { e8s : Nat64 };
                  from : Blob;
                  allowance_e8s : Int;
                  expires_at : ?{ timestamp_nanos : Nat64 };
                  spender : Blob;
                };
              };
            };
          }];
        };
      }];
    };
  };

  let ledger : Ledger = actor "ryjl3-tyaaa-aaaaa-aaaba-cai";

  /// Update call — looks up QR entry by id (as Nat string), increments click count,
  /// and returns the target URL for immediate redirect. Returns null if not found.
  public shared func getQrForRedirect(id : Text) : async ?{ url : Text } {
    var found : ?Text = null;
    label search for ((_, userList) in qrEntries.entries()) {
      switch (userList.find(func(e : ProfileLib.QrEntry) : Bool { e.id.toText() == id })) {
        case (?entry) {
          found := ?entry.url;
          break search;
        };
        case null {};
      };
    };
    switch (found) {
      case (?url) {
        ignore AnalyticsLib.recordClick(clicks, id);
        ?{ url };
      };
      case null { null };
    };
  };

  /// Returns [(qrEntryId, clickCount)] for all of the caller's QR codes.
  public shared query ({ caller }) func getMyClickCounts() : async [(Text, Nat)] {
    let entries = ProfileLib.getEntries(qrEntries, caller);
    let ids = entries.map(func(e : ProfileLib.QrEntry) : Text { e.id.toText() });
    AnalyticsLib.getClickCountsForEntries(clicks, ids);
  };

  /// Returns true if the caller has paid for analytics access (>= 0.5 ICP).
  public shared query ({ caller }) func getAnalyticsAccess() : async Bool {
    AnalyticsLib.hasAnalyticsAccess(payments, caller);
  };

  /// Verifies an ICP ledger block and marks the caller as having paid for analytics.
  /// Idempotent — returns #ok immediately if the caller already has access.
  public shared ({ caller }) func unlockAnalytics(blockHeight : Nat64) : async { #ok; #err : Text } {
    // Idempotent guard
    if (AnalyticsLib.hasAnalyticsAccess(payments, caller)) {
      return #ok;
    };

    // Query the ICP ledger for the specified block
    let result = try {
      await ledger.query_blocks({ start = blockHeight; length = 1 });
    } catch (_) {
      return #err("Failed to query ICP ledger. Please try again.");
    };

    if (result.blocks.size() == 0) {
      return #err("Block not found at height " # Nat.fromNat64(blockHeight).toText() # ".");
    };

    let block = result.blocks[0];

    switch (block.transaction.operation) {
      case (? #Transfer(transfer)) {
        // Verify sender matches caller's default ledger account
        let expectedFrom = caller.toLedgerAccount(null);
        if (transfer.from != expectedFrom) {
          return #err("Transfer sender does not match your principal.");
        };

        // Verify amount >= 0.5 ICP (50_000_000 e8s)
        let amountE8s = Nat.fromNat64(transfer.amount.e8s);
        if (amountE8s < 50_000_000) {
          return #err("Transfer amount too low. Minimum is 0.5 ICP.");
        };

        AnalyticsLib.recordPayment(payments, caller, amountE8s);
        #ok;
      };
      case (_) {
        #err("Block does not contain a Transfer operation.");
      };
    };
  };

  /// Admin-only — returns the full payment ledger.
  public shared query ({ caller }) func getPaymentLedger() : async [AnalyticsTypes.PaymentRecord] {
    switch (getAdmin()) {
      case (?admin) {
        if (not Principal.equal(caller, admin)) {
          Runtime.trap("Unauthorized: admin only");
        };
      };
      case null { Runtime.trap("Unauthorized: no admin set") };
    };
    AnalyticsLib.getAllPayments(payments);
  };
};
