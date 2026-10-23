import Foundation
import Security

struct APIError: LocalizedError {
    var message: String
    var errorDescription: String? { message }
}

enum TokenStore {
    private static let service = "reviewer-github"
    static func load() -> String? {
        if let t = ProcessInfo.processInfo.environment["GITHUB_TOKEN"], !t.isEmpty { return t }
        #if os(macOS)
        if let t = ghToken() { return t }
        #endif
        let q: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service, kSecReturnData as String: true, kSecMatchLimit as String: kSecMatchLimitOne]
        var out: AnyObject?
        guard SecItemCopyMatching(q as CFDictionary, &out) == errSecSuccess, let d = out as? Data else { return nil }
        return String(data: d, encoding: .utf8)
    }
    static func save(_ token: String) {
        clear()
        let q: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service, kSecValueData as String: Data(token.utf8)]
        SecItemAdd(q as CFDictionary, nil)
    }
    static func clear() {
        SecItemDelete([kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service] as CFDictionary)
    }
    #if os(macOS)
    /// Reuses the GitHub CLI login, so there is no password prompt and nothing to paste.
    static func ghToken() -> String? {
        for path in ["/opt/homebrew/bin/gh", "/usr/local/bin/gh", "/usr/bin/gh"] where FileManager.default.isExecutableFile(atPath: path) {
            let p = Process(); p.executableURL = URL(fileURLWithPath: path); p.arguments = ["auth", "token"]
            let out = Pipe(); p.standardOutput = out; p.standardError = Pipe()
            do { try p.run() } catch { continue }
            let data = out.fileHandleForReading.readDataToEndOfFile(); p.waitUntilExit()
            if p.terminationStatus == 0, let s = String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines), !s.isEmpty { return s }
        }
        return nil
    }
    #endif
}

struct GitHubAPI: Sendable {
    var token: String?
    static let decoder: JSONDecoder = {
        let d = JSONDecoder(); d.keyDecodingStrategy = .convertFromSnakeCase; d.dateDecodingStrategy = .iso8601; return d
    }()

    private func request(_ method: String, _ url: URL, body: Data? = nil) async throws -> Data {
        var r = URLRequest(url: url); r.httpMethod = method; r.timeoutInterval = 30
        r.setValue("application/vnd.github+json", forHTTPHeaderField: "Accept")
        r.setValue("2022-11-28", forHTTPHeaderField: "X-GitHub-Api-Version")
        if let t = token { r.setValue("Bearer \(t)", forHTTPHeaderField: "Authorization") }
        if let b = body { r.httpBody = b; r.setValue("application/json", forHTTPHeaderField: "Content-Type") }
        let (data, resp) = try await URLSession.shared.data(for: r)
        guard let h = resp as? HTTPURLResponse else { throw APIError(message: "No response") }
        guard (200..<300).contains(h.statusCode) else {
            let msg = (try? JSONSerialization.jsonObject(with: data) as? [String: Any])?["message"] as? String ?? "HTTP \(h.statusCode)"
            var hint = ""
            if h.statusCode == 404 && token == nil { hint = " (private repositories need an access token)" }
            if h.statusCode == 403 && h.value(forHTTPHeaderField: "x-ratelimit-remaining") == "0" { hint = " (rate limit reached; add an access token)" }
            throw APIError(message: msg + hint)
        }
        return data
    }

    func get<T: Decodable>(_ path: String, _ query: [String: String] = [:]) async throws -> T {
        var c = URLComponents(string: "https://api.github.com" + path)!
        if !query.isEmpty { c.queryItems = query.sorted { $0.key < $1.key }.map { URLQueryItem(name: $0.key, value: $0.value) } }
        return try Self.decoder.decode(T.self, from: try await request("GET", c.url!))
    }

    /// Pages are fetched six at a time; stops at the first short page.
    func paged<T: Decodable & Sendable>(_ path: String, max: Int, extra: [String: String] = [:]) async throws -> [T] {
        var all: [T] = [], page = 1
        while page <= max {
            let batch = Array(page..<Swift.min(page + 6, max + 1))
            let results: [(Int, [T])] = try await withThrowingTaskGroup(of: (Int, [T]).self) { g in
                for p in batch { g.addTask { (p, try await self.get(path, extra.merging(["per_page": "100", "page": "\(p)"]) { $1 })) } }
                var r: [(Int, [T])] = []
                for try await x in g { r.append(x) }
                return r.sorted { $0.0 < $1.0 }
            }
            var done = false
            for (_, items) in results { all += items; if items.count < 100 { done = true } }
            if done { break }
            page += 6
        }
        return all
    }

