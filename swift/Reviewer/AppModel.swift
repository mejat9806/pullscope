import SwiftUI
import Observation

enum SideTab: String, CaseIterable, Identifiable { case repos = "Repos", prs = "PRs", recent = "Recent"; var id: String { rawValue } }
enum PRTab: String, CaseIterable, Identifiable { case conversation = "Conversation", timeline = "Timeline", commits = "Commits", checks = "Checks", files = "Files"; var id: String { rawValue } }
enum PRSort: String, CaseIterable, Identifiable { case updated = "Recently updated", created = "Newest", oldest = "Oldest", number = "Number", title = "Title A–Z", author = "Author"; var id: String { rawValue } }
enum PRGroup: String, CaseIterable, Identifiable { case none = "No grouping", status = "Status", author = "Author", label = "Label", base = "Base branch"; var id: String { rawValue } }

struct RecentPR: Codable, Identifiable, Hashable { var ref: PRRef; var title: String; var status: String; var id: PRRef { ref } }

@MainActor @Observable
final class AppModel {
    var token: String? = TokenStore.load()
    var sideTab: SideTab = .recent
    var repos: [Repo]?
    var reposError = ""
    var repo: String?
    var prState = "open"
    var prs: [PRItem]?
    var recent: [RecentPR] = []
    var bundle: PRBundle?
    var current: PRRef?
    var loading = false
    var error = ""
    var busy = false
    var actionError = ""
    var tab: PRTab = .conversation
    var who: Set<String> = []
    var unresolvedOnly = false
    var filter = ""
    var sort: PRSort = PRSort(rawValue: UserDefaults.standard.string(forKey: "sort") ?? "") ?? .updated { didSet { UserDefaults.standard.set(sort.rawValue, forKey: "sort") } }
    var group: PRGroup = PRGroup(rawValue: UserDefaults.standard.string(forKey: "group") ?? "") ?? .none { didSet { UserDefaults.standard.set(group.rawValue, forKey: "group") } }
    var showTokenSheet = false
    var notifyError = ""
    private var warm: [PRRef: (bundle: PRBundle, at: Date)] = [:]
    var wantDetail = false

    var api: GitHubAPI { GitHubAPI(token: token) }
    var hasToken: Bool { token != nil }

    init() {
        if let d = UserDefaults.standard.data(forKey: "recent"), let r = try? JSONDecoder().decode([RecentPR].self, from: d) { recent = r }
        sideTab = token == nil ? .recent : .repos
    }

    func start() {
        let arg = CommandLine.arguments.dropFirst().compactMap(PRRef.parse).first
        if let ref = arg ?? recent.first?.ref { Task { await open(ref) } }
        if hasToken { Task { await loadRepos() } }
        Notifier.shared.onError = { [weak self] in self?.notifyError = $0 }
        Notifier.shared.setup(model: self)
    }

    func saveToken(_ t: String) {
        let s = t.trimmingCharacters(in: .whitespacesAndNewlines)
        if s.isEmpty { TokenStore.clear() } else { TokenStore.save(s) }
        token = TokenStore.load()
        repos = nil
        if hasToken { Task { await loadRepos() } }
    }

    func loadRepos() async {
        reposError = ""
        do { repos = try await api.repos() } catch { reposError = error.localizedDescription; repos = [] }
    }

    func openRepo(_ name: String) async {
        repo = name; sideTab = .prs
        await loadPRs()
    }
    func loadPRs() async {
        guard let name = repo else { return }
        prs = nil
        do { let r = try await api.pulls(repo: name, state: prState); if repo == name { prs = r } } catch { if repo == name { prs = [] } }
    }

    /// Background fetch for a PR a notification just announced, so opening it is instant.
    func prefetch(_ ref: PRRef) async {
        if let b = try? await api.bundle(ref) { warm[ref] = (b, Date()) }
    }

