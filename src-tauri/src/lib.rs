pub mod github;
#[cfg(target_os = "macos")]
mod native_notify;

use moka::future::Cache as AsyncCache;
use quick_cache::sync::Cache as FastCache;
use serde_json::Value;
use std::sync::{Arc, LazyLock};
use std::time::Duration;

// moka: async, time-based. Concurrent requests for one key share a single in-flight fetch (try_get_with).
static PR_CACHE: LazyLock<AsyncCache<String, Value>> = LazyLock::new(|| AsyncCache::builder().max_capacity(64).time_to_live(Duration::from_secs(30)).build());
static PR_LIST_CACHE: LazyLock<AsyncCache<String, Value>> = LazyLock::new(|| AsyncCache::builder().max_capacity(32).time_to_live(Duration::from_secs(20)).build());
// quick_cache: lock-light sync caches. Last PR bundle per PR (skips disk + JSON parse) and commits (immutable by sha).
static PR_MEM: LazyLock<FastCache<String, Value>> = LazyLock::new(|| FastCache::new(128));
static COMMITS: LazyLock<FastCache<String, Value>> = LazyLock::new(|| FastCache::new(256));

fn pr_key(pr: &github::PrRef) -> String { format!("{}/{}#{}", pr.owner, pr.repo, pr.number).to_lowercase() }

/// Last saved copy of a PR, for instant display while the fresh one loads.
#[tauri::command]
fn cached_pr(url: String) -> Option<serde_json::Value> {
    let pr = github::parse_pr_ref(&url).ok()?;
    let key = pr_key(&pr);
    if let Some(b) = PR_MEM.get(&key) { return Some(b); }
    let text = std::fs::read_to_string(github::cache_path(&pr)?).ok()?;
    let mut b: serde_json::Value = serde_json::from_str(&text).ok()?;
    b["_cached"] = true.into();
    PR_MEM.insert(key, b.clone());
    Some(b)
}

#[tauri::command]
async fn fetch_pr(url: String) -> Result<serde_json::Value, String> {
    let pr = github::parse_pr_ref(&url)?;
    let key = pr_key(&pr);
    let b = PR_CACHE.try_get_with(key.clone(), fetch_pr_uncached(url)).await.map_err(|e: Arc<String>| (*e).clone())?;
    // An offline fallback must not be remembered as if it were fresh.
    if b.get("_cached").is_some() { PR_CACHE.invalidate(&key).await; } else { PR_MEM.insert(key, b.clone()); }
    Ok(b)
}

/// Drop the cached copy of one PR so the next `fetch_pr` goes to GitHub (after writes, or a manual refresh).
#[tauri::command]
async fn invalidate_pr(url: String) -> Result<(), String> {
    PR_CACHE.invalidate(&pr_key(&github::parse_pr_ref(&url)?)).await;
    PR_LIST_CACHE.invalidate_all();
    Ok(())
}

async fn fetch_pr_uncached(url: String) -> Result<serde_json::Value, String> {
    let pr = github::parse_pr_ref(&url)?;
    // Dev/testing: serve a recorded bundle instead of hitting the API (see the `dump` binary).
    if let Ok(path) = std::env::var("GPV_FIXTURE") {
        let text = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
        return serde_json::from_str(&text).map_err(|e| e.to_string());
    }
    let token = github::load_token();
    let cache = github::cache_path(&pr);
    match github::fetch_bundle(&pr, token.as_deref()).await {
        Ok(bundle) => {
            if let Some(p) = &cache {
                let _ = std::fs::create_dir_all(p.parent().unwrap());
                let _ = std::fs::write(p, serde_json::to_vec(&bundle).unwrap_or_default());
            }
            Ok(bundle)
        }
        // Offline or rate limited: fall back to the last saved copy of this PR.
        Err(e) => cache
            .and_then(|p| std::fs::read_to_string(p).ok())
            .and_then(|t| serde_json::from_str::<serde_json::Value>(&t).ok())
            .map(|mut b| { b["_cached"] = true.into(); b })
            .ok_or(e),
    }
}

static INBOX: LazyLock<AsyncCache<String, Value>> = LazyLock::new(|| AsyncCache::builder().max_capacity(4).time_to_live(Duration::from_secs(45)).build());

