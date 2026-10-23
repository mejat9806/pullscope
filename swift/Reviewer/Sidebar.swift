import SwiftUI

struct SidebarView: View {
    @Environment(AppModel.self) private var model
    @State private var address = ""

    var body: some View {
        @Bindable var m = model
        VStack(spacing: 0) {
            VStack(spacing: 10) {
                HStack {
                    Image(systemName: "magnifyingglass").foregroundStyle(.secondary)
                    TextField("owner/repo#123 or URL", text: $address)
                        .textFieldStyle(.plain).autocorrectionDisabledCompat()
                        .onSubmit { model.openText(address); address = "" }
                }
                .padding(8).background(Color.secondary.opacity(0.12), in: RoundedRectangle(cornerRadius: 10))
                Picker("", selection: $m.sideTab) {
                    ForEach(SideTab.allCases.filter { $0 != .prs || model.repo != nil }) { Text($0.rawValue).tag($0) }
                }
                .pickerStyle(.segmented).labelsHidden()
            }
            .padding(12)

            Group {
                switch model.sideTab {
                case .repos: ReposList()
                case .prs: PRsList()
                case .recent: RecentList()
                }
            }
            Divider()
            HStack {
                Image(systemName: model.hasToken ? "checkmark.seal.fill" : "person.crop.circle.badge.questionmark").foregroundStyle(model.hasToken ? .green : .secondary)
                Text(model.hasToken ? "Signed in" : "Anonymous · 60 requests/hour").font(.caption).foregroundStyle(.secondary)
                Spacer()
                Button { model.showTokenSheet = true } label: { Image(systemName: "key") }.buttonStyle(.borderless).help("Access token")
            }
            .padding(10)
        }
        .navigationTitle("Reviewer")
    }
}

struct ReposList: View {
    @Environment(AppModel.self) private var model
    var body: some View {
        @Bindable var m = model
        if !model.hasToken {
            Empty(text: "Add an access token to list your repositories and their pull requests.", button: "Add token") { model.showTokenSheet = true }
        } else if !model.reposError.isEmpty {
            Empty(text: model.reposError)
        } else if let repos = model.repos {
            let f = model.filter.lowercased()
            List {
                TextField("Find a repository…", text: $m.filter).textFieldStyle(.roundedBorder)
                ForEach(repos.filter { f.isEmpty || $0.fullName.lowercased().contains(f) }) { r in
                    Button { Task { await model.openRepo(r.fullName) } } label: {
                        HStack {
                            Image(systemName: r.private ? "lock" : "book.closed").foregroundStyle(.secondary)
                            VStack(alignment: .leading) {
                                Text(r.fullName.split(separator: "/").last.map(String.init) ?? r.fullName).fontWeight(.semibold)
                                Text(r.fullName.split(separator: "/").first.map(String.init) ?? "").font(.caption).foregroundStyle(.secondary)
                            }
                        }
                    }.buttonStyle(.plain)
                }
            }
            .listStyle(.sidebar)
        } else { ProgressView().frame(maxHeight: .infinity) }
    }
}

struct PRsList: View {
    @Environment(AppModel.self) private var model
    var body: some View {
        @Bindable var m = model
        VStack(spacing: 8) {
            HStack {
                Button { m.sideTab = .repos } label: { Image(systemName: "chevron.left") }.buttonStyle(.borderless)
                Text(model.repo ?? "").fontWeight(.semibold).lineLimit(1)
                Spacer()
            }
            .padding(.horizontal, 12)
            Picker("", selection: $m.prState) { Text("Open").tag("open"); Text("Closed").tag("closed"); Text("All").tag("all") }
                .pickerStyle(.segmented).labelsHidden().padding(.horizontal, 12)
                .onChange(of: model.prState) { _, _ in Task { await model.loadPRs() } }
            TextField("Filter title, #, author, label…", text: $m.filter).textFieldStyle(.roundedBorder).padding(.horizontal, 12)
            HStack {
                Menu { Picker("Sort", selection: $m.sort) { ForEach(PRSort.allCases) { Text($0.rawValue).tag($0) } } } label: { Label("Sort: \(model.sort.rawValue)", systemImage: "arrow.up.arrow.down") }
                Menu { Picker("Group", selection: $m.group) { ForEach(PRGroup.allCases) { Text($0.rawValue).tag($0) } } } label: { Label(model.group == .none ? "Group" : model.group.rawValue, systemImage: "square.stack.3d.up") }
            }
            .font(.caption).menuStyle(.borderlessButton).padding(.horizontal, 12)

            if model.prs == nil { ProgressView().frame(maxHeight: .infinity) }
            else {
                let shaped = model.shaped()
                if shaped.allSatisfy({ $0.1.isEmpty }) { Empty(text: model.filter.isEmpty ? "No pull requests." : "No matches.") }
                else {
                    List {
                        ForEach(shaped, id: \.0) { name, items in
                            if name.isEmpty { rows(items) }
                            else { Section { rows(items) } header: { HStack { Text(name); Spacer(); Text("\(items.count)").foregroundStyle(.secondary) } } }
                        }
                    }
                    .listStyle(.sidebar)
                }
            }
        }
    }
    @ViewBuilder private func rows(_ items: [PRItem]) -> some View {
        ForEach(items) { p in
            let ref = PRRef(repo: model.repo ?? "", number: p.number)
            Button { Task { await model.open(ref) } } label: {
                HStack(alignment: .top, spacing: 8) {
                    Image(systemName: p.status.symbol).foregroundStyle(p.status.color).padding(.top, 2)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(p.title).fontWeight(.medium).lineLimit(2)
                        Text("#\(p.number) · \(p.user.login) · \(p.updatedAt.ago)").font(.caption).foregroundStyle(.secondary)
                    }
                }
            }
            .buttonStyle(.plain)
            .listRowBackground(model.current == ref ? Color.brandA.opacity(0.15) : nil)
        }
    }
}

struct RecentList: View {
    @Environment(AppModel.self) private var model
    var body: some View {
        if model.recent.isEmpty { Empty(text: "Pull requests you open appear here.") }
        else {
            List {
                ForEach(model.recent) { r in
                    Button { Task { await model.open(r.ref) } } label: {
                        HStack(alignment: .top, spacing: 8) {
                            let st = PullRequest.Status(rawValue: r.status) ?? .open
                            Image(systemName: st.symbol).foregroundStyle(st.color).padding(.top, 2)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(r.title).fontWeight(.medium).lineLimit(2)
                                Text(r.ref.text).font(.caption).foregroundStyle(.secondary)
                            }
                        }
                    }
                    .buttonStyle(.plain)
                    .listRowBackground(model.current == r.ref ? Color.brandA.opacity(0.15) : nil)
                }
            }
            .listStyle(.sidebar)
        }
    }
}

struct Empty: View {
    var text: String
    var button: String? = nil
    var action: () -> Void = {}
    var body: some View {
        VStack(spacing: 12) {
            Text(text).font(.callout).foregroundStyle(.secondary).multilineTextAlignment(.center)
            if let button { Button(button, action: action).buttonStyle(.borderedProminent).tint(.brandA) }
        }
        .padding(20).frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

extension View {
    @ViewBuilder func autocorrectionDisabledCompat() -> some View {
        #if os(iOS)
        self.autocorrectionDisabled().textInputAutocapitalization(.never)
        #else
        self.autocorrectionDisabled()
        #endif
    }
}
