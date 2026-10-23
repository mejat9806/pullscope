import SwiftUI

extension Color {
    static let brandA = Color(red: 0.486, green: 0.227, blue: 0.929)
    static let brandB = Color(red: 0.925, green: 0.282, blue: 0.600)
    static let brand = LinearGradient(colors: [.brandA, .brandB], startPoint: .topLeading, endPoint: .bottomTrailing)
    #if os(macOS)
    static let card = Color(nsColor: .controlBackgroundColor)
    static let canvas = Color(nsColor: .windowBackgroundColor)
    #else
    static let card = Color(uiColor: .secondarySystemGroupedBackground)
    static let canvas = Color(uiColor: .systemGroupedBackground)
    #endif
    init(hex: String?) {
        var v: UInt64 = 0
        Scanner(string: (hex ?? "888888").trimmingCharacters(in: CharacterSet(charactersIn: "#"))).scanHexInt64(&v)
        self.init(red: Double((v >> 16) & 255) / 255, green: Double((v >> 8) & 255) / 255, blue: Double(v & 255) / 255)
    }
}

extension Date {
    var ago: String { RelativeDateTimeFormatter().localizedString(for: self, relativeTo: Date()) }
}

struct Avatar: View {
    var user: User?
    var size: CGFloat = 28
    var body: some View {
        let raw = user?.avatarUrl ?? ""
        let url = URL(string: raw + (raw.contains("?") ? "&s=" : "?s=") + "\(Int(size * 3))")
        AsyncImage(url: url) { img in img.resizable().scaledToFill() } placeholder: {
            Circle().fill(Color.brand).overlay(Text(String((user?.login ?? "?").prefix(1)).uppercased()).font(.system(size: size * 0.45, weight: .bold)).foregroundStyle(.white))
        }
        .frame(width: size, height: size).clipShape(Circle())
    }
}

struct Pill: View {
    var text: String
    var color: Color
    var icon: String? = nil
    var body: some View {
        HStack(spacing: 4) {
            if let icon { Image(systemName: icon) }
            Text(text)
        }
        .font(.caption.weight(.semibold)).padding(.horizontal, 10).padding(.vertical, 4)
        .foregroundStyle(color).background(color.opacity(0.14), in: Capsule())
    }
}

extension PullRequest.Status {
    var color: Color { switch self { case .open: .green; case .draft: .gray; case .merged: .purple; case .closed: .red } }
    var symbol: String { switch self { case .open: "arrow.triangle.pull"; case .draft: "circle.dashed"; case .merged: "arrow.triangle.merge"; case .closed: "xmark.circle" } }
}

struct Card<Content: View>: View {
    @ViewBuilder var content: Content
    var body: some View {
        content.padding(14).frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.card, in: RoundedRectangle(cornerRadius: 14))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.secondary.opacity(0.18)))
    }
}

/// Markdown with fenced code blocks; everything else uses AttributedString.
struct MarkdownView: View {
    var text: String
    private var blocks: [(code: Bool, text: String)] {
        let clean = text.replacingOccurrences(of: "<!--[\\s\\S]*?-->", with: "", options: .regularExpression)
        return clean.components(separatedBy: "```").enumerated().compactMap { i, s in
            if i % 2 == 1 { return (true, s.split(separator: "\n", maxSplits: 1, omittingEmptySubsequences: false).dropFirst().joined(separator: "\n").trimmingCharacters(in: .newlines)) }
            let t = s.trimmingCharacters(in: .whitespacesAndNewlines)
            return t.isEmpty ? nil : (false, t)
        }
    }
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { Text("No description provided.").foregroundStyle(.secondary).italic() }
            ForEach(Array(blocks.enumerated()), id: \.offset) { _, b in
                if b.code {
                    ScrollView(.horizontal, showsIndicators: false) { Text(b.text).font(.system(.footnote, design: .monospaced)).padding(10).textSelection(.enabled) }
                        .background(Color.secondary.opacity(0.12), in: RoundedRectangle(cornerRadius: 8))
                } else {
                    Text((try? AttributedString(markdown: b.text, options: .init(interpretedSyntax: .inlineOnlyPreservingWhitespace))) ?? AttributedString(b.text))
                        .textSelection(.enabled).frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
    }
}

struct Suggestion: Identifiable {
    var id: String { label }
    var label: String
    var detail: String
    var insert: String
}

private let slashItems: [Suggestion] = [
    .init(label: "/h1", detail: "Heading 1", insert: "# "),
    .init(label: "/h2", detail: "Heading 2", insert: "## "),
    .init(label: "/h3", detail: "Heading 3", insert: "### "),
    .init(label: "/bullet", detail: "Bulleted list", insert: "- "),
    .init(label: "/number", detail: "Numbered list", insert: "1. "),
    .init(label: "/todo", detail: "Task list", insert: "- [ ] "),
    .init(label: "/quote", detail: "Quote", insert: "> "),
    .init(label: "/code", detail: "Code block", insert: "```\n\n```"),
    .init(label: "/divider", detail: "Horizontal rule", insert: "\n---\n"),
    .init(label: "/link", detail: "Link", insert: "[text](https://)"),
    .init(label: "/table", detail: "Table", insert: "| a | b |\n|---|---|\n|   |   |"),
    .init(label: "/suggest", detail: "Suggested change", insert: "```suggestion\n\n```"),
]

private let emojiItems: [(String, String)] = [
    ("+1", "👍"), ("-1", "👎"), ("tada", "🎉"), ("heart", "❤️"), ("rocket", "🚀"), ("eyes", "👀"), ("smile", "😄"),
    ("laugh", "😆"), ("thinking", "🤔"), ("fire", "🔥"), ("bug", "🐛"), ("sparkles", "✨"), ("white_check_mark", "✅"),
    ("x", "❌"), ("warning", "⚠️"), ("pray", "🙏"), ("100", "💯"), ("clap", "👏"), ("wave", "👋"), ("point_up", "☝️"),
    ("zap", "⚡"), ("memo", "📝"), ("lock", "🔒"), ("hammer", "🔨"), ("shipit", "🐿️"), ("sob", "😭"), ("joy", "😂"),
]

struct TextComposer: View {
    var placeholder: String
    var button: String
    var minHeight: CGFloat = 70
    var onSend: (String) async -> Bool
    @State private var text = ""
    @Environment(AppModel.self) private var model