    func send(_ method: String, _ path: String, _ body: [String: Any]) async throws {
        _ = try await request(method, URL(string: "https://api.github.com" + path)!, body: try JSONSerialization.data(withJSONObject: body))
    }

    func repos() async throws -> [Repo] {
        try await paged("/user/repos", max: 6, extra: ["sort": "pushed", "affiliation": "owner,collaborator,organization_member"])
    }
    func pulls(repo: String, state: String) async throws -> [PRItem] {
        try await paged("/repos/\(repo)/pulls", max: 2, extra: ["state": state, "sort": "updated", "direction": "desc"])
    }

    func bundle(_ ref: PRRef) async throws -> PRBundle {
        let base = "/repos/\(ref.repo)", n = ref.number
        async let pull: PullRequest = get("\(base)/pulls/\(n)")
        async let tl: [TimelineEvent] = paged("\(base)/issues/\(n)/timeline", max: 30)
        async let files: [FileChange] = paged("\(base)/pulls/\(n)/files", max: 3)
        async let rc: [ReviewComment] = paged("\(base)/pulls/\(n)/comments", max: 3)
        async let cm: [CommitItem]? = try? paged("\(base)/pulls/\(n)/commits", max: 3)
        let (p, timeline, f, comments, commits) = try await (pull, tl, files, rc, cm)
        var events = timeline
        for i in events.indices { events[i].index = i }
        async let checks = loadChecks(repo: ref.repo, sha: p.head.sha)
        async let resolved = loadResolved(ref)
        return PRBundle(pull: p, timeline: events, files: f, reviewComments: comments, commits: commits ?? [], checks: await checks, resolvedIDs: await resolved)
    }

    private func loadChecks(repo: String, sha: String?) async -> [Check] {
        guard let sha else { return [] }
        struct Runs: Decodable { struct Run: Decodable { var name: String; var status: String; var conclusion: String?; var htmlUrl: String?; var startedAt: Date?; var completedAt: Date?; var app: App?; struct App: Decodable { var name: String? } }; var checkRuns: [Run] }
        struct Statuses: Decodable { struct S: Decodable { var context: String; var state: String; var targetUrl: String?; var createdAt: Date?; var updatedAt: Date?; var description: String? }; var statuses: [S] }
        async let r: Runs? = try? get("/repos/\(repo)/commits/\(sha)/check-runs", ["per_page": "100"])
        async let s: Statuses? = try? get("/repos/\(repo)/commits/\(sha)/status", ["per_page": "100"])
        let runs = (await r)?.checkRuns.map { Check(name: $0.name, status: $0.status, conclusion: $0.conclusion, url: $0.htmlUrl, app: $0.app?.name, startedAt: $0.startedAt, completedAt: $0.completedAt) } ?? []
        let sts = (await s)?.statuses.map { st in
            Check(name: st.context, status: st.state == "pending" ? "in_progress" : "completed", conclusion: st.state == "pending" ? nil : (st.state == "success" ? "success" : "failure"), url: st.targetUrl, app: st.description, startedAt: st.createdAt, completedAt: st.updatedAt)
        } ?? []
        return runs + sts
    }

    /// Review thread resolution only exists in GraphQL.
    private func loadResolved(_ ref: PRRef) async -> Set<Int> {
        guard token != nil else { return [] }
        let parts = ref.repo.split(separator: "/").map(String.init)
        let q = "query($o:String!,$n:String!,$p:Int!){repository(owner:$o,name:$n){pullRequest(number:$p){reviewThreads(first:100){nodes{isResolved comments(first:100){nodes{databaseId}}}}}}}"
        let body: [String: Any] = ["query": q, "variables": ["o": parts[0], "n": parts[1], "p": ref.number]]
        guard let data = try? await request("POST", URL(string: "https://api.github.com/graphql")!, body: JSONSerialization.data(withJSONObject: body)),
              let root = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let nodes = (((((root["data"] as? [String: Any])?["repository"] as? [String: Any])?["pullRequest"] as? [String: Any])?["reviewThreads"] as? [String: Any])?["nodes"]) as? [[String: Any]] else { return [] }
        var ids = Set<Int>()
        for t in nodes where t["isResolved"] as? Bool == true {
            for c in ((t["comments"] as? [String: Any])?["nodes"] as? [[String: Any]]) ?? [] { if let i = c["databaseId"] as? Int { ids.insert(i) } }
        }
        return ids
    }

