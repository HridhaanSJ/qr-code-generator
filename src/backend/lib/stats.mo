import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import ProfileTypes "../types/profile";
import StatsTypes "../types/stats";

module {
  public type QrEntry = ProfileTypes.QrEntry;
  public type UserId = ProfileTypes.UserId;
  public type DayStat = StatsTypes.DayStat;

  // Nanoseconds per day
  let nsPerDay : Int = 86_400_000_000_000;

  // Convert a Unix nanosecond timestamp to YYYY-MM-DD
  // Uses the Gregorian calendar proleptic algorithm
  func timestampToDate(ns : Int) : Text {
    // Days since Unix epoch (1970-01-01)
    let daysSinceEpoch : Int = ns / nsPerDay;
    // Shift to the era starting 0000-03-01 (makes leap year math simpler)
    // Algorithm: http://howardhinnant.github.io/date_algorithms.html
    let z : Int = daysSinceEpoch + 719468;
    let era : Int = (if (z >= 0) z else z - 146096) / 146097;
    let doe : Int = z - era * 146097; // day of era [0, 146096]
    let yoe : Int = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365; // year of era [0, 399]
    let y : Int = yoe + era * 400;
    let doy : Int = doe - (365 * yoe + yoe / 4 - yoe / 100); // day of year [0, 365]
    let mp : Int = (5 * doy + 2) / 153; // month of year (0=Mar..11=Feb) [0, 11]
    let d : Int = doy - (153 * mp + 2) / 5 + 1; // day [1, 31]
    let m : Int = if (mp < 10) mp + 3 else mp - 9; // month [1, 12]
    let yr : Int = if (m <= 2) y + 1 else y; // year

    // Format as YYYY-MM-DD with zero-padding
    let ys = yr.toText();
    let ms = if (m < 10) "0" # m.toText() else m.toText();
    let ds = if (d < 10) "0" # d.toText() else d.toText();
    ys # "-" # ms # "-" # ds;
  };

  // Cutoff: 30 days ago in nanoseconds
  func cutoffNs() : Int {
    Time.now() - 30 * nsPerDay;
  };

  // Build a date->count map from an array of entries, filtering to last 30 days
  func buildDateCounts(entries : [QrEntry]) : Map.Map<Text, Nat> {
    let cutoff = cutoffNs();
    let counts = Map.empty<Text, Nat>();
    for (entry in entries.values()) {
      if (entry.generatedAt >= cutoff) {
        let date = timestampToDate(entry.generatedAt);
        let prev = switch (counts.get(date)) {
          case (?n) n;
          case null 0;
        };
        counts.add(date, prev + 1);
      };
    };
    counts;
  };

  // Convert a date->count map to a sorted [DayStat] array
  func countsToStats(counts : Map.Map<Text, Nat>) : [DayStat] {
    let list = List.empty<DayStat>();
    for ((date, count) in counts.entries()) {
      list.add({ date; count });
    };
    // Sort by date ascending (lexicographic on YYYY-MM-DD is chronological)
    list.sortInPlace(func(a : DayStat, b : DayStat) : { #less; #equal; #greater } {
      Text.compare(a.date, b.date)
    });
    list.toArray();
  };

  // Admin stats: aggregate across ALL users
  public func getAdminStats(
    qrEntries : Map.Map<UserId, List.List<QrEntry>>
  ) : [DayStat] {
    let allEntries = List.empty<QrEntry>();
    for ((_userId, userList) in qrEntries.entries()) {
      allEntries.append(userList);
    };
    let counts = buildDateCounts(allEntries.toArray());
    countsToStats(counts);
  };

  // Per-user stats: only entries belonging to the given userId
  public func getMyStats(
    qrEntries : Map.Map<UserId, List.List<QrEntry>>,
    userId : UserId,
  ) : [DayStat] {
    let entries = switch (qrEntries.get(userId)) {
      case (?list) list.toArray();
      case null [];
    };
    let counts = buildDateCounts(entries);
    countsToStats(counts);
  };
};
