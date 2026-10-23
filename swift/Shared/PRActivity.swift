#if os(iOS)
import ActivityKit

/// Shared by the app (which starts and updates the activity) and the widget extension (which draws it).
struct PRActivityAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var title: String
        var state: String          // open, merged, closed
        var unresolved: Int
        var passing: Int
        var failing: Int
        var pending: Int
        var decision: String       // APPROVED, CHANGES_REQUESTED, REVIEW_REQUIRED, ""
        var headline: String       // latest activity, e.g. "mejat9806: LGTM"
    }
    var repo: String
    var number: Int
}
#endif