    // MARK: Notifications and live summary

    func notifications(since: Date?) async throws -> [NotificationThread] {
        var q = ["all": "false", "per_page": "50"]
        if let since { q["since"] = ISO8601DateFormatter().string(from: since) }
        return try await get("/notifications", q)
    }

    func markThreadRead(_ id: String) async { try? await send("PATCH", "/notifications/threads/\(id)", [:]) }

    /// Author and text of the comment a notification points at.
    func comment(at urlString: String?) async -> (user: String, body: String)? {
        guard let urlString, let url = URL(string: urlString),
              let data = try? await request("GET", url),
              let o = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return nil }
        let user = (o["user"] as? [String: Any])?["login"] as? String ?? ""
        let body = (o["body"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return (user, body)
    }

    /// One GraphQL round trip: enough for the Dynamic Island without paging a whole timeline.
    func summary(_ ref: PRRef) async -> PRSummary? {
        if let g = await graphSummary(ref) { return g }
        guard let p: PullRequest = try? await get("/repos/\(ref.repo)/pulls/\(ref.number)") else { return nil }
        return PRSummary(title: p.title, state: p.merged == true ? "merged" : p.state, unresolved: 0, passing: 0, failing: 0, pending: 0, decision: "")
    }

    private func graphSummary(_ ref: PRRef) async -> PRSummary? {
        guard token != nil else { return nil }
        let parts = ref.repo.split(separator: "/").map(String.init)
        guard parts.count == 2 else { return nil }
        let q = "query($o:String!,$n:String!,$p:Int!){repository(owner:$o,name:$n){pullRequest(number:$p){title state merged reviewDecision reviewThreads(first:100){nodes{isResolved}} commits(last:1){nodes{commit{statusCheckRollup{contexts(first:100){nodes{__typename ... on CheckRun{status conclusion} ... on StatusContext{state}}}}}}}}}}"
        let body: [String: Any] = ["query": q, "variables": ["o": parts[0], "n": parts[1], "p": ref.number]]
        guard let data = try? await request("POST", URL(string: "https://api.github.com/graphql")!, body: JSONSerialization.data(withJSONObject: body)),
              let root = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let pr = (((root["data"] as? [String: Any])?["repository"] as? [String: Any])?["pullRequest"] as? [String: Any]) else { return nil }
        var out = PRSummary(title: pr["title"] as? String ?? "", state: (pr["merged"] as? Bool == true) ? "merged" : ((pr["state"] as? String)?.lowercased() ?? "open"),
                            unresolved: 0, passing: 0, failing: 0, pending: 0, decision: pr["reviewDecision"] as? String ?? "")
        let threads = ((pr["reviewThreads"] as? [String: Any])?["nodes"] as? [[String: Any]]) ?? []
        out.unresolved = threads.filter { $0["isResolved"] as? Bool == false }.count
        let commit = (((pr["commits"] as? [String: Any])?["nodes"] as? [[String: Any]])?.first?["commit"] as? [String: Any])
        let ctx = (((commit?["statusCheckRollup"] as? [String: Any])?["contexts"] as? [String: Any])?["nodes"] as? [[String: Any]]) ?? []
        for c in ctx {
            if c["__typename"] as? String == "CheckRun" {
                if c["status"] as? String != "COMPLETED" { out.pending += 1 }
                else if ["SUCCESS", "NEUTRAL", "SKIPPED"].contains(c["conclusion"] as? String ?? "") { out.passing += 1 } else { out.failing += 1 }
            } else {
                switch c["state"] as? String ?? "" { case "SUCCESS": out.passing += 1; case "PENDING", "EXPECTED": out.pending += 1; default: out.failing += 1 }
            }
        }
        return out
    }
}
