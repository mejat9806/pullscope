# Reviewer

A fast desktop app for reviewing GitHub pull requests. It is built with Tauri v2 (a Rust backend and a plain HTML/CSS/JS frontend), runs on macOS, Windows and Linux, and talks straight to the GitHub API. There is no server in between: your token stays on your machine.

![Conversation](docs/screenshots/conversation.png)

> The screenshots show the public PR [octocat/Hello-World#6](https://github.com/octocat/Hello-World/pull/6) with some sample repositories, checks and reviewers filled in so every screen has something to show.

## What it does

**Read a pull request**
- Conversation, timeline, commits, checks and files tabs, with attention chips (unresolved threads, requested changes, failing checks) and a filter by author.
- Syntax-highlighted diffs, unified or side by side, with collapsible files.
- **Split view**: commits and their diff beside the conversation, resizable, with a flip button and per-pane collapse.
- Collapse or expand every conversation, review and thread in one click.
- **Tabs**: keep several PRs open at once (`⌘T`, `⌘W`, `⌘⇧T`, `⌘1–9`; `⌘`-click or middle-click a PR to open it in a new tab). Tabs survive a restart and show a dot when a background tab has new activity; the + menu lists recent PRs.

![Files changed](docs/screenshots/files-split.png)

![Split view](docs/screenshots/split-view.png)

**Review**
- Line comments with a rich editor (`/` block menu, `@` mentions, `:` emoji), saved as a draft review and submitted together.
- Suggested changes, plus an **Apply suggestion** button that commits the change to the PR branch.
- Resolve and unresolve threads, re-request a review, react to comments.
- **Write / Preview** tabs on every text box. The preview is rendered by GitHub, so it matches what gets posted.

![Line comment](docs/screenshots/line-comment.png)

**Manage the pull request**
- Create a PR: pick repo, base and head, title, rich description, draft option, reviewers, assignees, labels, milestone and linked issues (`Closes #N`).
- Edit the title and description, mark ready for review or convert back to draft, close and reopen.
- A GitHub-style merge box: review status, grouped checks, **Re-run failed** (GitHub Actions), **Update branch**, merge method, **auto-merge**.

![Merge box](docs/screenshots/merge-box.png)

![New pull request](docs/screenshots/new-pr.png)

**Stay on top of things**
- **Home**: all your repositories and recently opened PRs as a full page. Breadcrumbs on every page.
- **Inbox**: PRs waiting on your review, your approved PRs ready to merge, and your own open PRs.
- Notifications for new commits, comments, reviews and new branch pushes (with GitHub's "Compare & pull request" prompt), an unread count in the menu bar / tray, and a quiet offline indicator that falls back to the last saved copy.
- Keyboard shortcuts (press `?` in the app).

![Home](docs/screenshots/home.png)

![Inbox](docs/screenshots/inbox.png)

## Install

Download the installer for your platform from the [Releases page](https://github.com/mejat9806/reviewer/releases): `.dmg` (macOS, Apple silicon), `.exe` / `.msi` (Windows), `.deb` / `.rpm` / `.AppImage` (Linux).

The installers are not code-signed, so macOS (Gatekeeper) and Windows (SmartScreen) warn on first launch. Right-click and choose Open on macOS, or "More info" then "Run anyway" on Windows.

## Sign in

Open the key button (`⌘,`) and paste a **classic** personal access token with the `repo` scope (add `notifications` for the notifications poll). Without a token you can read public pull requests, limited to 60 API requests per hour.

The token is stored in the macOS Keychain, Windows Credential Manager or the Linux Secret Service (a running keyring such as GNOME Keyring is needed). `GITHUB_TOKEN` and `gh auth login` also work.

## Build from source

You need Rust. On macOS, with Homebrew's rustup:

```bash
export PATH=/opt/homebrew/opt/rustup/bin:$PATH
cd src-tauri
cargo run --bin github-pr-view                            # opens Home
cargo run --bin github-pr-view -- octocat/Hello-World#6   # opens a PR directly
```

Build and install a macOS app bundle into `/Applications`:

```bash
bash scripts/bundle.sh
```

The rich editor and syntax highlighter are bundled with esbuild from `editor/`; the output is already committed in `ui/vendor/`. To rebuild them: `cd editor && npm install && npm run build`.

### Preview the UI in a browser

`cargo run --bin dump -- owner/repo#N ui/fixture.json` records the exact data the app renders. The UI can then run in any browser with no GitHub access:

```bash
python3 -m http.server 8765 --directory ui
# http://localhost:8765/index.html?fixture=fixture-hello-world-6.json&mode=dark&tab=files
```

Writing actions need the desktop app; in the browser preview they are disabled.

### Releases

Pushing a `v*` tag runs `.github/workflows/release.yml`, which builds installers for macOS, Windows and Linux and attaches them to a **draft** GitHub Release. Publish the draft from the Releases page.

## Project layout

| Path | What is in it |
|---|---|
| `src-tauri/src/github.rs` | Fetches a PR, its timeline, files, review comments, checks and thread state from the REST and GraphQL APIs |
| `src-tauri/src/lib.rs` | Tauri commands: write actions, branches, create PR, notifications, inbox, markdown preview |
| `ui/app.js`, `ui/app.css` | The whole frontend (no framework) |
| `editor/` | Source of the rich text editor and highlighter bundles |
| `scripts/` | `bundle.sh` builds and installs the macOS app |
| `swift/` | A separate native SwiftUI app (see below) |
| `docs/screenshots/` | Images used in this README |

## Known limits

- Re-running checks only works for GitHub Actions; checks from other services open on GitHub instead.
- "Required" badges on checks are not shown (they need a branch-protection lookup).
- Auto-merge only works if the repository has "Allow auto-merge" turned on.
- Windows and Linux notifications are plain banners; clicking one does not open the PR yet.
- GitHub has no push channel for third-party apps, so notifications are polled about once a minute while the app is open.
- The pieces that talk to GitHub (resolve, apply suggestion, create PR, notifications, re-run) have been exercised by hand on a few repositories, not by an automated test suite.

## Native Swift apps (Mac + iPhone/iPad)

`swift/` holds a SwiftUI codebase that builds a macOS app and an iOS app with no web view. It needs Xcode and [XcodeGen](https://github.com/yonaskolb/XcodeGen).

```bash
cd swift && xcodegen generate
# Mac:    xcodebuild -project Reviewer.xcodeproj -scheme Reviewer-macOS -configuration Release build
# iPhone: xcodebuild -project Reviewer.xcodeproj -scheme Reviewer-iOS -destination 'platform=iOS Simulator,name=iPhone 18 Pro' build
```

On the Mac the token comes from `gh auth token`, then the Keychain; on iOS paste a token with the key button. It covers the repo and PR browser (filter, sort, group), conversation with attention chips, account filter and resolved-thread folding, timeline, commits, checks, files, and write actions (comment, reply, review, merge, close/reopen). Composer shortcuts: `/` block menu, `@` people, `:` emoji. It polls for notifications every minute and can pin a PR as a Live Activity in the Dynamic Island.

Not ported yet: the rich editor, split view and reactions. The Swift app does not have the newer features above (create PR, inbox, line comments, merge box).
