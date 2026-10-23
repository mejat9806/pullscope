import SwiftUI

struct ConversationView: View {
    @Environment(AppModel.self) private var model
    var bundle: PRBundle
    @State private var unIdx = 0
    @State private var proxyTarget: Int?

    private var p: PullRequest { bundle.pull }
    private var roots: [ReviewComment] { bundle.reviewComments.filter { $0.inReplyToId == nil } }
    private var openRoots: [ReviewComment] { roots.filter { !bundle.resolvedIDs.contains($0.id) } }

    private var people: [(User, Int)] {
        var m: [String: (User, Int)] = [p.user.login: (p.user, 1)]
        func bump(_ u: User?) { guard let u else { return }; m[u.login] = (u, (m[u.login]?.1 ?? 0) + 1) }
        bundle.timeline.filter { $0.event == "commented" || $0.event == "reviewed" }.forEach { bump($0.user) }
        bundle.reviewComments.forEach { bump($0.user) }
        return m.values.sorted { $0.1 > $1.1 }
    }

    private var events: [TimelineEvent] {
        var list = bundle.timeline
        if !model.who.isEmpty {
            list = list.filter { e in
                model.who.contains(e.login) || (e.event == "reviewed" && bundle.reviewComments.contains { $0.pullRequestReviewId == e.rawId && model.who.contains($0.user.login) })
            }
        }
        return model.unresolvedOnly ? list.filter { $0.event == "reviewed" } : list
    }

    var body: some View {
        @Bindable var m = model
        ScrollViewReader { proxy in
            VStack(alignment: .leading, spacing: 14) {
                attention(proxy)
                if people.count > 1 { whoBar }
                if !model.unresolvedOnly && (model.who.isEmpty || model.who.contains(p.user.login)) {
                    CommentCard(user: p.user, date: p.createdAt, text: p.body ?? "", badge: p.authorAssociation)
                }
                EventList(bundle: bundle, events: events)
                if p.state == "open" || p.merged == true { mergeCard }
                Card { VStack(alignment: .leading, spacing: 8) { Text("Add a comment").font(.headline); TextComposer(placeholder: "Leave a comment (Markdown works)…", button: "Comment") { await model.comment($0) } } }
            }
        }
    }