/// PRs that need you: review requested, your own open PRs, and your PRs that are approved (ready to merge).
#[tauri::command]
async fn inbox(force: Option<bool>) -> Result<serde_json::Value, String> {
    if force == Some(true) { INBOX.invalidate_all(); }
    INBOX.try_get_with("inbox".to_string(), async {
        let token = github::load_token().ok_or("Add an access token (key button) to see your inbox.")?;
        let c = github::client();
        let run = |q: &str| {
            let url = format!("https://api.github.com/search/issues?per_page=30&sort=updated&order=desc&q={}", q.replace(' ', "+").replace(':', "%3A").replace('@', "%40"));
            let (c, t) = (c.clone(), token.clone());
            async move {
                let v = github::get(&c, &url, Some(&t)).await?;
                let items: Vec<Value> = v["items"].as_array().cloned().unwrap_or_default().into_iter().map(|i| {
                    let repo = i["repository_url"].as_str().unwrap_or("").rsplit("/repos/").next().unwrap_or("").to_string();
                    serde_json::json!({ "repo": repo, "number": i["number"], "title": i["title"], "user": i["user"]["login"], "avatar": i["user"]["avatar_url"],
                        "updated_at": i["updated_at"], "draft": i["draft"], "comments": i["comments"], "url": i["html_url"] })
                }).collect();
                Ok::<Vec<Value>, String>(items)
            }
        };
        let (a, b, d) = tokio::join!(run("is:pr is:open archived:false review-requested:@me"), run("is:pr is:open archived:false author:@me"), run("is:pr is:open archived:false author:@me review:approved draft:false"));
        Ok::<Value, String>(serde_json::json!({ "requested": a?, "mine": b?, "ready": d? }))
    }).await.map_err(|e: Arc<String>| (*e).clone())
}

/// Every repository the token can see (owned, collaborator, organization), most recently pushed first.
#[tauri::command]
async fn list_repos() -> Result<serde_json::Value, String> {
    let token = github::load_token().ok_or("Add an access token (key button) to browse your repositories.")?;
    let c = github::client();
    let url = "https://api.github.com/user/repos?sort=pushed&affiliation=owner,collaborator,organization_member";
    let repos = github::get_paged(&c, url, Some(&token), 5).await?;
    let slim: Vec<_> = repos
        .into_iter()
        .map(|r| serde_json::json!({
            "full_name": r["full_name"], "private": r["private"], "archived": r["archived"],
            "pushed_at": r["pushed_at"], "open_issues_count": r["open_issues_count"], "description": r["description"],
        }))
        .collect();
    Ok(serde_json::Value::Array(slim))
}

/// Pull requests of one repository (`state`: open | closed | all).
#[tauri::command]
async fn list_prs(repo: String, state: String) -> Result<serde_json::Value, String> {
    if !matches!(state.as_str(), "open" | "closed" | "all") || repo.matches('/').count() != 1 {
        return Err("bad request".into());
    }
    let key = format!("{repo}|{state}").to_lowercase();
    PR_LIST_CACHE.try_get_with(key, async move {
        let token = github::load_token();
        let c = github::client();
        let url = format!("https://api.github.com/repos/{repo}/pulls?state={state}&sort=updated&direction=desc");
        let prs = github::get_paged(&c, &url, token.as_deref(), 2).await?;
        Ok::<Value, String>(Value::Array(prs))
    }).await.map_err(|e: Arc<String>| (*e).clone())
}

/// One commit with its file patches (for the split view's commit pane).
#[tauri::command]
async fn fetch_commit(repo: String, sha: String) -> Result<serde_json::Value, String> {
    if repo.matches('/').count() != 1 || !sha.chars().all(|c| c.is_ascii_hexdigit()) {
        return Err("bad request".into());
    }
    let key = format!("{repo}@{sha}").to_lowercase();
    if let Some(c) = COMMITS.get(&key) { return Ok(c); }
    let token = github::load_token();
    let url = format!("https://api.github.com/repos/{repo}/commits/{sha}");
    let c = github::get(&github::client(), &url, token.as_deref()).await?;
    COMMITS.insert(key, c.clone());
    Ok(c)
}

