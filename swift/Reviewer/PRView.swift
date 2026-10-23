import SwiftUI

struct PRView: View {
    @Environment(AppModel.self) private var model
    var bundle: PRBundle
    @State private var showReview = false
    @State private var confirmMerge = false
    @State private var confirmClose = false
    @State private var notifOn = Notifier.shared.enabled
    private let live = LiveWatch.shared

    private var p: PullRequest { bundle.pull }
    private var counts: [PRTab: Int] {
        [.conversation: (p.comments ?? 0) + (p.reviewComments ?? 0), .timeline: bundle.timeline.count, .commits: p.commits ?? bundle.commits.count, .checks: bundle.checks.count, .files: p.changedFiles ?? bundle.files.count]
    }

    var body: some View {
        @Bindable var m = model
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 14) {
                header
                tabBar
                switch model.tab {
                case .conversation: ConversationView(bundle: bundle)
                case .timeline: EventList(bundle: bundle, events: bundle.timeline)
                case .commits: CommitsView(bundle: bundle)
                case .checks: ChecksView(checks: bundle.checks)
                case .files: FilesView(files: bundle.files)
                }
            }
            .padding(16).frame(maxWidth: 980).frame(maxWidth: .infinity)
        }
        .refreshable { model.reload() }
        .navigationTitle("#\(p.number) \(p.title)")
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
        .toolbar {
            ToolbarItemGroup {
                Button { model.reload() } label: { Image(systemName: "arrow.clockwise") }.help("Reload")
                if let url = URL(string: p.htmlUrl) { Link(destination: url) { Image(systemName: "safari") }.help("Open on github.com") }
                Menu {
                    Button("Review…", systemImage: "eye") { showReview = true }
                    #if os(iOS)
                    if p.state == "open", let ref = model.current {
                        Button(live.isWatching(ref) ? "Remove from Dynamic Island" : "Show in Dynamic Island", systemImage: "platter.filled.top.iphone") { Task { await live.toggle(ref) } }
                        if !live.error.isEmpty { Text(live.error) }
                    }
                    #endif
                    Toggle(isOn: Binding(get: { notifOn }, set: { notifOn = $0; Notifier.shared.enabled = $0 })) { Label("Notifications", systemImage: "bell") }
                    if !model.notifyError.isEmpty { Text(model.notifyError) }
                    if p.state == "open" {
                        Button("Merge…", systemImage: "arrow.triangle.merge") { confirmMerge = true }
                        Button("Close pull request", systemImage: "xmark.circle", role: .destructive) { confirmClose = true }
                    } else if p.merged != true {
                        Button("Reopen", systemImage: "arrow.uturn.backward") { Task { _ = await model.setState("open") } }
                    }
                } label: { Label("Actions", systemImage: "ellipsis.circle") }
            }
        }
        .sheet(isPresented: $showReview) { ReviewSheet() }
        .confirmationDialog("Merge this pull request?", isPresented: $confirmMerge, titleVisibility: .visible) {
            Button("Merge commit") { Task { _ = await model.merge("merge") } }
            Button("Squash and merge") { Task { _ = await model.merge("squash") } }
            Button("Rebase and merge") { Task { _ = await model.merge("rebase") } }
        } message: { Text("\(p.head.label ?? p.head.ref) will be merged into \(p.base.label ?? p.base.ref). This changes the repository.") }
        .confirmationDialog("Close this pull request?", isPresented: $confirmClose, titleVisibility: .visible) {
            Button("Close pull request", role: .destructive) { Task { _ = await model.setState("closed") } }
        } message: { Text("It will be closed without merging. You can reopen it later.") }
        .overlay(alignment: .top) { if !model.actionError.isEmpty { Text(model.actionError).font(.callout).padding(10).background(.red.opacity(0.9), in: Capsule()).foregroundStyle(.white).padding(.top, 8) } }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(p.repoLine(bundle.repo)).font(.caption).foregroundStyle(.secondary)
            (Text(p.title).font(.title2.bold()) + Text("  #\(p.number)").font(.title2).foregroundStyle(Color.brandA))
                .textSelection(.enabled)
            HStack(spacing: 8) {
                Pill(text: p.status.rawValue.uppercased(), color: p.status.color, icon: p.status.symbol)
                Text("\(Text(p.user.login).bold()) \(p.status == .merged ? "merged" : "wants to merge") \(p.commits ?? 0) commit\(p.commits == 1 ? "" : "s")").font(.callout).foregroundStyle(.secondary)
            }
            HStack(spacing: 6) {
                Branch(text: p.base.label ?? p.base.ref)
                Text("←").foregroundStyle(.secondary)
                Branch(text: p.head.label ?? p.head.ref)
            }
            HStack(spacing: 10) {
                Text("+\(p.additions ?? 0)").foregroundStyle(.green); Text("−\(p.deletions ?? 0)").foregroundStyle(.red)
                ForEach(p.labels ?? [], id: \.name) { l in Text(l.name).font(.caption.weight(.semibold)).padding(.horizontal, 8).padding(.vertical, 2).background(Color(hex: l.color).opacity(0.25), in: Capsule()).foregroundStyle(Color(hex: l.color)) }
            }.font(.callout.monospaced())
        }
        .padding(16).frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.card, in: RoundedRectangle(cornerRadius: 18))
        .overlay(alignment: .top) { Rectangle().fill(Color.brand).frame(height: 4).clipShape(UnevenRoundedRectangle(topLeadingRadius: 18, topTrailingRadius: 18)) }
    }

    private var tabBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                ForEach(PRTab.allCases) { t in
                    Button { model.tab = t } label: {
                        HStack(spacing: 6) {
                            Text(t.rawValue)
                            Text("\(counts[t] ?? 0)").font(.caption2.weight(.bold)).padding(.horizontal, 6).padding(.vertical, 1).background(Color.secondary.opacity(0.2), in: Capsule())
                        }
                        .font(.subheadline.weight(model.tab == t ? .bold : .medium))
                        .padding(.horizontal, 12).padding(.vertical, 7)
                        .background(model.tab == t ? Color.brandA.opacity(0.16) : Color.clear, in: Capsule())
                        .foregroundStyle(model.tab == t ? Color.brandA : .secondary)
                    }.buttonStyle(.plain)
                }
            }
        }
    }
}

