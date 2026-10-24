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

fn valid_repo(repo: &str) -> bool { repo.matches('/').count() == 1 && !repo.contains("..") && repo.chars().all(|c| c.is_ascii_alphanumeric() || "-_./".contains(c)) }
fn valid_ref(r: &str) -> bool { !r.is_empty() && !r.contains("..") && r.chars().all(|c| c.is_ascii_alphanumeric() || "-_./".contains(c)) }

/// Branches of a repository plus its default branch, for the New pull request page.
#[tauri::command]
async fn list_branches(repo: String) -> Result<serde_json::Value, String> {
    if !valid_repo(&repo) { return Err("bad repository".into()); }
    let token = github::load_token().ok_or("Add an access token to create pull requests.")?;
    let c = github::client();
    let info = github::get(&c, &format!("https://api.github.com/repos/{repo}"), Some(&token)).await?;
    let list = github::get_paged(&c, &format!("https://api.github.com/repos/{repo}/branches?per_page=100"), Some(&token), 5).await?;
    let names: Vec<_> = list.iter().filter_map(|b| b["name"].as_str().map(|s| serde_json::Value::from(s))).collect();
    Ok(serde_json::json!({ "default": info["default_branch"], "branches": names, "can_push": info["permissions"]["push"] }))
}

/// How far `head` is ahead of `base`: commit subjects and changed-file count (also used to prefill the title).
#[tauri::command]
async fn compare_branches(repo: String, base: String, head: String) -> Result<serde_json::Value, String> {
    if !valid_repo(&repo) || !valid_ref(&base) || !valid_ref(&head) { return Err("bad branch name".into()); }
    let token = github::load_token();
    let v = github::get(&github::client(), &format!("https://api.github.com/repos/{repo}/compare/{base}...{head}"), token.as_deref()).await?;
    let commits: Vec<_> = v["commits"].as_array().map(|a| a.iter().map(|c| c["commit"]["message"].as_str().unwrap_or("").lines().next().unwrap_or("").to_string()).collect()).unwrap_or_default();
    Ok(serde_json::json!({ "ahead_by": v["ahead_by"], "behind_by": v["behind_by"], "files": v["files"].as_array().map(|a| a.len()).unwrap_or(0), "commits": commits }))
}

/// Branches that got pushes in the last few hours and have no open pull request yet (GitHub's "Compare & pull request" prompt).
#[tauri::command]
async fn recent_pushes(repo: String) -> Result<serde_json::Value, String> {
    if !valid_repo(&repo) { return Err("bad repository".into()); }
    let token = github::load_token().ok_or("no token")?;
    let c = github::client();
    let info = github::get(&c, &format!("https://api.github.com/repos/{repo}"), Some(&token)).await?;
    let default = info["default_branch"].as_str().unwrap_or("").to_string();
    let (owner, name) = repo.split_once('/').unwrap();
    let q = "query($o:String!,$n:String!){repository(owner:$o,name:$n){refs(refPrefix:\"refs/heads/\",first:100){nodes{name target{... on Commit{committedDate author{user{login}}}}}}}}";
    let g = github::send(&c, reqwest::Method::POST, "https://api.github.com/graphql", Some(&token), serde_json::json!({ "query": q, "variables": { "o": owner, "n": name } })).await?;
    let open = github::get_paged(&c, &format!("https://api.github.com/repos/{repo}/pulls?state=open&per_page=100"), Some(&token), 3).await.unwrap_or_default();
    let open_heads: Vec<String> = open.iter().filter_map(|p| p["head"]["ref"].as_str().map(String::from)).collect();
    let mut out: Vec<serde_json::Value> = Vec::new();
    for n in g["data"]["repository"]["refs"]["nodes"].as_array().cloned().unwrap_or_default() {
        let Some(b) = n["name"].as_str() else { continue };
        if b == default || open_heads.iter().any(|h| h == b) { continue; }
        out.push(serde_json::json!({ "branch": b, "at": n["target"]["committedDate"], "actor": n["target"]["author"]["user"]["login"], "repo": repo }));
    }
    Ok(serde_json::Value::Array(out))
}