/// Write actions on a pull request. Only these whitelisted actions are accepted.
/// `comment`: body. `reply`: id + body. `review`: event (APPROVE|REQUEST_CHANGES|COMMENT) + body.
/// `merge`: method (merge|squash|rebase). `close` / `reopen`.
#[tauri::command]
async fn pr_action(repo: String, number: u64, action: String, body: Option<String>, id: Option<u64>, event: Option<String>, method: Option<String>, kind: Option<String>, content: Option<String>, extra: Option<serde_json::Value>) -> Result<serde_json::Value, String> {
    use reqwest::Method;
    if repo.matches('/').count() != 1 || repo.contains("..") || repo.contains(char::is_whitespace) {
        return Err("bad repository".into());
    }
    let token = github::load_token();
    let base = format!("https://api.github.com/repos/{repo}");
    let text = body.clone().unwrap_or_default();
    let (m, url, payload) = match action.as_str() {
        "comment" if !text.trim().is_empty() => (Method::POST, format!("{base}/issues/{number}/comments"), serde_json::json!({ "body": text })),
        "reply" if !text.trim().is_empty() && id.is_some() => (Method::POST, format!("{base}/pulls/{number}/comments/{}/replies", id.unwrap()), serde_json::json!({ "body": text })),
        "rerequest" if !text.trim().is_empty() && text.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '[' || c == ']') => (Method::POST, format!("{base}/pulls/{number}/requested_reviewers"), serde_json::json!({ "reviewers": [text] })),
        "resolve" | "unresolve" if text.starts_with("PRRT_") && text.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-') => {
            let field = if action == "resolve" { "resolveReviewThread" } else { "unresolveReviewThread" };
            let q = format!("mutation($id:ID!){{{field}(input:{{threadId:$id}}){{thread{{isResolved}}}}}}");
            let r = github::send(&github::client(), Method::POST, "https://api.github.com/graphql", token.as_deref(), serde_json::json!({ "query": q, "variables": { "id": text } })).await?;
            if let Some(e) = r["errors"].get(0) { return Err(e["message"].as_str().unwrap_or("GitHub refused the request").to_string()); }
            PR_CACHE.invalidate(&format!("{repo}#{number}").to_lowercase()).await;
            return Ok(r);
        }
        "suggest" => {
            use base64::Engine;
            let x = extra.ok_or("missing suggestion")?;
            let s = |k: &str| x[k].as_str().unwrap_or("").to_string();
            let (head, branch, path, sugg) = (s("head_repo"), s("branch"), s("path"), s("text"));
            let (end, start) = (x["line"].as_u64().ok_or("This comment is outdated, so its line is gone.")? as usize, x["start_line"].as_u64().map(|v| v as usize));
            if head.matches('/').count() != 1 || head.contains("..") || path.contains("..") || path.is_empty() || branch.is_empty() {
                return Err("bad suggestion target".into());
            }
            let start = start.unwrap_or(end);
            if start == 0 || start > end { return Err("bad line range".into()); }
            let c = github::client();
            let u = format!("https://api.github.com/repos/{head}/contents/{path}");
            let cur = github::get(&c, &format!("{u}?ref={branch}"), token.as_deref()).await?;
            let sha = cur["sha"].as_str().ok_or("Could not read the file on the PR branch.")?.to_string();
            let raw = base64::engine::general_purpose::STANDARD.decode(cur["content"].as_str().unwrap_or("").replace('\n', "")).map_err(|e| e.to_string())?;
            let file = String::from_utf8(raw).map_err(|_| "File is not UTF-8 text.".to_string())?;
            let crlf = file.contains("\r\n");
            let mut lines: Vec<&str> = file.split('\n').collect();
            if end > lines.len() { return Err("The file changed since this suggestion; the line no longer exists.".into()); }
            let new_lines: Vec<&str> = if sugg.is_empty() { vec![] } else { sugg.split('\n').collect() };
            lines.splice(start - 1..end, new_lines);
            let mut out = lines.join("\n");
            if crlf { out = out.replace("\r\n", "\n").replace('\n', "\r\n"); }
            let msg = format!("Apply suggestion to {path}");
            let payload = serde_json::json!({ "message": msg, "content": base64::engine::general_purpose::STANDARD.encode(out), "sha": sha, "branch": branch });
            let r = github::send(&c, Method::PUT, &u, token.as_deref(), payload).await?;
            PR_CACHE.invalidate(&format!("{repo}#{number}").to_lowercase()).await;
            return Ok(r);
        }
        "review" => {
            let ev = event.unwrap_or_default();
            if !["APPROVE", "REQUEST_CHANGES", "COMMENT"].contains(&ev.as_str()) {
                return Err("bad review type".into());
            }
            let line_comments = extra.clone().filter(|v| v.is_array()).unwrap_or(serde_json::json!([]));
            let has_lines = line_comments.as_array().map_or(false, |a| !a.is_empty());
            if ev != "APPROVE" && text.trim().is_empty() && !has_lines {
                return Err("A comment is required for this review type.".into());
            }
            let mut p = serde_json::json!({ "event": ev, "body": text });
            if has_lines { p["comments"] = line_comments; }
            (Method::POST, format!("{base}/pulls/{number}/reviews"), p)
        }
        "merge" => {
            let mm = method.unwrap_or_else(|| "merge".into());
            if !["merge", "squash", "rebase"].contains(&mm.as_str()) {
                return Err("bad merge method".into());
            }
            (Method::PUT, format!("{base}/pulls/{number}/merge"), serde_json::json!({ "merge_method": mm }))
        }
        "react" => {
            let c = content.unwrap_or_default();
            if !["+1", "-1", "laugh", "confused", "heart", "hooray", "rocket", "eyes"].contains(&c.as_str()) {
                return Err("bad reaction".into());
            }
            let url = match (kind.as_deref(), id) {
                (Some("issue_comment"), Some(i)) => format!("{base}/issues/comments/{i}/reactions"),
                (Some("review_comment"), Some(i)) => format!("{base}/pulls/comments/{i}/reactions"),
                (Some("pr"), _) => format!("{base}/issues/{number}/reactions"),
                _ => return Err("bad reaction target".into()),
            };
            (Method::POST, url, serde_json::json!({ "content": c }))
        }
        "close" => (Method::PATCH, format!("{base}/pulls/{number}"), serde_json::json!({ "state": "closed" })),
        "reopen" => (Method::PATCH, format!("{base}/pulls/{number}"), serde_json::json!({ "state": "open" })),
        "comment" | "reply" => return Err("Write something first.".into()),
        _ => return Err("unknown action".into()),
    };
    let r = github::send(&github::client(), m, &url, token.as_deref(), payload).await;
    if r.is_ok() { PR_CACHE.invalidate(&format!("{repo}#{number}").to_lowercase()).await; PR_LIST_CACHE.invalidate_all(); }
    r
}

