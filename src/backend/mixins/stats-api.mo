import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import ProfileTypes "../types/profile";
import ProfileLib "../lib/profile";
import StatsLib "../lib/stats";
import StatsTypes "../types/stats";

mixin (
  qrEntries : Map.Map<ProfileTypes.UserId, List.List<ProfileLib.QrEntry>>,
  getAdmin : () -> ?Principal,
) {
  public query ({ caller }) func getAdminStats() : async [StatsTypes.DayStat] {
    switch (getAdmin()) {
      case (?admin) {
        if (not Principal.equal(caller, admin)) {
          Runtime.trap("Unauthorized: admin only");
        };
      };
      case null { Runtime.trap("Unauthorized: no admin set") };
    };
    StatsLib.getAdminStats(qrEntries);
  };

  public query ({ caller }) func getMyStats() : async [StatsTypes.DayStat] {
    StatsLib.getMyStats(qrEntries, caller);
  };
};