/// Render Markdown the way GitHub does (for the Preview tab); `repo` lets #123 and @user links resolve.
#[tauri::command]
async fn render_markdown(text: String, repo: Option<String>) -> Result<String, String> {
    if text.len() > 200_000 { return Err("Too long to preview.".into()); }
    let mut body = serde_json::json!({ "text": text, "mode": "gfm" });
    if let Some(r) = repo.filter(|r| valid_repo(r)) { body["context"] = serde_json::json!(r); }
    let mut req = github::client().post("https://api.github.com/markdown").header("Accept", "text/html").header("X-GitHub-Api-Version", "2022-11-28").json(&body);
    if let Some(t) = github::load_token().filter(|t| !t.is_empty()) { req = req.bearer_auth(t); }
    let resp = req.send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() { return Err(format!("GitHub {}", resp.status())); }
    resp.text().await.map_err(|e| e.to_string())
}

/// Assignable people, labels and open milestones of a repository, for the New pull request page.
#[tauri::command]
async fn repo_meta(repo: String) -> Result<serde_json::Value, String> {
    if !valid_repo(&repo) { return Err("bad repository".into()); }
    let token = github::load_token().ok_or("Add an access token first.")?;
    let c = github::client();
    let t = Some(token.as_str());
    let (u1, u2, u3) = (format!("https://api.github.com/repos/{repo}/assignees?per_page=100"), format!("https://api.github.com/repos/{repo}/labels?per_page=100"), format!("https://api.github.com/repos/{repo}/milestones?state=open&per_page=100"));
    let (people, labels, miles) = tokio::join!(github::get_paged(&c, &u1, t, 3), github::get_paged(&c, &u2, t, 3), github::get_paged(&c, &u3, t, 2));
    let pick = |v: Result<Vec<serde_json::Value>, String>, f: &dyn Fn(&serde_json::Value) -> serde_json::Value| -> Vec<serde_json::Value> { v.unwrap_or_default().iter().map(|x| f(x)).collect() };
    Ok(serde_json::json!({
        "people": pick(people, &|x| serde_json::json!({ "login": x["login"], "avatar": x["avatar_url"] })),
        "labels": pick(labels, &|x| serde_json::json!({ "name": x["name"], "color": x["color"] })),
        "milestones": pick(miles, &|x| serde_json::json!({ "number": x["number"], "title": x["title"] })),
    }))
}