extension PullRequest { func repoLine(_ r: String) -> String { r } }

struct Branch: View {
    var text: String
    var body: some View { Text(text).font(.caption.monospaced()).padding(.horizontal, 8).padding(.vertical, 3).background(Color.brandA.opacity(0.13), in: RoundedRectangle(cornerRadius: 8)).foregroundStyle(Color.brandA).lineLimit(1) }
}

struct ReviewSheet: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var event = "COMMENT"
    @State private var text = ""
    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 14) {
                Picker("", selection: $event) { Text("Comment").tag("COMMENT"); Text("Approve").tag("APPROVE"); Text("Request changes").tag("REQUEST_CHANGES") }.pickerStyle(.segmented).labelsHidden()
                TextComposer(placeholder: "Leave a review comment…", button: "Submit review", minHeight: 140) { body in
                    let ok = await model.review(event, body); if ok { dismiss() }; return ok
                }
                Spacer()
            }
            .padding(16).navigationTitle("Submit a review")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } } }
        }
        #if os(macOS)
        .frame(minWidth: 480, minHeight: 360)
        #endif
    }
}

struct CommitsView: View {
    var bundle: PRBundle
    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: 0) {
                ForEach(bundle.commits) { c in
                    HStack(spacing: 10) {
                        Avatar(user: c.author, size: 24)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(c.commit.message.components(separatedBy: "\n").first ?? "").fontWeight(.medium).lineLimit(2)
                            Text("\(c.author?.login ?? c.commit.author?.name ?? "") · \(c.commit.author?.date?.ago ?? "")").font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text(String(c.sha.prefix(7))).font(.caption.monospaced()).foregroundStyle(.secondary)
                    }.padding(.vertical, 8)
                    Divider()
                }
                if bundle.commits.isEmpty { Text("No commits listed.").foregroundStyle(.secondary) }
            }
        }
    }
}

