import Foundation

struct User: Codable, Hashable, Sendable {
    var login: String
    var avatarUrl: String?
    var htmlUrl: String?
}
struct PRLabel: Codable, Hashable, Sendable { var name: String; var color: String? }
struct RepoRef: Codable, Hashable, Sendable { var fullName: String; var htmlUrl: String? }
struct BranchRef: Codable, Hashable, Sendable {
    var label: String?
    var ref: String
    var sha: String?
    var repo: RepoRef?
}

struct PullRequest: Codable, Sendable {
    var number: Int
    var title: String
    var state: String
    var draft: Bool?
    var merged: Bool?
    var mergedAt: Date?
    var closedAt: Date?
    var body: String?
    var user: User
    var htmlUrl: String
    var createdAt: Date
    var updatedAt: Date?
    var additions: Int?
    var deletions: Int?
    var changedFiles: Int?
    var commits: Int?
    var comments: Int?
    var reviewComments: Int?
    var head: BranchRef
    var base: BranchRef
    var mergeable: Bool?
    var mergeableState: String?
    var mergedBy: User?
    var labels: [PRLabel]?
    var assignees: [User]?
    var requestedReviewers: [User]?
    var authorAssociation: String?

    enum Status: String { case open = "Open", draft = "Draft", merged = "Merged", closed = "Closed" }
    var status: Status {
        if merged == true || mergedAt != nil { return .merged }
        if state == "closed" { return .closed }
        if draft == true { return .draft }
        return .open
    }
}

/// Lightweight item from the repository PR list.
struct PRItem: Codable, Identifiable, Hashable, Sendable {
    var number: Int
    var title: String
    var state: String
    var draft: Bool?
    var mergedAt: Date?
    var user: User
    var labels: [PRLabel]?
    var createdAt: Date
    var updatedAt: Date
    var base: BranchRef
    var id: Int { number }
    var status: PullRequest.Status {
        if mergedAt != nil { return .merged }
        if state == "closed" { return .closed }
        if draft == true { return .draft }
        return .open
    }
}

struct Repo: Codable, Identifiable, Hashable, Sendable {
    var fullName: String
    var `private`: Bool
    var pushedAt: Date?
    var id: String { fullName }
}

struct GitAuthor: Codable, Hashable, Sendable { var name: String?; var date: Date? }

struct TimelineEvent: Decodable, Identifiable, Sendable {
    var event: String
    var rawId: Int?
    var user: User?
    var actor: User?
    var body: String?
    var createdAt: Date?
    var submittedAt: Date?
    var state: String?
    var sha: String?
    var message: String?
    var commitId: String?
    var label: PRLabel?
    var assignee: User?
    var requestedReviewer: User?
    var author: GitAuthor?
    var htmlUrl: String?
    var authorAssociation: String?
    var sourceTitle: String?
    var index = 0

    var id: String { "\(index)-\(rawId ?? 0)-\(sha ?? "")" }
    var who: User? { user ?? actor }
    var login: String { who?.login ?? author?.name ?? "" }
    var date: Date? { submittedAt ?? createdAt ?? author?.date }

    private struct K: CodingKey {
        var stringValue: String; var intValue: Int? { nil }
        init(_ s: String) { stringValue = s }
        init?(stringValue: String) { self.stringValue = stringValue }
        init?(intValue: Int) { nil }
    }
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: K.self)
        func opt<T: Decodable>(_ k: String) -> T? { try? c.decodeIfPresent(T.self, forKey: K(k)) }
        event = opt("event") ?? "unknown"
        rawId = opt("id"); user = opt("user"); actor = opt("actor"); body = opt("body")
        createdAt = opt("createdAt"); submittedAt = opt("submittedAt"); state = opt("state")
        sha = opt("sha"); message = opt("message"); commitId = opt("commitId"); label = opt("label")
        assignee = opt("assignee"); requestedReviewer = opt("requestedReviewer")
        author = opt("author"); htmlUrl = opt("htmlUrl"); authorAssociation = opt("authorAssociation")
        struct Source: Decodable { struct Issue: Decodable { var title: String? }; var issue: Issue? }
        if let s: Source = opt("source") { sourceTitle = s.issue?.title }
    }
}

struct ReviewComment: Codable, Identifiable, Hashable, Sendable {
    var id: Int
    var pullRequestReviewId: Int?
    var inReplyToId: Int?
    var path: String
    var body: String
    var user: User
    var createdAt: Date
    var diffHunk: String?
    var htmlUrl: String?
    var originalPosition: Int?
    var position: Int?
}

struct FileChange: Codable, Identifiable, Hashable, Sendable {
    var filename: String
    var additions: Int
    var deletions: Int
    var status: String?
    var patch: String?
    var id: String { filename }
}

struct CommitItem: Codable, Identifiable, Hashable, Sendable {
    struct Inner: Codable, Hashable, Sendable { var message: String; var author: GitAuthor? }
    var sha: String
    var htmlUrl: String?
    var commit: Inner
    var author: User?
    var id: String { sha }
}

struct Check: Identifiable, Hashable, Sendable {
    enum State { case pass, fail, pending, skip }
    var name: String
    var status: String
    var conclusion: String?
    var url: String?
    var app: String?
    var startedAt: Date?
    var completedAt: Date?
    var id: String { name + (app ?? "") + (url ?? "") }
    var state: State {
        if status != "completed" { return .pending }
        if conclusion == "success" { return .pass }
        if conclusion == "skipped" || conclusion == "neutral" { return .skip }
        return .fail
    }
    var duration: String? {
        guard let s = startedAt, let e = completedAt, e > s else { return nil }
        let t = Int(e.timeIntervalSince(s))
        return t >= 60 ? "\(t / 60)m \(t % 60)s" : "\(t)s"
    }
}

struct PRBundle: Sendable {
    var pull: PullRequest
    var timeline: [TimelineEvent]
    var files: [FileChange]
    var reviewComments: [ReviewComment]
    var commits: [CommitItem]
    var checks: [Check]
    var resolvedIDs: Set<Int>
    var repo: String { pull.base.repo?.fullName ?? "" }
}

struct PRRef: Hashable, Codable, Sendable {
    var repo: String
    var number: Int
    var text: String { "\(repo)#\(number)" }

    /// Accepts `owner/repo#12` or a github.com pull request URL.
    static func parse(_ input: String) -> PRRef? {
        let s = input.trimmingCharacters(in: .whitespacesAndNewlines)
        if let m = s.firstMatch(of: /^([\w.-]+\/[\w.-]+)#(\d+)$/) { return PRRef(repo: String(m.1), number: Int(m.2)!) }
        if let m = s.firstMatch(of: /github\.com\/([\w.-]+\/[\w.-]+)\/pull\/(\d+)/) { return PRRef(repo: String(m.1), number: Int(m.2)!) }
        return nil
    }
}

struct PRSummary: Sendable {
    var title: String
    var state: String
    var unresolved: Int
    var passing: Int
    var failing: Int
    var pending: Int
    var decision: String
}

struct NotificationThread: Decodable, Sendable {
    struct Subject: Decodable, Sendable { var title: String; var url: String?; var latestCommentUrl: String?; var type: String }
    struct Repo: Decodable, Sendable { var fullName: String }
    var id: String
    var unread: Bool
    var reason: String
    var updatedAt: Date
    var subject: Subject
    var repository: Repo
    var number: Int? { subject.url.flatMap { Int($0.split(separator: "/").last ?? "") } }
}
