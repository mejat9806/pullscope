import Foundation
import UserNotifications
#if os(iOS)
import BackgroundTasks
import UIKit
#endif

/// Polls GitHub notifications and turns new ones into local notifications.
/// GitHub has no push channel for third-party apps, so this only runs while the app is open
/// (every minute) and whenever iOS grants a background refresh.
@MainActor
final class Notifier: NSObject, UNUserNotificationCenterDelegate {
    static let shared = Notifier()
    nonisolated static let refreshID = "dev.local.reviewer.refresh"
    private let center = UNUserNotificationCenter.current()
    private var loop: Task<Void, Never>?
    weak var model: AppModel?
    var onError: ((String) -> Void)?

    var enabled: Bool {
        get { UserDefaults.standard.object(forKey: "notif.on") as? Bool ?? true }
        set { UserDefaults.standard.set(newValue, forKey: "notif.on"); if newValue { startPolling() } else { stopPolling() } }
    }
    private var lastCheck: Date {
        get { UserDefaults.standard.object(forKey: "notif.last") as? Date ?? Date() }
        set { UserDefaults.standard.set(newValue, forKey: "notif.last") }
    }
    private var seen: [String: Date] {
        get { (UserDefaults.standard.dictionary(forKey: "notif.seen") as? [String: Date]) ?? [:] }
        set { UserDefaults.standard.set(newValue, forKey: "notif.seen") }
    }

    func setup(model: AppModel) {
        self.model = model
        center.delegate = self
        let reply = UNTextInputNotificationAction(identifier: "reply", title: "Reply", options: [], textInputButtonTitle: "Send", textInputPlaceholder: "Reply to this pull request")
        let read = UNNotificationAction(identifier: "read", title: "Mark as read", options: [])
        center.setNotificationCategories([UNNotificationCategory(identifier: "pr", actions: [reply, read], intentIdentifiers: [], options: [])])
        center.requestAuthorization(options: [.alert, .sound, .badge, .timeSensitive]) { _, _ in }
        if enabled { startPolling() }
    }

    func startPolling() {
        loop?.cancel()
        guard enabled else { return }
        loop = Task { [weak self] in
            while !Task.isCancelled {
                await self?.poll()
                try? await Task.sleep(for: .seconds(60))
            }
        }
    }
    func stopPolling() { loop?.cancel(); loop = nil }

    @discardableResult
    func poll() async -> Bool {
        guard enabled, let token = TokenStore.load() else { return false }
        let api = GitHubAPI(token: token)
        do {
            let threads = try await api.notifications(since: nil)
            onError?("")
            let cutoff = lastCheck
            var seenNow = seen
            var fresh: [NotificationThread] = []
            for t in threads where t.subject.type == "PullRequest" && t.updatedAt > cutoff && seenNow[t.id] != t.updatedAt {
                fresh.append(t); seenNow[t.id] = t.updatedAt
            }
            seen = seenNow.filter { $0.value > Date().addingTimeInterval(-7 * 86400) }
            if let newest = threads.map(\.updatedAt).max(), newest > cutoff { lastCheck = newest }
            for t in fresh.sorted(by: { $0.updatedAt < $1.updatedAt }) { await post(t, api: api) }
            let unread = threads.filter(\.unread).count
            try? await center.setBadgeCount(unread)
            await LiveWatch.shared.refreshAll()
            return !fresh.isEmpty
        } catch {
            let m = error.localizedDescription
            onError?(m.contains("Not Found") || m.contains("403") || m.contains("scope") ? "Notifications need a classic token with the notifications scope." : m)
            return false
        }
    }

    private static func sentence(_ reason: String) -> String {
        switch reason {
        case "mention", "team_mention": "mentioned you"
        case "review_requested": "requested your review"
        case "assign": "assigned you"
        case "author": "new activity on your pull request"
        case "ci_activity": "checks finished"
        case "state_change": "changed the state"
        default: "new activity"
        }
    }

    private func post(_ t: NotificationThread, api: GitHubAPI) async {
        guard let n = t.number else { return }
        let c = await api.comment(at: t.subject.latestCommentUrl)
        let body = c.map { String($0.body.prefix(220)) }.flatMap { $0.isEmpty ? nil : $0 } ?? Notifier.sentence(t.reason).capitalized
        let who = c?.user ?? ""
        if let model, model.current == PRRef(repo: t.repository.fullName, number: n) { return } // already looking at it
        let m = UNMutableNotificationContent()
        m.title = who.isEmpty ? "\(t.repository.fullName) #\(n)" : "\(who) · \(t.repository.fullName) #\(n)"
        m.subtitle = t.subject.title
        m.body = body
        m.sound = .default
        m.threadIdentifier = "\(t.repository.fullName)#\(n)"
        m.categoryIdentifier = "pr"
        m.userInfo = ["repo": t.repository.fullName, "number": n, "thread": t.id]
        if ["mention", "review_requested", "assign"].contains(t.reason) { m.interruptionLevel = .timeSensitive; m.relevanceScore = 1 }
        try? await center.add(UNNotificationRequest(identifier: "\(t.id)-\(Int(t.updatedAt.timeIntervalSince1970))", content: m, trigger: nil))
        Task { await model?.prefetch(PRRef(repo: t.repository.fullName, number: n)) }
        await LiveWatch.shared.refresh(PRRef(repo: t.repository.fullName, number: n), headline: who.isEmpty ? body : "\(who): \(body)")
    }

    // MARK: UNUserNotificationCenterDelegate

    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification) async -> UNNotificationPresentationOptions {
        [.banner, .list, .sound]
    }

    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse) async {
        let info = response.notification.request.content.userInfo
        guard let repo = info["repo"] as? String, let number = info["number"] as? Int else { return }
        let thread = info["thread"] as? String
        let text = (response as? UNTextInputNotificationResponse)?.userText
        let action = response.actionIdentifier
        await MainActor.run {
            let ref = PRRef(repo: repo, number: number)
            let api = GitHubAPI(token: TokenStore.load())
            switch action {
            case "reply":
                if let text, !text.isEmpty { Task { try? await api.send("POST", "/repos/\(repo)/issues/\(number)/comments", ["body": text]); if self.model?.current == ref { self.model?.reload() } } }
            case "read":
                if let thread { Task { await api.markThreadRead(thread) } }
            default:
                if let thread { Task { await api.markThreadRead(thread) } }
                Task { await self.model?.open(ref) }
            }
        }
    }

    // MARK: Background refresh (iOS)

    #if os(iOS)
    nonisolated static func registerBackgroundRefresh() {
        BGTaskScheduler.shared.register(forTaskWithIdentifier: refreshID, using: nil) { task in
            let work = Task { @MainActor in
                scheduleBackgroundRefresh()
                _ = await Notifier.shared.poll()
                task.setTaskCompleted(success: true)
            }
            task.expirationHandler = { work.cancel() }
        }
    }
    @MainActor static func scheduleBackgroundRefresh() {
        let r = BGAppRefreshTaskRequest(identifier: refreshID)
        r.earliestBeginDate = Date().addingTimeInterval(15 * 60)
        try? BGTaskScheduler.shared.submit(r)
    }
    #endif
}