struct ChecksView: View {
    var checks: [Check]
    var body: some View {
        if checks.isEmpty { Card { Text("No checks reported for the latest commit.").foregroundStyle(.secondary) } }
        else {
            let rank: [Check.State: Int] = [.fail: 0, .pending: 1, .pass: 2, .skip: 3]
            let list = checks.sorted { (rank[$0.state]!, $0.name) < (rank[$1.state]!, $1.name) }
            let fail = checks.filter { $0.state == .fail }.count, pend = checks.filter { $0.state == .pending }.count
            VStack(alignment: .leading, spacing: 10) {
                Card {
                    HStack(spacing: 10) {
                        Image(systemName: fail > 0 ? "xmark.circle.fill" : pend > 0 ? "clock.fill" : "checkmark.circle.fill").font(.title2).foregroundStyle(fail > 0 ? .red : pend > 0 ? .orange : .green)
                        Text(fail > 0 ? "\(fail) failing" : pend > 0 ? "\(pend) in progress" : "All checks passed").font(.headline)
                    }
                }
                Card {
                    VStack(alignment: .leading, spacing: 0) {
                        ForEach(list) { c in
                            let row = HStack(spacing: 10) {
                                Image(systemName: c.state.symbol).foregroundStyle(c.state.color)
                                VStack(alignment: .leading) { Text(c.name).fontWeight(.medium); if let a = c.app { Text(a).font(.caption).foregroundStyle(.secondary) } }
                                Spacer()
                                Text(c.duration ?? "").font(.caption.monospacedDigit()).foregroundStyle(.secondary)
                            }.padding(.vertical, 8)
                            if let u = c.url.flatMap(URL.init(string:)) { Link(destination: u) { row }.buttonStyle(.plain) } else { row }
                            Divider()
                        }
                    }
                }
            }
        }
    }
}
extension Check.State {
    var symbol: String { switch self { case .pass: "checkmark.circle.fill"; case .fail: "xmark.circle.fill"; case .pending: "clock.fill"; case .skip: "slash.circle" } }
    var color: Color { switch self { case .pass: .green; case .fail: .red; case .pending: .orange; case .skip: .gray } }
}

struct FilesView: View {
    var files: [FileChange]
    @State private var open: Set<String> = []
    var body: some View {
        if files.isEmpty { Card { Text("No files changed.").foregroundStyle(.secondary) } }
        VStack(spacing: 10) {
            ForEach(files) { f in
                VStack(alignment: .leading, spacing: 0) {
                    Button { if open.contains(f.id) { open.remove(f.id) } else { open.insert(f.id) } } label: {
                        HStack(spacing: 8) {
                            Image(systemName: open.contains(f.id) ? "chevron.down" : "chevron.right").font(.caption).frame(width: 12)
                            Text("+\(f.additions)").foregroundStyle(.green); Text("−\(f.deletions)").foregroundStyle(.red)
                            Text(f.filename).lineLimit(1).truncationMode(.head)
                            Spacer()
                        }.font(.callout.monospaced()).padding(12).contentShape(Rectangle())
                    }.buttonStyle(.plain)
                    if open.contains(f.id) { Divider(); DiffView(patch: f.patch) }
                }
                .background(Color.card, in: RoundedRectangle(cornerRadius: 12))
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.secondary.opacity(0.18)))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
    }
}

struct DiffView: View {
    var patch: String?
    var body: some View {
        if let patch {
            let lines = Array(patch.components(separatedBy: "\n").prefix(400))
            ScrollView(.horizontal, showsIndicators: false) {
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(Array(lines.enumerated()), id: \.offset) { _, l in
                        Text(l.isEmpty ? " " : l).font(.system(size: 12, design: .monospaced)).padding(.horizontal, 10).padding(.vertical, 1)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(l.hasPrefix("+") ? Color.green.opacity(0.18) : l.hasPrefix("-") ? Color.red.opacity(0.18) : l.hasPrefix("@@") ? Color.brandA.opacity(0.14) : .clear)
                    }
                }.frame(minWidth: 0)
            }
            if patch.components(separatedBy: "\n").count > 400 { Text("Diff truncated to 400 lines.").font(.caption).foregroundStyle(.secondary).padding(8) }
        } else { Text("Binary file or diff too large to display.").foregroundStyle(.secondary).padding(12) }
    }
}
