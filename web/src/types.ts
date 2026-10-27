// Domain types for the data Pullscope receives from the Rust backend (GitHub REST/GraphQL, trimmed to what the UI reads).

export type Person = Partial<User> & CommitAuthor
export interface User { login: string; avatar_url?: string; html_url?: string; type?: string }
export interface Label { id?: number; name: string; color: string; description?: string | null }
export interface Reactions { total_count?: number; '+1'?: number; '-1'?: number; laugh?: number; hooray?: number; confused?: number; heart?: number; rocket?: number; eyes?: number }
export interface Ref { ref: string; sha: string; label?: string; repo: { full_name: string; html_url?: string; fork?: boolean }; user?: User }

export interface Pull {
  id: number; number: number; title: string; body: string | null; body_html?: string; state: 'open' | 'closed'; draft: boolean; merged: boolean;
  html_url: string; url?: string; user: User; created_at: string; updated_at: string; closed_at: string | null; merged_at: string | null; merged_by?: User | null;
  head: Ref; base: Ref; labels: Label[]; assignees: User[]; requested_reviewers: User[]; requested_teams?: { name: string; slug?: string }[];
  mergeable: boolean | null; mergeable_state?: string; rebaseable?: boolean; additions: number; deletions: number; changed_files: number;
  comments: number; review_comments: number; commits: number; author_association?: string; reactions?: Reactions; merge_commit_sha?: string | null;
  auto_merge?: { merge_method?: string } | null; milestone?: { title: string; html_url?: string } | null; locked?: boolean;
  stack?: { base: Ref; id: number; number: number; position: number; size: number };
}

export interface FileChange { filename: string; status: string; additions: number; deletions: number; changes: number; patch?: string; sha?: string; previous_filename?: string; blob_url?: string; raw_url?: string }
export interface CommitAuthor { name?: string; email?: string; date?: string }
export interface Commit { parents?: { sha: string }[]; sha: string; html_url: string; author: User | null; committer?: User | null; commit: { message: string; author: CommitAuthor; committer?: CommitAuthor; comment_count?: number; verification?: { verified: boolean; reason?: string } } }
export interface CommitInfo { sha: string; html_url: string; message: string; author: User | null }

export interface ReviewComment {
  id: number; body: string; body_html?: string; path: string; line: number | null; original_line?: number | null; start_line?: number | null; side: 'LEFT' | 'RIGHT'; start_side?: 'LEFT' | 'RIGHT' | null;
  position?: number | null; original_position?: number | null; diff_hunk: string; created_at: string; updated_at: string; html_url: string; user: User;
  pull_request_review_id: number | null; in_reply_to_id?: number; commit_id?: string; original_commit_id?: string; author_association?: string; reactions?: Reactions;
  subject_type?: string; is_copilot_code_review?: boolean; copilot_code_review_sources?: string[];
}

export interface Verification { verified: boolean; reason?: string }
export interface TimelineEvent {
  n?: number; first?: TimelineEvent; last?: TimelineEvent; verification?: Verification; milestone?: { title: string; html_url?: string } | null;
  id?: number; event: string; created_at?: string; submitted_at?: string; actor?: User; user?: User; author?: Person | null;
  body?: string | null; body_html?: string; state?: string; html_url?: string; sha?: string; message?: string; commit_id?: string | null;
  label?: Label; assignee?: User; requested_reviewer?: User; review_requester?: User; requested_team?: { name: string };
  rename?: { from: string; to: string }; author_association?: string; reactions?: Reactions;
  source?: { issue?: { pull_request?: unknown; number: number; title: string; html_url: string; state?: string; repository?: { full_name: string } } };
  committer?: Person | null; parents?: { sha: string }[];
}

export interface Check { description?: string; name: string; status: string; conclusion: string | null; app?: string; url?: string; started_at?: string; completed_at?: string }

export interface Bundle {
  _cached?: boolean;
  pull: Pull; files: FileChange[]; commits: Commit[]; timeline: TimelineEvent[]; review_comments: ReviewComment[]; checks: Check[];
  resolved_ids: number[]; thread_ids: Record<string, string>; required_checks: string[]; commit_info: Record<string, CommitInfo>;
  files_by_commit?: Record<string, FileChange[]>; repo_counts?: { issues: number; pulls: number };
}

export interface ParsedLine { kind: 'hunk' | 'ctx' | 'add' | 'del'; text: string; o?: number; n?: number }
export interface Thread { id: string; path: string; comments: ReviewComment[]; resolved: boolean }

