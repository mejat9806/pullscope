# Changelog

All notable changes to Pullscope. Release notes on GitHub are taken from the section whose heading matches the tag (`## [1.0.0]` for `v1.0.0`).

## [Unreleased]

### Added
- Rearrange the Inbox: drag a section by its grip, or use the up and down arrows on its heading. The order is remembered, and *Reset order* restores the default.
- A scroll button on every long page: a down arrow at the top jumps to the bottom, and once you are further down it becomes an up arrow back to the top. `End` also jumps to the bottom (`Home` to the top).
- The Inbox has three more sections: **Mentioned** (open PRs where you were @mentioned), **Participated** (open PRs you commented on or reviewed) and **Recently closed or merged** (PRs you were involved in). A PR appears only in the first section that matches. They follow your chosen repositories.
- The Inbox is easier to scan: click a section heading to collapse it (or use *Collapse all*), sort every section (newest or oldest activity, most comments, repository, author, title), and filter by title, repository, author or PR number. Mentioned and Participated now come before *Your pull requests*. Collapsed sections and the sort are remembered.

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
