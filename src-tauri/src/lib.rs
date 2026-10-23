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
    PR_MEM.insert(key, b.clone());
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
async fn pr_action(repo: String, number: u64, action: String, body: Option<String>, id: Option<u64>, event: Option<String>, method: Option<String>, kind: Option<String>, content: Option<String>) -> Result<serde_json::Value, String> {
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
        "review" => {
            let ev = event.unwrap_or_default();
            if !["APPROVE", "REQUEST_CHANGES", "COMMENT"].contains(&ev.as_str()) {
                return Err("bad review type".into());
            }
            if ev != "APPROVE" && text.trim().is_empty() {
                return Err("A comment is required for this review type.".into());
            }
            (Method::POST, format!("{base}/pulls/{number}/reviews"), serde_json::json!({ "event": ev, "body": text }))
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

/// Native macOS notification; clicking it opens `pr_ref` (and jumps to `target`).
#[tauri::command]
fn notify(title: String, body: String, pr_ref: Option<String>, target: Option<String>) {
    #[cfg(target_os = "macos")]
    if native_notify::send(&title, &body, pr_ref.as_deref().unwrap_or(""), target.as_deref().unwrap_or("")) { return; }
    // Unbundled dev runs: plain banner, not clickable.
    let _ = (&pr_ref, &target);
    let esc = |s: &str| s.replace('\\', " ").replace('"', "'");
    let script = format!("display notification \"{}\" with title \"{}\"", esc(&body), esc(&title));
    let _ = std::process::Command::new("osascript").args(["-e", &script]).spawn();
}

#[tauri::command]
fn open_external(url: String) -> Result<(), String> {
    if !(url.starts_with("https://") || url.starts_with("http://")) {
        return Err("only http(s) links can be opened".into());
    }
    std::process::Command::new("open").arg(&url).spawn().map(|_| ()).map_err(|e| e.to_string())
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
    tauri::Builder::default()
        .setup(|_app| {
            #[cfg(target_os = "macos")]
            native_notify::setup(_app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![cached_pr, fetch_pr, invalidate_pr, fetch_commit, pr_action, check_pr, notify, list_repos, list_prs, open_external, initial_arg, has_token, set_token])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