    private func attention(_ proxy: ScrollViewProxy) -> some View {
        let latest: [String: String] = bundle.timeline.filter { $0.event == "reviewed" && $0.user != nil }.reduce(into: [:]) { acc, e in
            let s = (e.state ?? "").lowercased(); if s == "commented", acc[e.login] != nil { return }; acc[e.login] = s
        }
        let cr = latest.values.filter { $0 == "changes_requested" }.count, ap = latest.values.filter { $0 == "approved" }.count
        let fail = bundle.checks.filter { $0.state == .fail }.count, pend = bundle.checks.filter { $0.state == .pending }.count, pass = bundle.checks.filter { $0.state == .pass }.count
        let known = model.hasToken || !bundle.resolvedIDs.isEmpty
        return ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                if !roots.isEmpty {
                    if !known { Chip(text: "\(roots.count) review thread\(roots.count == 1 ? "" : "s")", color: .secondary, icon: "bubble.left") }
                    else if !openRoots.isEmpty {
                        Button { jump(proxy) } label: { Chip(text: "\(openRoots.count) unresolved thread\(openRoots.count == 1 ? "" : "s")", color: .red, icon: "bubble.left.fill") }.buttonStyle(.plain)
                    } else { Chip(text: "All threads resolved", color: .green, icon: "checkmark.circle.fill") }
                }
                Chip(text: cr > 0 ? "\(cr) requesting changes" : ap > 0 ? "\(ap) approved" : "No approvals yet", color: cr > 0 ? .red : ap > 0 ? .green : .secondary, icon: cr > 0 ? "plusminus" : ap > 0 ? "checkmark" : "eye")
                if !bundle.checks.isEmpty {
                    Button { model.tab = .checks } label: { Chip(text: fail > 0 ? "\(fail) check\(fail == 1 ? "" : "s") failing" : pend > 0 ? "\(pend) running" : "\(pass) passed", color: fail > 0 ? .red : pend > 0 ? .orange : .green, icon: fail > 0 ? "xmark.circle.fill" : pend > 0 ? "clock.fill" : "checkmark.circle.fill") }.buttonStyle(.plain)
                }
                if p.merged == true { Chip(text: "Merged", color: .purple, icon: "arrow.triangle.merge") }
                else if p.state == "closed" { Chip(text: "Closed", color: .red, icon: "xmark.circle") }
                else if p.mergeable == false || p.mergeableState == "dirty" { Chip(text: "Has conflicts", color: .red, icon: "exclamationmark.triangle.fill") }
                else if p.mergeableState == "clean" { Chip(text: "Ready to merge", color: .green, icon: "arrow.triangle.merge") }
                if !roots.isEmpty {
                    Button { model.unresolvedOnly.toggle() } label: { Chip(text: "Unresolved only", color: .brandA, icon: "line.3.horizontal.decrease", filled: model.unresolvedOnly) }.buttonStyle(.plain)
                }
            }
        }
    }

    private func jump(_ proxy: ScrollViewProxy) {
        guard !openRoots.isEmpty else { return }
        let c = openRoots[unIdx % openRoots.count]; unIdx += 1
        withAnimation { proxy.scrollTo("thread-\(c.id)", anchor: .center) }
    }

    private var whoBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                Label("Show", systemImage: "person").font(.caption.weight(.bold)).foregroundStyle(.secondary)
                Button { model.who = [] } label: { Chip(text: "Everyone", color: .brandA, filled: model.who.isEmpty) }.buttonStyle(.plain)
                ForEach(people, id: \.0.login) { u, n in
                    Button { if model.who.contains(u.login) { model.who.remove(u.login) } else { model.who.insert(u.login) } } label: {
                        HStack(spacing: 5) { Avatar(user: u, size: 16); Text(u.login); Text("\(n)").foregroundStyle(.secondary) }
                            .font(.caption.weight(.semibold)).padding(.horizontal, 10).padding(.vertical, 5)
                            .background(model.who.contains(u.login) ? Color.brandA.opacity(0.25) : Color.secondary.opacity(0.12), in: Capsule())
                    }.buttonStyle(.plain)
                }
            }
        }
    }

    private var mergeCard: some View {
        let clean = p.mergeableState == "clean" || p.mergeable != false
        return Card {
            HStack(spacing: 10) {
                Image(systemName: p.merged == true ? "arrow.triangle.merge" : clean ? "checkmark.circle.fill" : "exclamationmark.triangle.fill").font(.title2).foregroundStyle(p.merged == true ? .purple : clean ? .green : .red)
                VStack(alignment: .leading) {
                    Text(p.merged == true ? "Pull request successfully merged and closed" : clean ? "This branch has no conflicts with the base branch" : "This branch has conflicts that must be resolved").fontWeight(.semibold)
                    if p.merged != true { Text(clean ? "Merging can be performed automatically." : "Resolve conflicts on the command line or on github.com.").font(.caption).foregroundStyle(.secondary) }
                }
            }
        }
    }
}

struct Chip: View {
    var text: String
    var color: Color
    var icon: String? = nil
    var filled = false
    var body: some View {
        HStack(spacing: 5) { if let icon { Image(systemName: icon) }; Text(text) }
            .font(.caption.weight(.semibold)).padding(.horizontal, 11).padding(.vertical, 6)
            .foregroundStyle(filled ? Color.white : color)
            .background(filled ? AnyShapeStyle(Color.brand) : AnyShapeStyle(color.opacity(0.14)), in: Capsule())
            .fixedSize()
    }
}

