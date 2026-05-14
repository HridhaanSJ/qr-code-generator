import Map "mo:core/Map";
import List "mo:core/List";
import ProfileTypes "../types/profile";
import ProfileLib "../lib/profile";

mixin (
  qrEntries : Map.Map<ProfileTypes.UserId, List.List<ProfileLib.QrEntry>>,
  getNextEntryId : () -> Nat,
  setNextEntryId : (Nat) -> (),
  stylePresets : Map.Map<ProfileTypes.UserId, List.List<ProfileLib.StylePreset>>,
  getNextPresetId : () -> Nat,
  setNextPresetId : (Nat) -> (),
) {
  public shared ({ caller }) func getMyQrEntries() : async [ProfileLib.QrEntry] {
    ProfileLib.getEntries(qrEntries, caller);
  };

  public shared ({ caller }) func saveQrEntry(url : Text, notes : Text, compositeImage : ?Text) : async ProfileLib.QrEntry {
    let (entry, newId) = ProfileLib.addEntry(qrEntries, getNextEntryId(), caller, url, notes, compositeImage);
    setNextEntryId(newId);
    entry;
  };

  public shared ({ caller }) func deleteQrEntry(entryId : Nat) : async Bool {
    ProfileLib.deleteEntry(qrEntries, caller, entryId);
  };

  public shared ({ caller }) func saveStylePreset(name : Text, dotColor : Text, bgColor : Text, logoData : ?Text) : async ProfileLib.StylePreset {
    let (preset, newId) = ProfileLib.savePreset(stylePresets, getNextPresetId(), caller, name, dotColor, bgColor, logoData);
    setNextPresetId(newId);
    preset;
  };

  public shared ({ caller }) func getStylePresets() : async [ProfileLib.StylePreset] {
    ProfileLib.getPresets(stylePresets, caller);
  };

  public shared ({ caller }) func deleteStylePreset(id : Nat) : async Bool {
    ProfileLib.deletePreset(stylePresets, caller, id);
  };
};