/// Cheap activity snapshot of one PR, used by the notification poller.
#[tauri::command]
async fn check_pr(repo: String, number: u64, since: Option<String>) -> Result<serde_json::Value, String> {
    if repo.matches('/').count() != 1 {
        return Err("bad repo".into());
    }
    let token = github::load_token();
    let c = github::client();
    let p = github::get(&c, &format!("https://api.github.com/repos/{repo}/pulls/{number}"), token.as_deref()).await?;
    let g = |k: &str| p.get(k).cloned().unwrap_or(serde_json::Value::Null);
    // Comments created since the last snapshot, so a notification can point at the newest one.
    let mut fresh: Vec<serde_json::Value> = Vec::new();
    if let Some(s) = since.filter(|s| s.len() < 40 && s.chars().all(|c| c.is_ascii_digit() || "-:TZ.+".contains(c))) {
        for (kind, path) in [("issue", "issues"), ("review", "pulls")] {
            let u = format!("https://api.github.com/repos/{repo}/{path}/{number}/comments?since={s}&per_page=50");
            if let Ok(serde_json::Value::Array(list)) = github::get(&c, &u, token.as_deref()).await {
                for x in list {
                    fresh.push(serde_json::json!({
                        "kind": kind, "id": x["id"], "created_at": x["created_at"],
                        "user": x["user"]["login"], "body": x["body"].as_str().unwrap_or("").chars().take(120).collect::<String>(),
                    }));
                }
            }
        }
    }
    Ok(serde_json::json!({
        "fresh": fresh,
        "title": g("title"), "state": g("state"), "merged": g("merged"), "commits": g("commits"),
        "comments": g("comments"), "review_comments": g("review_comments"), "updated_at": g("updated_at"),
    }))
}

