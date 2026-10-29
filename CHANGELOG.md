# Changelog

All notable changes to Pullscope. Release notes on GitHub are taken from the section whose heading matches the tag (`## [1.0.0]` for `v1.0.0`).

## [Unreleased]

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