    private var people: [User] {
        guard let b = model.bundle else { return [] }
        var seen = Set<String>(), out: [User] = []
        let all: [User?] = [b.pull.user] + b.timeline.flatMap { [$0.user, $0.actor] } + b.reviewComments.map { Optional($0.user) }
        for u in all { if let u, !u.login.hasSuffix("[bot]"), seen.insert(u.login).inserted { out.append(u) } }
        return out
    }

    /// The trailing token being typed, e.g. "@me", "/co", ":sm". The editor exposes no caret, so we assume typing at the end.
    private var token: (trigger: Character, query: String, range: Range<String.Index>)? {
        guard let start = text.lastIndex(where: { $0 == " " || $0 == "\n" }).map({ text.index(after: $0) }) ?? (text.isEmpty ? nil : text.startIndex) else { return nil }
        let word = text[start...]
        guard let t = word.first, "@/:".contains(t), !word.contains(where: { $0 == " " }) else { return nil }
        if t == "/" && start != text.startIndex && text[text.index(before: start)] != "\n" { return nil }
        return (t, String(word.dropFirst()).lowercased(), start..<text.endIndex)
    }

    private var suggestions: [Suggestion] {
        guard let tk = token else { return [] }
        switch tk.trigger {
        case "/": return slashItems.filter { tk.query.isEmpty || $0.label.dropFirst().hasPrefix(tk.query) || $0.detail.lowercased().contains(tk.query) }
        case "@": return people.filter { tk.query.isEmpty || $0.login.lowercased().hasPrefix(tk.query) }.prefix(6).map { .init(label: "@" + $0.login, detail: "", insert: "@" + $0.login + " ") }
        default:
            guard tk.query.count >= 1 else { return [] }
            return emojiItems.filter { $0.0.hasPrefix(tk.query) }.prefix(6).map { .init(label: ":" + $0.0 + ":", detail: $0.1, insert: $0.1 + " ") }
        }
    }

    private func apply(_ s: Suggestion) {
        guard let tk = token else { return }
        text.replaceSubrange(tk.range, with: s.insert)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            let items = suggestions
            if !items.isEmpty {
                VStack(spacing: 0) {
                    ForEach(items) { s in
                        Button { apply(s) } label: {
                            HStack { Text(s.label).fontWeight(.medium); Spacer(); Text(s.detail).foregroundStyle(.secondary) }
                                .padding(.horizontal, 10).padding(.vertical, 7).contentShape(Rectangle())
                        }.buttonStyle(.plain)
                        if s.id != items.last?.id { Divider() }
                    }
                }
                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 10))
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.secondary.opacity(0.25)))
            }
            TextEditor(text: $text).font(.body).autocorrectionDisabled().frame(minHeight: minHeight)
                .scrollContentBackground(.hidden).padding(6)
                .background(Color.secondary.opacity(0.1), in: RoundedRectangle(cornerRadius: 10))
                .overlay(alignment: .topLeading) { if text.isEmpty { Text(placeholder).foregroundStyle(.secondary).padding(.horizontal, 12).padding(.vertical, 14).allowsHitTesting(false) } }
            HStack {
                if !model.actionError.isEmpty { Text(model.actionError).font(.caption).foregroundStyle(.red) }
                Spacer()
                Button(button) { Task { if await onSend(text) { text = "" } } }
                    .buttonStyle(.borderedProminent).tint(.brandA)
                    .disabled(model.busy || text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
        }
    }
}