/// Menu-bar / system-tray icon: click to bring the window back, with the unread count shown beside it.
fn build_tray(app: &tauri::AppHandle) -> tauri::Result<()> {
    use tauri::{menu::{Menu, MenuItem}, tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent}, Manager};
    let open = MenuItem::with_id(app, "open", "Open Reviewer", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&open, &quit])?;
    let show = |app: &tauri::AppHandle| { if let Some(w) = app.get_webview_window("main") { let _ = w.show(); let _ = w.unminimize(); let _ = w.set_focus(); } };
    TrayIconBuilder::with_id("main")
        .icon(tauri::image::Image::from_bytes(include_bytes!("../icons/32x32.png"))?)
        .tooltip("Reviewer")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(move |app, ev| match ev.id().as_ref() { "open" => show(app), "quit" => app.exit(0), _ => {} })
        .on_tray_icon_event(move |tray, ev| {
            if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = ev { show(tray.app_handle()); }
        })
        .build(app)?;
    Ok(())
}

/// Shows the unread notification count next to the tray icon (macOS title) and in its tooltip.
#[tauri::command]
fn set_unread(app: tauri::AppHandle, count: u32) {
    use tauri::Manager;
    if let Some(tray) = app.tray_by_id("main") {
        let _ = tray.set_title(if count > 0 { Some(count.to_string()) } else { None::<String> });
        let _ = tray.set_tooltip(Some(if count > 0 { format!("Reviewer — {count} unread") } else { "Reviewer".to_string() }));
    }
}

/// Desktop notification. macOS uses a native banner that opens `pr_ref` (and jumps to `target`) when clicked;
/// Windows and Linux use the notification plugin (a plain banner, not clickable).
#[tauri::command]
fn notify(app: tauri::AppHandle, title: String, body: String, pr_ref: Option<String>, target: Option<String>) {
    #[cfg(target_os = "macos")]
    {
        let _ = &app;
        if native_notify::send(&title, &body, pr_ref.as_deref().unwrap_or(""), target.as_deref().unwrap_or("")) { return; }
        // Unbundled dev runs: plain banner, not clickable.
        let esc = |s: &str| s.replace('\\', " ").replace('"', "'");
        let script = format!("display notification \"{}\" with title \"{}\"", esc(&body), esc(&title));
        let _ = std::process::Command::new("osascript").args(["-e", &script]).spawn();
    }
    #[cfg(not(target_os = "macos"))]
    {
        use tauri_plugin_notification::NotificationExt;
        let _ = (&pr_ref, &target);
        let _ = app.notification().builder().title(title).body(body).show();
    }
}

#[tauri::command]
fn open_external(url: String) -> Result<(), String> {
    if !(url.starts_with("https://") || url.starts_with("http://")) {
        return Err("only http(s) links can be opened".into());
    }
    #[cfg(target_os = "macos")]
    let mut cmd = std::process::Command::new("open");
    #[cfg(windows)]
    let mut cmd = { let mut c = std::process::Command::new("cmd"); c.args(["/C", "start", ""]); c };
    #[cfg(all(not(target_os = "macos"), not(windows)))]
    let mut cmd = std::process::Command::new("xdg-open");
    cmd.arg(&url).spawn().map(|_| ()).map_err(|e| e.to_string())
}

/// A PR reference passed on the command line (`github-pr-view octocat/Hello-World#6`).
#[tauri::command]
fn initial_arg() -> Option<String> {
    std::env::args().nth(1)
}

#[tauri::command]
fn has_token() -> bool {
    github::load_token().is_some()
}

#[tauri::command]
fn set_token(token: String) -> Result<(), String> {
    if token.trim().is_empty() { github::clear_token() } else { github::save_token(token.trim()) }
}

pub fn run() {
    let builder = tauri::Builder::default();
    #[cfg(not(target_os = "macos"))]
    let builder = builder.plugin(tauri_plugin_notification::init());
    builder
        .setup(|app| {
            #[cfg(target_os = "macos")]
            native_notify::setup(app.handle().clone());
            build_tray(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![cached_pr, fetch_pr, invalidate_pr, set_unread, inbox, fetch_commit, pr_action, check_pr, notify, list_repos, list_prs, open_external, initial_arg, has_token, set_token])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
