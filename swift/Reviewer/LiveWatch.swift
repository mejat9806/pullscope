import Foundation
import Observation
#if os(iOS)
import ActivityKit
#endif

/// Pull requests pinned to the Dynamic Island / Lock Screen as Live Activities (iOS only; a no-op on the Mac).
@MainActor @Observable
final class LiveWatch {
    static let shared = LiveWatch()
    private(set) var watched: Set<String> = Set(UserDefaults.standard.stringArray(forKey: "watched") ?? [])
    var supported: Bool {
        #if os(iOS)
        ActivityAuthorizationInfo().areActivitiesEnabled
        #else
        false
        #endif
    }

    var error = ""

    func isWatching(_ ref: PRRef) -> Bool {
        #if os(iOS)
        watched.contains(ref.key) && Activity<PRActivityAttributes>.activities.contains { $0.attributes.repo == ref.repo && $0.attributes.number == ref.number }
        #else
        false
        #endif
    }

    func toggle(_ ref: PRRef) async {
        error = ""
        if isWatching(ref) { watched.remove(ref.key); save(); await end(ref) }
        else { watched.insert(ref.key); save(); await refresh(ref) }
    }

    func refreshAll() async { for k in watched { if let r = PRRef.parse(k) { await refresh(r) } } }

    private func save() { UserDefaults.standard.set(Array(watched), forKey: "watched") }

    func refresh(_ ref: PRRef, headline: String? = nil) async {
        #if os(iOS)
        guard watched.contains(ref.key) else { return }
        guard let s = await GitHubAPI(token: TokenStore.load()).summary(ref) else { error = "Dynamic Island: couldn't load this pull request."; return }
        let existing = Activity<PRActivityAttributes>.activities.first { $0.attributes.repo == ref.repo && $0.attributes.number == ref.number }
        let state = PRActivityAttributes.ContentState(title: s.title, state: s.state, unresolved: s.unresolved, passing: s.passing, failing: s.failing,
                                                      pending: s.pending, decision: s.decision, headline: headline ?? existing?.content.state.headline ?? "")
        let content = ActivityContent(state: state, staleDate: Date().addingTimeInterval(30 * 60))
        if s.state != "open" {
            watched.remove(ref.key); save()
            await existing?.end(content, dismissalPolicy: .after(Date().addingTimeInterval(3600)))
            return
        }
        if let existing { await existing.update(content) }
        else if ActivityAuthorizationInfo().areActivitiesEnabled {
            do { _ = try Activity.request(attributes: PRActivityAttributes(repo: ref.repo, number: ref.number), content: content, pushType: nil) }
            catch { self.error = "Dynamic Island: \(error.localizedDescription)" }
        } else { error = "Live Activities are turned off for Reviewer in Settings." }
        #endif
    }

    private func end(_ ref: PRRef) async {
        #if os(iOS)
        for a in Activity<PRActivityAttributes>.activities where a.attributes.repo == ref.repo && a.attributes.number == ref.number {
            await a.end(nil, dismissalPolicy: .immediate)
        }
        #endif
    }
}

extension PRRef { var key: String { "\(repo)#\(number)" } }
