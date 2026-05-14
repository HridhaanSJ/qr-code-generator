import List "mo:core/List";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import TickerLib "../lib/ticker";

mixin (
  tickerMessages : List.List<TickerLib.TickerMessage>,
  getNextTickerId : () -> Nat,
  setNextTickerId : (Nat) -> (),
  getAdmin : () -> ?Principal,
) {
  public query func getTickerMessages() : async [TickerLib.TickerMessage] {
    TickerLib.getMessages(tickerMessages);
  };

  public shared ({ caller }) func addTickerMessage(message : Text) : async ?TickerLib.TickerMessage {
    switch (getAdmin()) {
      case (?admin) {
        if (not Principal.equal(caller, admin)) {
          Runtime.trap("Unauthorized: admin only");
        };
      };
      case null {
        Runtime.trap("Unauthorized: no admin set");
      };
    };
    let (msg, newId) = TickerLib.addMessage(tickerMessages, getNextTickerId(), message);
    setNextTickerId(newId);
    msg;
  };

  public shared ({ caller }) func updateTickerMessage(id : Nat, message : Text) : async Bool {
    switch (getAdmin()) {
      case (?admin) {
        if (not Principal.equal(caller, admin)) {
          Runtime.trap("Unauthorized: admin only");
        };
      };
      case null {
        Runtime.trap("Unauthorized: no admin set");
      };
    };
    TickerLib.updateMessage(tickerMessages, id, message);
  };

  public shared ({ caller }) func deleteTickerMessage(id : Nat) : async Bool {
    switch (getAdmin()) {
      case (?admin) {
        if (not Principal.equal(caller, admin)) {
          Runtime.trap("Unauthorized: admin only");
        };
      };
      case null {
        Runtime.trap("Unauthorized: no admin set");
      };
    };
    TickerLib.deleteMessage(tickerMessages, id);
  };
};
