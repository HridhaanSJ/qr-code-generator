import List "mo:core/List";
import Text "mo:core/Text";
import TickerTypes "../types/ticker";

module {
  public type TickerMessage = TickerTypes.TickerMessage;

  func truncate(text : Text, maxLen : Nat) : Text {
    if (text.size() <= maxLen) { text } else {
      let chars = text.toArray();
      Text.fromArray(chars.sliceToArray(0, maxLen));
    };
  };

  public func getMessages(messages : List.List<TickerMessage>) : [TickerMessage] {
    messages.toArray();
  };

  public func addMessage(
    messages : List.List<TickerMessage>,
    nextId : Nat,
    message : Text,
  ) : (?TickerMessage, Nat) {
    if (messages.size() >= 5) {
      return (null, nextId);
    };
    let msg : TickerMessage = { id = nextId; message = truncate(message, 150) };
    messages.add(msg);
    (?msg, nextId + 1);
  };

  public func updateMessage(
    messages : List.List<TickerMessage>,
    id : Nat,
    message : Text,
  ) : Bool {
    let truncated = truncate(message, 150);
    var found = false;
    messages.mapInPlace(func(m : TickerMessage) : TickerMessage {
      if (m.id == id) {
        found := true;
        { m with message = truncated };
      } else {
        m;
      };
    });
    found;
  };

  public func deleteMessage(
    messages : List.List<TickerMessage>,
    id : Nat,
  ) : Bool {
    let sizeBefore = messages.size();
    let filtered = messages.filter(func(m : TickerMessage) : Bool { m.id != id });
    messages.clear();
    messages.append(filtered);
    messages.size() < sizeBefore;
  };
};
