import SwiftUI

@main
struct ReviewerApp: App {
    @State private var model = AppModel()
    @Environment(\.scenePhase) private var phase
    #if os(iOS)
    init() { Notifier.registerBackgroundRefresh() }
    #endif
    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(model)
                #if os(macOS)
                .frame(minWidth: 900, minHeight: 600)
                #endif
                .tint(.brandA)
                .onChange(of: phase) { _, new in
                    #if os(iOS)
                    if new == .active { Notifier.shared.startPolling() }
                    else if new == .background { Notifier.shared.stopPolling(); Notifier.scheduleBackgroundRefresh() }
                    #endif
                }
        }
        #if os(macOS)
        .defaultSize(width: 1280, height: 860)
        .windowToolbarStyle(.unified)
        #endif
    }
}

struct RootView: View {
    @Environment(AppModel.self) private var model
    @State private var column: NavigationSplitViewColumn = .sidebar

    var body: some View {
        @Bindable var m = model
        NavigationSplitView(preferredCompactColumn: $column) {
            SidebarView()
                .navigationSplitViewColumnWidth(min: 250, ideal: 310, max: 480)
        } detail: {
            DetailView()
        }
        .onChange(of: model.wantDetail) { _, v in if v { column = .detail; model.wantDetail = false } }
        .sheet(isPresented: $m.showTokenSheet) { TokenSheet() }
        .task { model.start() }
    }
}

struct DetailView: View {
    @Environment(AppModel.self) private var model
    var body: some View {
        Group {
            if let b = model.bundle { PRView(bundle: b) }
            else if model.loading { VStack(spacing: 12) { ProgressView(); Text("Loading pull request…").foregroundStyle(.secondary) }.frame(maxWidth: .infinity, maxHeight: .infinity) }
            else { Landing() }
        }
        .background(Color.canvas)
    }
}

struct Landing: View {
    @Environment(AppModel.self) private var model
    var body: some View {
        VStack(spacing: 14) {
            Image(systemName: "arrow.triangle.pull").font(.system(size: 44)).foregroundStyle(Color.brand)
            Text("Open a pull request").font(.title2.bold())
            Text("Type owner/repo#123 or paste a pull request URL in the sidebar.").foregroundStyle(.secondary).multilineTextAlignment(.center)
            if !model.error.isEmpty { Text(model.error).foregroundStyle(.red).multilineTextAlignment(.center) }
        }
        .padding(32).frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct TokenSheet: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var text = ""
    var body: some View {
        NavigationStack {
            Form {
                Section {
                    SecureField("ghp_…", text: $text)
                } header: { Text("Personal access token") } footer: {
                    Text("A classic token with the repo scope lets Reviewer list private repositories, comment, review and merge. It is stored in your Keychain. Public pull requests work without one.")
                }
                if model.hasToken { Section { Button("Remove saved token", role: .destructive) { model.saveToken(""); dismiss() } } }
            }
            .formStyle(.grouped)
            .navigationTitle("Access token")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) { Button("Save") { model.saveToken(text); dismiss() }.disabled(text.trimmingCharacters(in: .whitespaces).isEmpty) }
            }
        }
        #if os(macOS)
        .frame(minWidth: 460, minHeight: 320)
        #endif
    }
}
