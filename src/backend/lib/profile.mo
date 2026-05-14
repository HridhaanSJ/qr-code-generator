import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Text "mo:core/Text";
import ProfileTypes "../types/profile";

module {
  public type QrEntry = ProfileTypes.QrEntry;
  public type StylePreset = ProfileTypes.StylePreset;
  public type UserId = ProfileTypes.UserId;

  func truncate(text : Text, maxLen : Nat) : Text {
    if (text.size() <= maxLen) { text } else {
      let chars = text.toArray();
      Text.fromArray(chars.sliceToArray(0, maxLen));
    };
  };

  public func getEntries(
    entries : Map.Map<UserId, List.List<QrEntry>>,
    userId : UserId,
  ) : [QrEntry] {
    switch (entries.get(userId)) {
      case (?list) { list.toArray() };
      case null { [] };
    };
  };

  public func addEntry(
    entries : Map.Map<UserId, List.List<QrEntry>>,
    nextId : Nat,
    userId : UserId,
    url : Text,
    notes : Text,
    compositeImage : ?Text,
  ) : (QrEntry, Nat) {
    let entry : QrEntry = {
      id = nextId;
      userId;
      url;
      generatedAt = Time.now();
      notes = truncate(notes, 30);
      compositeImage;
    };
    let userList = switch (entries.get(userId)) {
      case (?list) { list };
      case null {
        let newList = List.empty<QrEntry>();
        entries.add(userId, newList);
        newList;
      };
    };
    userList.add(entry);
    (entry, nextId + 1);
  };

  public func deleteEntry(
    entries : Map.Map<UserId, List.List<QrEntry>>,
    userId : UserId,
    entryId : Nat,
  ) : Bool {
    switch (entries.get(userId)) {
      case (?list) {
        let sizeBefore = list.size();
        let filtered = list.filter(func(e : QrEntry) : Bool { e.id != entryId });
        list.clear();
        list.append(filtered);
        list.size() < sizeBefore;
      };
      case null { false };
    };
  };

  public func getPresets(
    presets : Map.Map<UserId, List.List<StylePreset>>,
    userId : UserId,
  ) : [StylePreset] {
    switch (presets.get(userId)) {
      case (?list) { list.toArray() };
      case null { [] };
    };
  };

  public func savePreset(
    presets : Map.Map<UserId, List.List<StylePreset>>,
    nextId : Nat,
    userId : UserId,
    name : Text,
    dotColor : Text,
    bgColor : Text,
    logoData : ?Text,
  ) : (StylePreset, Nat) {
    let preset : StylePreset = {
      id = nextId;
      name;
      dotColor;
      bgColor;
      logoData;
    };
    let userList = switch (presets.get(userId)) {
      case (?list) { list };
      case null {
        let newList = List.empty<StylePreset>();
        presets.add(userId, newList);
        newList;
      };
    };
    userList.add(preset);
    (preset, nextId + 1);
  };

  public func deletePreset(
    presets : Map.Map<UserId, List.List<StylePreset>>,
    userId : UserId,
    presetId : Nat,
  ) : Bool {
    switch (presets.get(userId)) {
      case (?list) {
        let sizeBefore = list.size();
        let filtered = list.filter(func(p : StylePreset) : Bool { p.id != presetId });
        list.clear();
        list.append(filtered);
        list.size() < sizeBefore;
      };
      case null { false };
    };
  };
};
