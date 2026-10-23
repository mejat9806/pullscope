import ActivityKit
import SwiftUI
import WidgetKit

@main
struct ReviewerWidgets: WidgetBundle {
    var body: some Widget { PRLiveActivity() }
}

private let brand = Color(red: 0.49, green: 0.23, blue: 0.93)

private extension PRActivityAttributes.ContentState {
    var tint: Color {
        if state == "merged" { return brand }
        if state == "closed" || failing > 0 || decision == "CHANGES_REQUESTED" { return .red }
        if unresolved > 0 || pending > 0 { return .orange }
        return .green
    }
    var icon: String {
        switch state { case "merged": "arrow.triangle.merge"; case "closed": "xmark.circle.fill"; default: "arrow.triangle.pull" }
    }
    var summary: String {
        if state == "merged" { return "Merged" }
        if state == "closed" { return "Closed" }
        if unresolved > 0 { return "\(unresolved) unresolved" }
        if failing > 0 { return "\(failing) failing" }
        if pending > 0 { return "Checks running" }
        return decision == "APPROVED" ? "Approved" : "All clear"
    }
}

private struct Stats: View {
    let s: PRActivityAttributes.ContentState
    var body: some View {
        HStack(spacing: 12) {
            if s.unresolved > 0 { Label("\(s.unresolved) open", systemImage: "bubble.left.fill").foregroundStyle(.red) }
            if s.passing > 0 { Label("\(s.passing) passing", systemImage: "checkmark.circle.fill").foregroundStyle(.green) }
            if s.failing > 0 { Label("\(s.failing) failing", systemImage: "xmark.circle.fill").foregroundStyle(.red) }
            if s.pending > 0 { Label("\(s.pending) running", systemImage: "clock.fill").foregroundStyle(.orange) }
            if s.decision == "APPROVED" { Label("Approved", systemImage: "hand.thumbsup.fill").foregroundStyle(.green) }
            if s.decision == "CHANGES_REQUESTED" { Label("Changes", systemImage: "plusminus.circle.fill").foregroundStyle(.red) }
        }
        .font(.caption.weight(.semibold)).labelStyle(.titleAndIcon)
    }
}

private struct LockScreen: View {
    let attrs: PRActivityAttributes
    let s: PRActivityAttributes.ContentState
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: s.icon).foregroundStyle(s.tint)
                Text("\(attrs.repo) #\(attrs.number)").font(.caption).foregroundStyle(.secondary)
                Spacer()
                Text(s.summary).font(.caption.weight(.bold)).foregroundStyle(s.tint)
            }
            Text(s.title).font(.headline).lineLimit(2)
            Stats(s: s)
            if !s.headline.isEmpty { Text(s.headline).font(.footnote).foregroundStyle(.secondary).lineLimit(2) }
        }
        .padding(16)
    }
}

struct PRLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: PRActivityAttributes.self) { ctx in
            LockScreen(attrs: ctx.attributes, s: ctx.state)
                .activityBackgroundTint(Color(.systemBackground).opacity(0.85))
        } dynamicIsland: { ctx in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Label("#\(ctx.attributes.number)", systemImage: ctx.state.icon).foregroundStyle(ctx.state.tint).font(.subheadline.bold()).lineLimit(1).fixedSize()
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(ctx.state.summary).font(.subheadline.bold()).foregroundStyle(ctx.state.tint).lineLimit(1).fixedSize()
                }
                DynamicIslandExpandedRegion(.center) {
                    Text(ctx.state.title).font(.subheadline).lineLimit(1)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(alignment: .leading, spacing: 6) {
                        Stats(s: ctx.state)
                        if !ctx.state.headline.isEmpty { Text(ctx.state.headline).font(.footnote).foregroundStyle(.secondary).lineLimit(2) }
                    }.frame(maxWidth: .infinity, alignment: .leading)
                }
            } compactLeading: {
                Image(systemName: ctx.state.icon).foregroundStyle(ctx.state.tint)
            } compactTrailing: {
                if ctx.state.unresolved > 0 { Text("\(ctx.state.unresolved)").font(.caption.bold()).foregroundStyle(.red) }
                else { Image(systemName: ctx.state.failing > 0 ? "xmark" : ctx.state.pending > 0 ? "clock" : "checkmark").foregroundStyle(ctx.state.tint) }
            } minimal: {
                Image(systemName: ctx.state.icon).foregroundStyle(ctx.state.tint)
            }
            .keylineTint(ctx.state.tint)
        }
    }
}