/// Open a new pull request; returns GitHub's response (number, html_url). `extra` may carry
/// reviewers, assignees, labels and milestone, applied right after creation (failures come back as `warnings`).
#[tauri::command]
async fn create_pr(repo: String, base: String, head: String, title: String, body: String, draft: bool, extra: Option<serde_json::Value>) -> Result<serde_json::Value, String> {
    if !valid_repo(&repo) || !valid_ref(&base) || !valid_ref(&head) { return Err("bad branch name".into()); }
    if title.trim().is_empty() { return Err("A title is required.".into()); }
    let token = github::load_token().ok_or("Add an access token to create pull requests.")?;
    let c = github::client();
    let r = github::send(&c, reqwest::Method::POST, &format!("https://api.github.com/repos/{repo}/pulls"), Some(&token),
        serde_json::json!({ "title": title.trim(), "head": head, "base": base, "body": body, "draft": draft })).await?;
    PR_LIST_CACHE.invalidate_all();
    let n = r["number"].as_u64().unwrap_or(0);
    let mut warnings: Vec<String> = Vec::new();
    if let (Some(x), true) = (extra, n > 0) {
        let list = |k: &str| -> Vec<String> { x[k].as_array().map(|a| a.iter().filter_map(|v| v.as_str()).map(String::from).collect()).unwrap_or_default() };
        let (reviewers, assignees, labels) = (list("reviewers"), list("assignees"), list("labels"));
        if !reviewers.is_empty() {
            if let Err(e) = github::send(&c, reqwest::Method::POST, &format!("https://api.github.com/repos/{repo}/pulls/{n}/requested_reviewers"), Some(&token), serde_json::json!({ "reviewers": reviewers })).await { warnings.push(format!("reviewers: {e}")); }
        }
        let mut patch = serde_json::Map::new();
        if !assignees.is_empty() { patch.insert("assignees".into(), serde_json::json!(assignees)); }
        if !labels.is_empty() { patch.insert("labels".into(), serde_json::json!(labels)); }
        if let Some(m) = x["milestone"].as_u64() { patch.insert("milestone".into(), serde_json::json!(m)); }
        if !patch.is_empty() {
            if let Err(e) = github::send(&c, reqwest::Method::PATCH, &format!("https://api.github.com/repos/{repo}/issues/{n}"), Some(&token), serde_json::Value::Object(patch)).await { warnings.push(format!("assignees/labels/milestone: {e}")); }
        }
    }
    Ok(serde_json::json!({ "number": r["number"], "html_url": r["html_url"], "warnings": warnings }))
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

/// The diff of several consecutive commits: GitHub's compare between the first commit's parent and the last commit.
#[tauri::command]
async fn fetch_range(repo: String, base: String, head: String) -> Result<serde_json::Value, String> {
    let hex = |s: &str| !s.is_empty() && s.chars().all(|c| c.is_ascii_hexdigit());
    if !valid_repo(&repo) || !hex(&base) || !hex(&head) { return Err("bad request".into()); }
    let key = format!("{repo}@{base}..{head}").to_lowercase();
    if let Some(c) = COMMITS.get(&key) { return Ok(c); }
    let token = github::load_token();
    let c = github::client();
    let mut files: Vec<serde_json::Value> = Vec::new();
    for page in 1..=3 {
        let url = format!("https://api.github.com/repos/{repo}/compare/{base}...{head}?per_page=100&page={page}");
        let v = github::get(&c, &url, token.as_deref()).await?;
        let got = v["files"].as_array().cloned().unwrap_or_default();
        let n = got.len();
        files.extend(got);
        if n < 100 { break; }
    }
    let out = serde_json::json!({ "files": files });
    COMMITS.insert(key, out.clone());
    Ok(out)
}

/// Login of the signed-in user (to find their last review on a pull request).
#[tauri::command]
async fn viewer_login() -> Result<String, String> {
    let token = github::load_token().ok_or("no token")?;
    let v = github::get(&github::client(), "https://api.github.com/user", Some(&token)).await?;
    v["login"].as_str().map(String::from).ok_or_else(|| "no login".into())
}

/// Add a reaction, or take it away again when the signed-in user has already left it (like github.com).
/// Returns { added: bool }.
#[tauri::command]
async fn toggle_reaction(repo: String, number: u64, kind: String, id: u64, content: String) -> Result<serde_json::Value, String> {
    use reqwest::Method;
    if !valid_repo(&repo) { return Err("bad repository".into()); }
    if !["+1", "-1", "laugh", "confused", "heart", "hooray", "rocket", "eyes"].contains(&content.as_str()) { return Err("bad reaction".into()); }
    let base = format!("https://api.github.com/repos/{repo}");
    let url = match kind.as_str() {
        "issue_comment" => format!("{base}/issues/comments/{id}/reactions"),
        "review_comment" => format!("{base}/pulls/comments/{id}/reactions"),
        "pr" => format!("{base}/issues/{number}/reactions"),
        _ => return Err("bad reaction target".into()),
    };
    let token = github::load_token();
    let c = github::client();
    let me = github::get(&c, "https://api.github.com/user", token.as_deref()).await?["login"].as_str().unwrap_or("").to_lowercase();
    let list = github::get_paged(&c, &format!("{url}?content={}&per_page=100", content.replace('+', "%2B")), token.as_deref(), 3).await.unwrap_or_default();
    let mine = list.iter().find(|r| r["content"].as_str() == Some(content.as_str()) && r["user"]["login"].as_str().map(|l| l.to_lowercase()) == Some(me.clone()));
    if let Some(r) = mine {
        let rid = r["id"].as_u64().ok_or("bad reaction id")?;
        github::send(&c, Method::DELETE, &format!("{url}/{rid}"), token.as_deref(), serde_json::json!({})).await?;
        Ok(serde_json::json!({ "added": false }))
    } else {
        github::send(&c, Method::POST, &url, token.as_deref(), serde_json::json!({ "content": content })).await?;
        Ok(serde_json::json!({ "added": true }))
    }
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
        "update_branch" => (Method::PUT, format!("{base}/pulls/{number}/update-branch"), serde_json::json!({})),
        "edit" => {
            let mut p = serde_json::Map::new();
            if let Some(t) = extra.as_ref().and_then(|x| x["title"].as_str()) {
                if t.trim().is_empty() { return Err("The title can't be empty.".into()); }
                p.insert("title".into(), serde_json::json!(t.trim()));
            }
            if body.is_some() { p.insert("body".into(), serde_json::json!(text)); }
            (Method::PATCH, format!("{base}/pulls/{number}"), serde_json::Value::Object(p))
        }
        "ready" | "draft" | "automerge" | "disable_automerge" => {
            let c = github::client();
            let t = token.as_deref();
            let pr = github::get(&c, &format!("{base}/pulls/{number}"), t).await?;
            let node = pr["node_id"].as_str().ok_or("pull request id missing")?;
            let (q, vars) = match action.as_str() {
                "ready" => ("mutation($id:ID!){markPullRequestReadyForReview(input:{pullRequestId:$id}){pullRequest{id}}}", serde_json::json!({ "id": node })),
                "draft" => ("mutation($id:ID!){convertPullRequestToDraft(input:{pullRequestId:$id}){pullRequest{id}}}", serde_json::json!({ "id": node })),
                "automerge" => {
                    let mm = method.unwrap_or_else(|| "merge".into()).to_uppercase();
                    if !["MERGE", "SQUASH", "REBASE"].contains(&mm.as_str()) { return Err("bad merge method".into()); }
                    ("mutation($id:ID!,$m:PullRequestMergeMethod!){enablePullRequestAutoMerge(input:{pullRequestId:$id,mergeMethod:$m}){pullRequest{id}}}", serde_json::json!({ "id": node, "m": mm }))
                }
                _ => ("mutation($id:ID!){disablePullRequestAutoMerge(input:{pullRequestId:$id}){pullRequest{id}}}", serde_json::json!({ "id": node })),
            };
            let r = github::send(&c, Method::POST, "https://api.github.com/graphql", t, serde_json::json!({ "query": q, "variables": vars })).await?;
            if let Some(m) = r["errors"][0]["message"].as_str() { return Err(m.to_string()); }
            PR_CACHE.invalidate(&format!("{repo}#{number}").to_lowercase()).await;
            PR_LIST_CACHE.invalidate_all();
            return Ok(r);
        }
        "rerun" => {
            // `extra` = URLs of the failed checks; GitHub Actions runs are re-run (failed jobs only).
            let mut runs: Vec<String> = Vec::new();
            for u in extra.as_ref().and_then(|x| x.as_array()).cloned().unwrap_or_default() {
                let Some(u) = u.as_str() else { continue };
                if let Some(i) = u.find("/actions/runs/") {
                    let id: String = u[i + 14..].chars().take_while(|c| c.is_ascii_digit()).collect();
                    if !id.is_empty() && !runs.contains(&id) { runs.push(id); }
                }
            }
            if runs.is_empty() { return Err("None of the failed checks can be re-run from here (only GitHub Actions runs).".into()); }
            let c = github::client();
            let mut errs: Vec<String> = Vec::new();
            for id in &runs {
                if let Err(e) = github::send(&c, Method::POST, &format!("{base}/actions/runs/{id}/rerun-failed-jobs"), token.as_deref(), serde_json::json!({})).await { errs.push(e); }
            }
            PR_CACHE.invalidate(&format!("{repo}#{number}").to_lowercase()).await;
            if errs.len() == runs.len() { return Err(errs.remove(0)); }
            return Ok(serde_json::json!({ "rerun": runs.len() - errs.len() }));
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
    let open = MenuItem::with_id(app, "open", "Open Pullscope", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&open, &quit])?;
    let show = |app: &tauri::AppHandle| { if let Some(w) = app.get_webview_window("main") { let _ = w.show(); let _ = w.unminimize(); let _ = w.set_focus(); } };
    TrayIconBuilder::with_id("main")
        .icon(tauri::image::Image::from_bytes(include_bytes!("../icons/32x32.png"))?)
        .tooltip("Pullscope")
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
        let _ = tray.set_tooltip(Some(if count > 0 { format!("Pullscope — {count} unread") } else { "Pullscope".to_string() }));
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

const OAUTH_CLIENT_ID: &str = "Ov23li7yXzzIt2yayyfC";

/// Device flow step 1: ask GitHub for a code the user types at github.com/login/device.
#[tauri::command]
async fn device_start() -> Result<serde_json::Value, String> {
    let r: serde_json::Value = reqwest::Client::new()
        .post("https://github.com/login/device/code")
        .header("Accept", "application/json")
        .header("User-Agent", "pullscope")
        .form(&[("client_id", OAUTH_CLIENT_ID), ("scope", "repo notifications")])
        .send().await.map_err(|e| e.to_string())?
        .json().await.map_err(|e| e.to_string())?;
    if let Some(e) = r.get("error_description").or_else(|| r.get("error")).and_then(|v| v.as_str()) { return Err(e.into()); }
    Ok(r)
}

/// Device flow step 2: returns "ok" once approved (token saved), "pending" or "slow_down" while waiting.
#[tauri::command]
async fn device_poll(device_code: String) -> Result<String, String> {
    let r: serde_json::Value = reqwest::Client::new()
        .post("https://github.com/login/oauth/access_token")
        .header("Accept", "application/json")
        .header("User-Agent", "pullscope")
        .form(&[("client_id", OAUTH_CLIENT_ID), ("device_code", device_code.as_str()), ("grant_type", "urn:ietf:params:oauth:grant-type:device_code")])
        .send().await.map_err(|e| e.to_string())?
        .json().await.map_err(|e| e.to_string())?;
    if let Some(t) = r.get("access_token").and_then(|v| v.as_str()) { github::save_token(t)?; return Ok("ok".into()); }
    match r.get("error").and_then(|v| v.as_str()) {
        Some("authorization_pending") => Ok("pending".into()),
        Some("slow_down") => Ok("slow_down".into()),
        Some("expired_token") => Err("The code expired. Start again.".into()),
        Some("access_denied") => Err("Sign-in was cancelled on GitHub.".into()),
        Some(e) => Err(r.get("error_description").and_then(|v| v.as_str()).unwrap_or(e).to_string()),
        None => Err("Unexpected reply from GitHub".into()),
    }
}

pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init());
    #[cfg(not(target_os = "macos"))]
    let builder = builder.plugin(tauri_plugin_notification::init());
    builder
        .setup(|app| {
            #[cfg(target_os = "macos")]
            native_notify::setup(app.handle().clone());
            build_tray(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![cached_pr, fetch_pr, invalidate_pr, set_unread, inbox, fetch_commit, fetch_range, viewer_login, toggle_reaction, pr_action, check_pr, notify, list_repos, list_branches, compare_branches, create_pr, repo_meta, render_markdown, recent_pushes, list_prs, open_external, initial_arg, has_token, set_token, device_start, device_poll])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn repo_names_are_validated_before_use_in_urls() {
        assert!(valid_repo("octocat/Hello-World"));
        assert!(valid_repo("a_b/c.d"));
        for bad in ["", "octocat", "a/b/c", "a/../b", "a/b?x=1", "a b/c", "a/b#1"] {
            assert!(!valid_repo(bad), "should reject {bad:?}");
        }
    }

    #[test]
    fn branch_names_are_validated() {
        assert!(valid_ref("feature/login-2"));
        for bad in ["", "a..b", "a b", "a;rm", "a?b"] {
            assert!(!valid_ref(bad), "should reject {bad:?}");
        }
    }

    #[test]
    fn cache_keys_ignore_case() {
        let a = github::PrRef { owner: "Octo".into(), repo: "Hello".into(), number: 6 };
        let b = github::PrRef { owner: "octo".into(), repo: "hello".into(), number: 6 };
        assert_eq!(pr_key(&a), pr_key(&b));
    }
}
