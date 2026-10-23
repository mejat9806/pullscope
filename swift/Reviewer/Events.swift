import SwiftUI

struct CommentCard: View {
    var user: User?
    var date: Date?
    var text: String
    var badge: String?
    var compact = false
    @State private var folded = false
    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: 10) {
                Button { withAnimation(.snappy) { folded.toggle() } } label: {
                    HStack(spacing: 8) {
                        Image(systemName: folded ? "chevron.right" : "chevron.down").font(.caption).foregroundStyle(.secondary).frame(width: 10)
                        Avatar(user: user, size: compact ? 20 : 26)
                        Text(user?.login ?? "ghost").fontWeight(.semibold)
                        Text(date?.ago ?? "").foregroundStyle(.secondary).font(.callout)
                        Spacer()
                        if let b = badge, b != "NONE" { Pill(text: b.capitalized, color: .brandA) }
                    }.contentShape(Rectangle())
                }.buttonStyle(.plain)
                if !folded { MarkdownView(text: text) }
            }
        }
    }
}

/// The timeline: long runs of commits collapse into one row, reviews fold when fully resolved.
struct EventList: View {
    @Environment(AppModel.self) private var model
    var bundle: PRBundle
    var events: [TimelineEvent]

    private enum Item: Identifiable {
        case event(TimelineEvent)
        case run(count: Int, first: String, last: String, id: String)
        var id: String { switch self { case .event(let e): e.id; case .run(_, _, _, let id): id } }
    }

    private var items: [Item] {
        var out: [Item] = [], i = 0
        while i < events.count {
            var j = i
            while j < events.count && events[j].event == "committed" { j += 1 }
            if j - i >= 6 { out.append(.run(count: j - i, first: String(events[i].sha?.prefix(7) ?? ""), last: String(events[j - 1].sha?.prefix(7) ?? ""), id: "run-\(i)")); i = j }
            else { out.append(.event(events[i])); i += 1 }
        }
        return out
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(items) { item in
                switch item {
                case .run(let n, let a, let b, _):
                    Row(icon: "point.topleft.down.to.point.bottomright.curvepath", color: .secondary) {
                        Button { model.tab = .commits } label: { Text("\(Text("\(n) commits").bold())  \(a) … \(b) · view in Commits").font(.callout) }.buttonStyle(.plain)
                    }
                case .event(let e): eventView(e)
                }
            }
            if items.isEmpty { Card { Text(model.unresolvedOnly ? "No unresolved threads." : "Nothing from the selected accounts.").foregroundStyle(.secondary) } }
        }
    }

    @ViewBuilder private func eventView(_ e: TimelineEvent) -> some View {
        switch e.event {
        case "commented": CommentCard(user: e.user, date: e.createdAt, text: e.body ?? "", badge: e.authorAssociation)
        case "reviewed": ReviewBlock(bundle: bundle, event: e)
        case "committed":
            Row(icon: "smallcircle.filled.circle", color: .secondary) {
                VStack(alignment: .leading, spacing: 2) {
                    Text((e.message ?? "").components(separatedBy: "\n").first ?? "").font(.callout).lineLimit(2)
                    Text("\(e.author?.name ?? "") · \(String(e.sha?.prefix(7) ?? ""))").font(.caption.monospaced()).foregroundStyle(.secondary)
                }
            }
        case "merged": line(e, "arrow.triangle.merge", .purple, "merged commit \(String(e.commitId?.prefix(7) ?? ""))")
        case "closed": if bundle.pull.merged != true { line(e, "xmark.circle", .red, "closed this") }
        case "reopened": line(e, "arrow.uturn.backward", .green, "reopened this")
        case "labeled", "unlabeled": line(e, "tag", Color(hex: e.label?.color), "\(e.event == "labeled" ? "added" : "removed") the \(e.label?.name ?? "") label")
        case "assigned", "unassigned": line(e, "person", .secondary, "\(e.event) \(e.assignee?.login ?? "")")
        case "review_requested": line(e, "eye", .secondary, "requested a review from \(e.requestedReviewer?.login ?? "")")
        case "head_ref_force_pushed": line(e, "arrow.up.circle", .secondary, "force-pushed the head branch")
        case "head_ref_deleted": line(e, "trash", .secondary, "deleted the head branch")
        case "ready_for_review": line(e, "eye", .green, "marked this pull request as ready for review")
        case "convert_to_draft": line(e, "circle.dashed", .secondary, "marked this pull request as draft")
        case "renamed": line(e, "pencil", .secondary, "changed the title")
        case "cross-referenced": line(e, "link", .secondary, "mentioned this: \(e.sourceTitle ?? "")")
        case "referenced": line(e, "arrow.triangle.branch", .secondary, "added a commit that referenced this pull request")
        default: EmptyView()
        }
    }
    private func line(_ e: TimelineEvent, _ icon: String, _ color: Color, _ text: String) -> some View {
        Row(icon: icon, color: color) {
            HStack(spacing: 6) { Avatar(user: e.who, size: 18); Text("\(Text(e.who?.login ?? "").bold()) \(text)").font(.callout); Text(e.date?.ago ?? "").font(.caption).foregroundStyle(.secondary) }
        }
    }
}

struct Row<Content: View>: View {
    var icon: String
    var color: Color
    @ViewBuilder var content: Content
    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: icon).font(.caption).foregroundStyle(color).frame(width: 26, height: 26).background(color.opacity(0.14), in: Circle())
            content.frame(maxWidth: .infinity, alignment: .leading).padding(.top, 3)
        }
        .padding(.leading, 6)
    }
}