export interface RecentEntry { ref: string; title: string; state: string; icon: string }
export interface Profile { login: string; name?: string | null; avatar_url?: string; html_url?: string }
export interface Tab { ref: string; title: string; state: string; icon: string; tab: string; dot: boolean; scroll?: number }
export interface Note { id: number; ref: string; title: string; text: string; at: string; read?: boolean; target?: string; new?: boolean; kind?: string }
export interface RepoSummary { full_name: string; private: boolean; archived: boolean; pushed_at: string | null; open_issues_count: number; description: string | null }
export interface PrListItem { closed_at?: string | null; number: number; title: string; state: string; draft?: boolean; merged?: boolean; merged_at?: string | null; user: User; updated_at: string; created_at: string; labels: Label[]; html_url: string; comments?: number; head?: Ref; base?: Ref }
export interface Push { branch: string; at: string; actor: string | null; repo: string }
export interface InboxItem { repo: string; number: number; title: string; user: string; avatar: string; updated_at: string; draft: boolean; comments: number; url: string }
export interface Inbox { requested: InboxItem[]; mine: InboxItem[]; ready: InboxItem[] }
export interface Dialog { kind: string; [field: string]: unknown }
export type Mode = 'auto' | 'light' | 'dark';
export type Drafts = Record<string, string>;

export interface AppState {
  profile: Profile | null; bundle: Bundle | null; tab: string; mode: string; error: string; loading: boolean; showAllReviewers: boolean;
  recent: RecentEntry[]; hist: string[]; hi: number; hasToken: boolean; sideTab: string; repos: RepoSummary[] | null; reposErr: string; repoFilter: string;
  repo: string | null; prs: PrListItem[] | null; prState: string; split: boolean; sel: string | null; cdiff: Record<string, string | FileChange[]>; rdiff: Record<string, string | FileChange[]>;
  fr: FrRange | null; lw: number; notes: Note[]; bell: boolean; fold: Record<string, boolean>; hide: Record<string, boolean>; draft: Drafts;
  sbw: number; pf: string; psort: string; pgroup: string; who: string[]; unres: boolean; range: string; rFrom: string; rTo: string; sort: 'asc' | 'desc';
  unIdx: number; nav: boolean; busy: string; actErr: ActErr | null;
  // set after startup
  np?: NewPr | null; keepScroll?: boolean; dlg?: Dlg | null; pop?: Pop | null; view?: string; tabs: Tab[]; tabMenu: boolean; closed: { ref: string; tab: string }[]; focus?: string; eds?: EditorHandle[];
  refreshing?: boolean; diffMode?: string; inbox?: InboxState | null; alive: Map<string, Alive>; oauthLive?: boolean; lcOpen?: string | null; openSeq?: number; me?: string;
  mbOpen?: Set<string>; flip?: boolean; fadeMain?: boolean; draftRef?: string; cpick?: FrRange | null; update?: { version: string; obj: UpdateHandle; busy?: boolean } | null; pending?: Record<string, PendingComment[]>; pStatus?: string; pLabel?: string;
  pAuthor?: string; flashId?: string; tabPending?: string; offline?: boolean; homeOwner?: string; gateErr?: string; pushes: Record<string, Push[]>; prCache?: Record<string, { list: PrListItem[]; at: number }>;
  oauthRun?: number; lastBtn?: HTMLElement | null; cfilter?: string; busySel?: string | null; authChecked?: boolean; applied?: Set<string>; restoring?: boolean | string; recentFilter?: string;
  oauth?: { code?: string; err?: string }; mine?: Record<string, Promise<Set<string>>>; mainStub?: boolean; lastHtml?: string; kbId?: string; ios?: IntersectionObserver[]; homeTab?: string; flashUntil?: number; cOpen?: boolean;
  watchAt?: number; watch?: string[]; recentState?: string; nf?: string; hmVis?: string; hmSort?: string; hmGroup?: string; fileSort?: string; autoFoldFor?: string | number;
}

