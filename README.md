# GitHub PR View

A native desktop (Tauri v2, Rust backend + plain HTML/CSS/JS frontend) recreation of GitHub's pull request page, reverse-engineered with REA.

## Run

```bash
export PATH=/opt/homebrew/opt/rustup/bin:$PATH
cd src-tauri
cargo run --bin github-pr-view                       # opens the landing page
cargo run --bin github-pr-view -- octocat/Hello-World#6   # opens a PR directly
```

Paste a PR URL or `owner/repo#number` (header search button, or the landing input).
"Sign in" stores an optional personal access token in the macOS Keychain (unauthenticated: 60 API requests/hour; each PR load uses ~12). The appearance button cycles auto / light / dark.

`cargo run --bin dump -- owner/repo#N ui/fixture.json` records the exact bundle the app renders; the UI can then be previewed in any browser with `python3 -m http.server -d ui` and `?fixture=fixture.json&mode=dark&tab=files`.

## Design

- Why Tauri + HTML: GitHub's page is DOM/CSS (Primer); a WebView reproduces typography, subpixel text and the exact theme tokens (vendored `@primer/css` supplies GitHub's light/dark values). egui/iced/Slint could not match the markdown-rendered bodies or the font rendering 1:1.
- Rust (`src-tauri/src/github.rs`): parses PR refs, fetches PR / issue timeline / files / review comments / reactions / referenced commits / repo counts concurrently from the REST API using `application/vnd.github.full+json` (server-rendered `body_html`), keychain token via `keyring`.
- `evidence/` holds the REA captures (light/dark reference screenshots, DOM) and my app captures for comparison.

## Look and split view

The PR page no longer imitates github.com: `ui/app.css` gives it its own indigo palette, a gradient header card,
chat-style comment bubbles, quiet inline timeline events and card-style sidebar. Primer is kept only for rendered markdown.
Click **Split view** (top right of the PR header) to put the commit list and its diff beside the conversation. Pick a
commit to load just that commit's diff (`fetch_commit`); "All changes" shows the whole PR. Drag the divider to resize;
the choice is remembered. Preview without Tauri: `?fixture=fixture-hello-world-6.json&split=1&mode=dark`.

## Native Swift apps (Mac + iPhone/iPad)

`swift/` holds one SwiftUI codebase that builds a macOS app and an iOS app (no web view).
Needs Xcode and [XcodeGen](https://github.com/yonaskolb/XcodeGen).

```bash
cd swift && xcodegen generate
# Mac:    xcodebuild -project Reviewer.xcodeproj -scheme Reviewer-macOS -configuration Release build
# iPhone: xcodebuild -project Reviewer.xcodeproj -scheme Reviewer-iOS -destination 'platform=iOS Simulator,name=iPhone 18 Pro' build
```

Or open `swift/Reviewer.xcodeproj` in Xcode and run either scheme. On the Mac the token comes from `gh auth token`
(then the Keychain); on iOS paste a token via the key button. Covers the repo/PR browser (filter, sort, group),
conversation with attention chips, account filter and resolved-thread folding, timeline, commits, checks, files, and
write actions (comment, reply, review, merge, close/reopen).

- **Composer shortcuts:** `/` block menu (headings, lists, code, quote, table, suggestion), `@` people on the PR, `:` emoji.
- **Notifications:** polls GitHub every minute while the app is open (and on iOS background refresh), posts local
  notifications with Reply and Mark-as-read actions, sets the badge, and opens the PR on tap. Needs a classic token with
  the `notifications` scope. GitHub has no push channel for third-party apps, so nothing arrives while the app is closed
  beyond what iOS grants for background refresh.
- **Dynamic Island (iOS):** Actions menu, "Show in Dynamic Island" pins a PR as a Live Activity (unresolved threads, checks,
  review decision, latest comment). It refreshes whenever the app polls. Starting one needs the app in the foreground.
- Not ported yet: rich editor, split view, reactions.


## Installers for macOS, Windows and Linux

`.github/workflows/release.yml` builds the app on each platform (macOS Apple Silicon, Windows, Linux).
Run it from the Actions tab ("Build installers" -> Run workflow) to get the installers as downloadable artifacts,
or push a tag (`git tag v0.1.0 && git push --tags`) to publish them as a draft GitHub Release.

- Windows and Linux show a plain banner for notifications (clicking it does not open the PR yet).
- The installers are not code-signed, so macOS (Gatekeeper) and Windows (SmartScreen) warn on first launch.
- The access token is stored in the macOS Keychain, Windows Credential Manager, or the Linux Secret Service (needs a running keyring such as GNOME Keyring); `GITHUB_TOKEN` / `gh auth` also work.