struct ReviewBlock: View {
    @Environment(AppModel.self) private var model
    var bundle: PRBundle
    var event: TimelineEvent
    @State private var open: Bool

    private var threads: [[ReviewComment]] {
        let cs = bundle.reviewComments.filter { $0.pullRequestReviewId == event.rawId }
        var order: [String] = [], map: [String: [ReviewComment]] = [:]
        for c in cs { let k = "\(c.path)\u{0}\(c.originalPosition ?? c.position ?? 0)"; if map[k] == nil { order.append(k) }; map[k, default: []].append(c) }
        return order.map { map[$0]! }
    }
    private func resolved(_ t: [ReviewComment]) -> Bool { t.contains { bundle.resolvedIDs.contains($0.id) } }

    init(bundle: PRBundle, event: TimelineEvent) {
        self.bundle = bundle; self.event = event
        let cs = bundle.reviewComments.filter { $0.pullRequestReviewId == event.rawId }
        let allRes = !cs.isEmpty && Dictionary(grouping: cs) { "\($0.path)\($0.originalPosition ?? $0.position ?? 0)" }.values.allSatisfy { $0.contains { bundle.resolvedIDs.contains($0.id) } }
        _open = State(initialValue: !allRes)
    }

    var body: some View {
        let all = threads
        let shown = model.unresolvedOnly ? all.filter { !resolved($0) } : all
        if model.unresolvedOnly && shown.isEmpty { EmptyView() } else {
            let nres = all.filter(resolved).count
            let verb: (String, Color, String) = {
                switch (event.state ?? "").lowercased() {
                case "approved": return ("approved these changes", .green, "checkmark.circle.fill")
                case "changes_requested": return ("requested changes", .red, "plusminus.circle.fill")
                case "dismissed": return ("dismissed a review", .secondary, "xmark.circle")
                default: return ("reviewed", .secondary, "eye.fill")
                }
            }()
            VStack(alignment: .leading, spacing: 10) {
                Button { withAnimation(.snappy) { open.toggle() } } label: {
                    HStack(spacing: 8) {
                        Image(systemName: open ? "chevron.down" : "chevron.right").font(.caption).foregroundStyle(.secondary).frame(width: 10)
                        Image(systemName: verb.2).foregroundStyle(verb.1)
                        Avatar(user: event.user, size: 22)
                        Text("\(Text(event.user?.login ?? "").bold()) \(verb.0)").font(.callout)
                        Text(event.date?.ago ?? "").font(.caption).foregroundStyle(.secondary)
                        if !all.isEmpty {
                            Pill(text: nres == all.count ? "All resolved" : "\(all.count) thread\(all.count == 1 ? "" : "s")\(nres > 0 ? " · \(nres) resolved" : "")", color: nres == all.count ? .green : .secondary, icon: nres == all.count ? "checkmark" : nil)
                        }
                        Spacer(minLength: 0)
                    }.contentShape(Rectangle())
                }.buttonStyle(.plain)
                if open {
                    if let b = event.body, !b.isEmpty { Card { MarkdownView(text: b) } }
                    ForEach(shown, id: \.first!.id) { ThreadView(thread: $0, resolved: resolved($0), reactionsOpen: !resolved($0)) }
                }
            }
        }
    }
}

struct ThreadView: View {
    @Environment(AppModel.self) private var model
    var thread: [ReviewComment]
    var resolved: Bool
    var reactionsOpen: Bool
    @State private var open: Bool
    @State private var replying = false

    init(thread: [ReviewComment], resolved: Bool, reactionsOpen: Bool) {
        self.thread = thread; self.resolved = resolved; self.reactionsOpen = reactionsOpen
        _open = State(initialValue: !resolved)
    }

    var body: some View {
        let first = thread[0]
        Card {
            VStack(alignment: .leading, spacing: 10) {
                Button { withAnimation(.snappy) { open.toggle() } } label: {
                    HStack(spacing: 8) {
                        Image(systemName: open ? "chevron.down" : "chevron.right").font(.caption).foregroundStyle(.secondary).frame(width: 10)
                        Text(first.path).font(.caption.monospaced()).lineLimit(1).truncationMode(.head)
                        if resolved { Pill(text: "Resolved", color: .green) }
                        Spacer()
                    }.contentShape(Rectangle())
                }.buttonStyle(.plain)
                if open {
                    if let h = first.diffHunk, !h.isEmpty { DiffView(patch: String(h.components(separatedBy: "\n").suffix(6).joined(separator: "\n"))).background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 8)) }
                    ForEach(thread) { c in
                        HStack(alignment: .top, spacing: 8) {
                            Avatar(user: c.user, size: 24)
                            VStack(alignment: .leading, spacing: 4) {
                                HStack { Text(c.user.login).fontWeight(.semibold); Text(c.createdAt.ago).font(.caption).foregroundStyle(.secondary) }
                                MarkdownView(text: c.body)
                            }
                        }
                    }
                    if replying { TextComposer(placeholder: "Reply…", button: "Reply", minHeight: 50) { let ok = await model.reply(to: first.id, $0); if ok { replying = false }; return ok } }
                    else { Button("Reply…") { replying = true }.buttonStyle(.bordered).controlSize(.small) }
                }
            }
        }
        .id("thread-\(first.id)")
    }
}