export interface BranchInfo { default: string; branches: string[]; details: { name: string; at: string | null; by: string | null }[]; can_push: boolean }
export interface RepoMeta { people: { login: string; avatar: string }[]; labels: { name: string; color: string }[]; milestones: { number: number; title: string }[] }
export interface Template { name: string; path: string; body: string }
export interface CompareResult { ahead_by: number; behind_by: number; files: number; commits: string[] }
export interface FreshItem { kind: string; id: number; created_at: string; user: string; body: string }
export interface CheckResult { fresh: FreshItem[]; title: string; state: 'open' | 'closed'; merged: boolean; commits: number; comments: number; review_comments: number; updated_at: string }
export interface DeviceCode { device_code: string; user_code: string; verification_uri: string; interval: number; expires_in: number }
export interface CreatedPr { number: number; html_url: string; warnings: string[] }

export interface Commands {
  cached_pr: Bundle | null; fetch_pr: Bundle; invalidate_pr: void; inbox: Inbox; list_branches: BranchInfo; compare_branches: CompareResult;
  recent_pushes: Push[]; render_markdown: string; repo_meta: RepoMeta; pr_templates: Template[]; create_pr: CreatedPr; list_repos: RepoSummary[];
  list_prs: PrListItem[]; fetch_commit: { files: FileChange[] }; fetch_range: { files: FileChange[] }; viewer_profile: Profile; viewer_login: string;
  my_reactions: string[]; toggle_reaction: { added: boolean }; pr_action: unknown; check_pr: CheckResult; set_unread: void; notify: void;
  open_external: void; initial_arg: string | null; has_token: boolean; set_token: void; device_start: DeviceCode; device_poll: 'ok' | 'pending' | 'slow_down';
}
export type NpListKey = 'reviewers' | 'assignees' | 'labels'
export interface NewPr {
  repo: string; base: string; head: string; title: string; titleTouched: boolean; draft: boolean; err: string; key: string; tplText: string
  branches: Record<string, BranchInfo>; meta: Record<string, RepoMeta>; tpl: Record<string, Template[] | null>
  reviewers: string[]; assignees: string[]; labels: string[]; milestone: string; issues: string
  cmp: CompareResult | string | null
}
export interface InboxState { data: Inbox | null; err: string; loading: boolean }
export interface Alive { el: HTMLElement; eds: EditorHandle[]; bundle: Bundle; tab: string; key: string; scroll: number }

export interface ActErr { k: string; m: string }
export interface ActArgs { body?: string; event?: string; extra?: unknown; kind?: string; id?: number; content?: string; method?: string; number?: number; [field: string]: unknown }
export interface CommentLike { id?: number; node_id?: string; user?: User | null; actor?: User | null; author_association?: string; body?: string | null; body_html?: string; created_at?: string; submitted_at?: string; updated_at?: string; html_url?: string; reactions?: Reactions; state?: string }
export interface PalRow { ref: string; label: string; sub: string }
export interface AcRow { ref?: string; fill?: string; label?: string; title?: string; state?: string; icon?: string; ic?: string; sub?: string }
export interface BpRow { name: string; at: string; by: string }
export type BpGroup = [string, BpRow[]]
export interface FrRange { a: number; b: number }
export interface CommitRow { sha: string; parent?: string; author: User | null; message: string; name?: string; date?: string; url?: string }
export interface PendingComment { id: number; path: string; side: string; line: number; body: string }
export interface Snap { commits: number; comments: number; rc: number; state: string; at?: string }
export type SnapSource = Pick<Pull, 'commits' | 'comments' | 'review_comments' | 'merged' | 'state'>
export type Cmp = (a: PrListItem, b: PrListItem) => number
export type CheckRow = Check & { st: string }
export interface Reviewer { u: User; st: string; prev?: string }

// Open dialog / popup: plain state that a live tree renders. Handlers close over what the action needs.
export type Dlg =
  | { k: 'commits' }
  | { k: 'token' }
  | { k: 'review'; ev: string; ok: () => void | Promise<void> }
  | { k: 'editpr'; title: string; ok: () => void | Promise<void> }
  | { k: 'confirm'; title: string; text: string; label: string; danger: boolean; ok: () => void | Promise<void> }
  | { k: 'editc'; ok: () => void | Promise<void> }
  | { k: 'delc'; ok: () => void | Promise<void> }
  | { k: 'hidec'; reasons: [string, string][]; ok: () => void | Promise<void> };
export type Pop =
  | { k: 'cm'; x: number; y: number; hr: boolean; edit: boolean; hide: boolean; del: boolean; pick: (h: string) => void }
  | { k: 'react'; x: number; y: number; pick: (c: string) => void }
  | { k: 'ctx'; x: number; y: number; pick: (h: string) => void };
