# Changelog

All notable changes to Pullscope. Release notes on GitHub are taken from the section whose heading matches the tag (`## [1.0.0]` for `v1.0.0`).

## [Unreleased]

## [1.5.0]

### Added
- **Branch path and stacked PRs.** A *Stack* tab, shown when other open PRs are stacked with this one, draws the branches from where the stack lands up to the tip: a card per PR with its title, branch → base, author and last update. Click a card to put the whole stack in one tab group and open that PR. The tab loads quickly: a light query fetches only the stack, and the last stack seen for a PR is shown at once. (Issue #16.)

## [1.4.1]

### Added
- **Notification settings per repository.** In *Notifications…* pick a repository and set each kind to Default, On or Off. A repository without an override follows the global switches. (Issue #14.)

## [1.4.0]

### Added
- **Choose which notifications you get.** Profile menu → *Notifications…* has a switch for commits, comments, reviews and branch pushes. A switched-off kind shows no desktop notification, bell entry or unread count. (Issue #11.)

### Changed
- **A clearer notifications dropdown.** Each notification has a type icon and label, the title and time sit on one line, long text is trimmed to two lines, and chips at the top filter the list by type. (Issue #12.)
- **Notifications stay highlighted until clicked.** Closing the dropdown or opening another notification no longer marks everything read; each one keeps its highlight and unread count until you click it. (Issue #13.)

## [1.3.9]

### Added
- **Upload images in any text box.** Paste an image, drag it into the box, or use the 🖼 button in the toolbar: the app uploads it to the repository like github.com does and inserts the link. Images show in the editor as a picture or a card. (Issue #8.)

## [1.3.8]

### Fixed
- After you send a comment, reply, review or edit, the text box is now emptied and its saved draft removed. Before, the sent text could reappear in the box. (Issue #7.)

## [1.3.7]

### Changed
- The app checks for updates every hour (was every 6 hours), so the green update button appears without relaunching.
- Developer tooling: the built `ui/app.js` is no longer committed; `scripts/bundle.sh` and the release workflow build it from `web/`. CI runs type checking, ESLint and Prettier as separate jobs. No behaviour change.

## [1.3.6]

### Added
- **Find in page** with `⌘F` / `Ctrl+F`: highlights every match in the current view, with a match counter and next/previous. (Requested in issue #5.)

### Fixed
- Opening a repository now lists **open** pull requests, as GitHub does, instead of keeping the Closed or All choice from the previously opened repository. (Reported in issue #4.)

## [1.3.5]

### Added
- **Close several tabs at once**: right-click a tab for *Close tab*, *Close other tabs*, *Close tabs to the right* and *Close all tabs*. Closed tabs can still be brought back with `⌘⇧T`. (Requested in issue #3.)
- **Tab groups and pinned tabs.** Right-click a tab to *Pin tab* or add it to a *New group* or an existing one. Groups have a name and colour, collapse to one chip, and can be ungrouped or closed together. Pinned tabs are kept by the bulk-close actions. Both are saved across restarts.

## [1.3.4]

### Added
- **Release notes in the app.** The *Update to vX* button now opens *What's new in vX* with the release notes, and you choose *Update and restart* or *Later*. After the restart the notes show once more as *Updated to vX*.

## [1.3.3]

### Added
- **Appearance settings** (account menu → *Appearance…*): choose the font (System, Classic, Serif, Rounded, Monospace), the reading text size, the code size in diffs, the whole-window zoom and comfortable or compact lists, with a live preview and a Reset button. Saved on this machine.

### Changed
- Narrow windows: the toolbar keeps the address bar, new tab, notifications, theme switch and account button and folds the rest away, so nothing is cut off on a phone-sized window; dialogs fit the window width.
- The *Compact lists* entry moved from the account menu into Appearance.

## [1.3.2]

### Added
- **Tooltips on every button**, so each one says what it does (for example *Hide it until tomorrow morning* or *Merge this pull request into the base branch*).

### Changed
- **Reviewers list:** people who gave a verdict come first (changes requested, approved, commented), people still to answer next and bots last. Five reviewers show before the *more reviewers* fold, a pending reviewer's dot is yellow, and the status icons now line up in the same two columns on every row.
- **Re-request button:** the grey refresh button is always visible and turns blue on hover. A reviewer you already asked to review again shows a yellow clock instead, so the two no longer look alike.
- Developer tooling: one-letter names are gone from the web code (`S` is now `appState`, `e` is `event`, `b` is `bundle`, and so on) and ESLint's `id-length` rule keeps them out. No behaviour change.

## [1.3.1]

### Changed
- Developer tooling: the web code is now formatted with Prettier and linted with ESLint, using Citadel's rules adapted for this repo. CI checks both. No behaviour change.

## [1.3.0]

### Added
- **Inbox: pin and snooze.** Hover a row for a bookmark (pin it into a *Pinned* section on top) and a clock (snooze until tomorrow, next week or new activity). Snoozed PRs wait in a *Snoozed* section and come back by themselves.
- **Inbox keyboard control:** `j`/`k` or the arrow keys move, `Enter` opens, `p` pins, `s` snoozes, `e` folds the section, `/` jumps to the filter.
- **Saved views:** save the Inbox filter and sort under a name and pick it again later.
- **Viewed files:** tick *Viewed* on a file in the Files tab to fold it away; the header shows how many are done (`5/12 viewed`). A mark is dropped when the file changes.
- **Copy summary:** a button beside the PR title copies the title, status, size, reviewers and link.
- **Compact lists:** profile menu → *Compact lists* for denser rows.

## [1.2.0]

### Added
- **Rearrange with drag and drop.** Drag the ⋮⋮ grip to reorder the Inbox sections, the repository list in the sidebar, and the blocks in a pull request's side panel (Reviewers, Assignees, Labels, Milestone, Participants). The order is remembered. Inbox sections can also be moved with the up and down arrows, and *Reset order* restores the default. Items slide into place and a thin line shows where the dragged item will land.
- **Edit Labels, Assignees and Milestone.** The gear in the pull request side panel now works: pick from the repository's list and save to GitHub (your token needs write access to the repository).
- **More Inbox sections:** *Mentioned* (open PRs where you were @mentioned), *Participated* (open PRs you commented on or reviewed) and *Recently closed or merged*. A PR appears only in the first section that matches, and they follow your chosen repositories.
- **An easier-to-scan Inbox:** click a section heading to collapse it (or use *Collapse all*), sort every section (newest or oldest activity, most comments, repository, author, title) and filter by title, repository, author or PR number. Collapsed sections and the sort are remembered.
- **Scroll button on every long page:** a down arrow at the top jumps to the bottom, and further down it becomes an up arrow back to the top. `End` and `Home` do the same.

### Changed
- Clicking the dimmed area outside a dialog closes it.

## [1.1.0]

### Added
- Choose which repositories to fetch: a checklist (profile menu → *Choose repositories…*, or the Repos tab) limits the sidebar, address-bar suggestions, inbox search and notification polling to the ticked repositories. The choice is stored locally and start-up no longer requests the full repository list.
- The profile menu shows the app version.
- Issue templates for bug reports and feature requests.

### Changed
- The "Signed in with token" bar that floated over the sidebar list is gone; the status is shown in the profile menu.

## [1.0.0]

### Changed
- The interface is rewritten in Preact and TypeScript, behaviour and look unchanged.
- The app is now called Pullscope.

### Added
- Page zoom with Ctrl/⌘ + mouse wheel and Ctrl/⌘ + `+` / `-` / `0`; the level is remembered (#2).
- Responses from GitHub are cached by ETag. Unchanged data answers `304 Not Modified`, which does not count against the API rate limit.

### Fixed
- Approve and Request changes are no longer offered on your own pull request; only Comment is (#1).
- Images in quoted replies no longer break when GitHub returns an already-expired signed link; the app swaps in a fresh link for the same image.
- Pasting Markdown into the comment editor now renders fenced code, lists and headings in the editor and in Preview, like GitHub.
- The rate-limit error only suggests adding a token when none was sent, and says the limit resets within the hour otherwise.
- Cached responses are skipped when their image links are about to expire.

### Performance
- Lower idle memory: removed always-on blur effects on the toolbar and sidebar, and avatars load lazily.

## [0.1.23]

### Added
- **Docked comment bar** at the bottom of the conversation: collapsed by default, `C` opens it, `Esc` folds it, it opens when you reach the end of the thread and folds when you scroll back up (never while it holds a draft).
- **Conversation sort and date range:** flip newest first / oldest first and limit the conversation to the last hour, 24 hours, 7 or 30 days, or custom dates.
- A scroll-to-top button on long conversations.
- README: how Pullscope compares with reviewing on github.com.

## [0.1.22]

### Changed
- Ticking a task-list checkbox keeps its new state at once instead of waiting for a refresh.
- New pull request: reviewers and labels sit beside the description, and typing backticks makes inline code.

## [0.1.21]

### Added
- **Repository picker** for new pull requests: search, recently pushed first, grouped by owner.
- **Branch picker:** search, your branches first, the rest grouped by prefix, with the age of the last commit.
- **Clickable task lists:** tick a checkbox in a description or comment and the change is saved to GitHub.
- A link button and `⌘K` in the editor toolbar.

## [0.1.20]

### Changed
- Conversation threads also show replies that were posted in a separate review.
- The open pull request refreshes more reliably: it also reacts to new comments and skips the 30-second cache.
- Editor: typing markdown characters no longer turns text bold, italic, struck or code by itself, and typing after a code span or link leaves it.

## [0.1.19]

### Changed
- Drag the window from any empty spot of the toolbar; double-click it to zoom.
- The floating formatting popup over selected text is gone.

## [0.1.18]

### Added
- **Comment menu:** edit, hide and delete your own comments, edit the PR description, and reference a comment in a new issue.

## [0.1.17]

### Changed
- Reviewers you asked to review again show as pending; the first three reviewers show and the rest fold away.

## [0.1.16]

### Changed
- New pull request: every field has its own box.

## [0.1.15]

### Changed
- The open pull request refreshes when the background check sees it change, so the Details panel stays current.

## [0.1.14]

### Added
- New pull request: the description is filled in from the repository's PR template, with a picker when there are several.

## [0.1.13]

### Added
- **Address bar autocomplete:** open tabs, recent PRs, repositories and a repository's PR numbers.

## [0.1.12]

### Changed
- Notifications watch every open tab and the PRs you wrote or were asked to review, without opening them, and skip comment lookups on idle PRs.
- Closing the window quits the app (a short-lived background mode was removed).

## [0.1.11]

### Added
- Profile picture and name in the toolbar, with a menu for your profile, the token and signing out.

## [0.1.10]

### Added
- **Review threads in Files changed:** read, reply to and resolve threads inline, and sort the files.
- **Commit picker in Files changed:** a single commit with Prev / Next, a range of commits, or everything since your last review.

### Changed
- Reactions show at once, and clicking your reaction again removes it, like on github.com.

## [0.1.9]

### Fixed
- A slow PR load no longer replaces the page after you have switched to another tab.

## [0.1.8]

### Added
- **Home filters:** public / private toggle, more sort options and grouping by owner for repositories; a filter and status toggle on the Recent tab.
- Right-click a PR in a list for *Open in new tab*; opening a PR that already has a tab switches to it.

### Changed
- Tabs keep their page alive and remember their sub-tab and scroll position, also across restarts. New tabs open at the top.

### Performance
- Smoother scrolling through long diffs; heavy files on big PRs start collapsed and render when opened.

## [0.1.7]

### Added
- **In-app updates:** an update button installs a signed new version.
- Drag tabs to reorder them; **Required** badges on checks.
- Rust unit tests run in CI.

### Changed
- Long diffs load progressively.

## [0.1.6]

### Changed
- Sign-in is required: without a GitHub token or login the app shows a sign-in screen.

## [0.1.5]

### Fixed
- The installers and all platform icons use the new logo.

## [0.1.4]

### Added
- **Sign in with GitHub** (OAuth device flow).
- **Tabs:** keep several PRs open, with a recent-PRs menu, shortcuts, activity dots, and tabs restored after a restart.
- Filters on a repository's pull request list: search, author, label, status and sort.

### Changed
- The app is renamed Pullscope, with a new icon.
- Launch opens Home instead of the last PR.
- The `/` block menu is removed from the editor; the toolbar and markdown shortcuts stay.

## [0.1.3]

### Added
- **Write / Preview** tabs on every rich editor, rendered by GitHub.
- **Breadcrumbs** on every page, and a full-page **Home** with your repositories and recent PRs.
- The left sidebar can be collapsed.

## [0.1.2]

### Added
- **Manage pull requests:** create a PR (repository, base and head, title, rich description, draft, reviewers, assignees, labels, milestone, linked issues), edit the title and description, mark ready or draft, and a GitHub-style merge box with auto-merge, *Re-run failed* checks and *Update branch*.
- Rich editor for line comments, with a *Suggest change* button.
- Notifications for new branches pushed to repositories you follow, and a *Compare & pull request* banner.
- Collapse or expand every conversation at once.

## [0.1.1]

### Added
- Inbox, menu-bar / tray unread count, keyboard shortcuts, resolving threads, draft reviews and applying suggestions.
- **Split view** with syntax-highlighted diffs: `s` toggles it, `d` switches unified / side by side, `F` flips the sides.

### Changed
- Buttons show a spinner while their action runs; resolving and applying suggestions update at once.
- The offline banner is now a quiet toolbar indicator, and the view keeps its scroll position on refresh.

## [0.1.0]

First release, as *Reviewer*: a Tauri desktop app (and a separate SwiftUI app) for reading GitHub pull requests.