    func open(_ ref: PRRef, keepTab: Bool = false) async {
        if !keepTab, let w = warm[ref], Date().timeIntervalSince(w.at) < 120 {
            current = ref; wantDetail = true; error = ""; tab = .conversation; who = []; unresolvedOnly = false
            bundle = w.bundle; loading = false; remember(ref, w.bundle.pull); warm[ref] = nil
            if repo != w.bundle.repo { repo = w.bundle.repo; Task { await loadPRs() } }
            return
        }
        current = ref; wantDetail = true; error = ""
        if !keepTab { tab = .conversation; who = []; unresolvedOnly = false }
        loading = bundle == nil || bundle?.repo != ref.repo || bundle?.pull.number != ref.number
        if loading { bundle = nil }
        do {
            let b = try await api.bundle(ref)
            guard current == ref else { return }
            bundle = b
            remember(ref, b.pull)
            Task { await LiveWatch.shared.refresh(ref) }
            if repo != b.repo { repo = b.repo; Task { await loadPRs() } }
        } catch { if current == ref { self.error = error.localizedDescription } }
        loading = false
    }

    func reload() { if let r = current { Task { await open(r, keepTab: true) } } }

    private func remember(_ ref: PRRef, _ p: PullRequest) {
        recent = ([RecentPR(ref: ref, title: p.title, status: p.status.rawValue)] + recent.filter { $0.ref != ref }).prefix(30).map { $0 }
        if let d = try? JSONEncoder().encode(recent) { UserDefaults.standard.set(d, forKey: "recent") }
    }

    func openText(_ s: String) {
        guard let ref = PRRef.parse(s) else { error = "Use owner/repo#123 or a pull request URL."; return }
        Task { await open(ref) }
    }

    // MARK: Write actions
    func act(_ run: @escaping (GitHubAPI, PRRef) async throws -> Void) async -> Bool {
        guard let ref = current else { return false }
        busy = true; actionError = ""
        defer { busy = false }
        do { try await run(api, ref); await open(ref, keepTab: true); return true }
        catch { actionError = error.localizedDescription; return false }
    }
    func comment(_ body: String) async -> Bool { await act { a, r in try await a.send("POST", "/repos/\(r.repo)/issues/\(r.number)/comments", ["body": body]) } }
    func reply(to id: Int, _ body: String) async -> Bool { await act { a, r in try await a.send("POST", "/repos/\(r.repo)/pulls/\(r.number)/comments/\(id)/replies", ["body": body]) } }
    func review(_ event: String, _ body: String) async -> Bool { await act { a, r in try await a.send("POST", "/repos/\(r.repo)/pulls/\(r.number)/reviews", ["event": event, "body": body]) } }
    func merge(_ method: String) async -> Bool { await act { a, r in try await a.send("PUT", "/repos/\(r.repo)/pulls/\(r.number)/merge", ["merge_method": method]) } }
    func setState(_ state: String) async -> Bool { await act { a, r in try await a.send("PATCH", "/repos/\(r.repo)/pulls/\(r.number)", ["state": state]) } }

    // MARK: PR list shaping
    func shaped() -> [(String, [PRItem])] {
        let f = filter.lowercased()
        var list = (prs ?? []).filter { f.isEmpty || "#\($0.number) \($0.title) \($0.user.login) \(($0.labels ?? []).map(\.name).joined(separator: " "))".lowercased().contains(f) }
        switch sort {
        case .updated: list.sort { $0.updatedAt > $1.updatedAt }
        case .created: list.sort { $0.createdAt > $1.createdAt }
        case .oldest: list.sort { $0.createdAt < $1.createdAt }
        case .number: list.sort { $0.number > $1.number }
        case .title: list.sort { $0.title.localizedCompare($1.title) == .orderedAscending }
        case .author: list.sort { ($0.user.login, $1.number) < ($1.user.login, $0.number) }
        }
        if group == .none { return [("", list)] }
        var buckets: [String: [PRItem]] = [:]
        for p in list {
            switch group {
            case .status: buckets[p.status.rawValue, default: []].append(p)
            case .author: buckets[p.user.login, default: []].append(p)
            case .base: buckets[p.base.ref, default: []].append(p)
            case .label: if let ls = p.labels, !ls.isEmpty { ls.forEach { buckets[$0.name, default: []].append(p) } } else { buckets["No label", default: []].append(p) }
            case .none: break
            }
        }
        let order = group == .status ? ["Open", "Draft", "Merged", "Closed"] : buckets.keys.sorted { ($0 == "No label" ? 1 : 0, $0) < ($1 == "No label" ? 1 : 0, $1) }
        return order.compactMap { k in buckets[k].map { (k, $0) } }
    }
}
