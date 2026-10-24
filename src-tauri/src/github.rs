use serde::Serialize;
use serde_json::{json, Value};

#[derive(Debug, Clone, Serialize)]
pub struct PrRef {
    pub owner: String,
    pub repo: String,
    pub number: u64,
}

/// Accepts `https://github.com/o/r/pull/N[/files|/commits...]`, `o/r#N`, or `o/r/pull/N`.
pub fn parse_pr_ref(input: &str) -> Result<PrRef, String> {
    let s = input.trim();
    let s = s.split(['?', '#']).next().unwrap_or(s);
    let tail = s
        .strip_prefix("https://github.com/")
        .or_else(|| s.strip_prefix("http://github.com/"))
        .or_else(|| s.strip_prefix("github.com/"));
    let bad = || format!("Not a pull request reference: {input}");
    if let Some(t) = tail {
        let p: Vec<&str> = t.split('/').collect();
        if p.len() >= 4 && p[2] == "pull" {
            return Ok(PrRef { owner: p[0].into(), repo: p[1].into(), number: p[3].parse().map_err(|_| bad())? });
        }
        return Err(bad());
    }
    let raw = input.trim();
    if let Some((repo, n)) = raw.split_once('#') {
        if let Some((o, r)) = repo.split_once('/') {
            return Ok(PrRef { owner: o.into(), repo: r.into(), number: n.parse().map_err(|_| bad())? });
        }
    }
    Err(bad())
}

/// One shared client so connections (and TLS sessions) are reused across requests.
pub fn client() -> reqwest::Client {
    static C: std::sync::OnceLock<reqwest::Client> = std::sync::OnceLock::new();
    C.get_or_init(|| reqwest::Client::builder().user_agent("github-pr-view/0.1").pool_max_idle_per_host(16).tcp_nodelay(true).build().unwrap()).clone()
}

pub async fn get(c: &reqwest::Client, url: &str, token: Option<&str>) -> Result<Value, String> {
    let mut req = c
        .get(url)
        .header("Accept", "application/vnd.github.full+json")
        .header("X-GitHub-Api-Version", "2022-11-28");
    if let Some(t) = token.filter(|t| !t.is_empty()) {
        req = req.bearer_auth(t);
    }
    let resp = req.send().await.map_err(|e| e.to_string())?;
    let status = resp.status();
    let remaining = resp.headers().get("x-ratelimit-remaining").and_then(|v| v.to_str().ok()).map(String::from);
    let body: Value = resp.json().await.map_err(|e| e.to_string())?;
    if !status.is_success() {
        let msg = body["message"].as_str().unwrap_or("request failed");
        let has_token = token.is_some_and(|t| !t.is_empty());
        let hint = if remaining.as_deref() == Some("0") {
            " (rate limit exhausted — add a token)"
        } else if status == reqwest::StatusCode::NOT_FOUND && !has_token {
            " — if this repository is private, add an access token with the key button (⌘,)"
        } else if status == reqwest::StatusCode::NOT_FOUND {
            " — your token cannot see this repository (fine-grained tokens must include it, and organization repos may need SSO authorization)"
        } else {
            ""
        };
        return Err(format!("GitHub API {status}: {msg}{hint}"));
    }
    Ok(body)
}

/// Write request (POST/PUT/PATCH) with a JSON body; errors carry GitHub's message and permission hints.
pub async fn send(c: &reqwest::Client, method: reqwest::Method, url: &str, token: Option<&str>, body: Value) -> Result<Value, String> {
    let Some(t) = token.filter(|t| !t.is_empty()) else {
        return Err("Sign in first: add a token with the key button (⌘,) or log in with `gh auth login`.".into());
    };
    let resp = c
        .request(method, url)
        .header("Accept", "application/vnd.github.full+json")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .bearer_auth(t)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let status = resp.status();
    let v: Value = resp.json().await.unwrap_or(Value::Null);
    if !status.is_success() {
        let msg = v["message"].as_str().unwrap_or("request failed");
        let extra = v["errors"].as_array().map(|e| format!(" {}", e.iter().map(|x| x.to_string()).collect::<Vec<_>>().join("; "))).unwrap_or_default();
        let hint = if status == reqwest::StatusCode::FORBIDDEN || status == reqwest::StatusCode::NOT_FOUND {
            " — your token may lack write access to this repository"
        } else {
            ""
        };
        return Err(format!("GitHub {status}: {msg}{extra}{hint}"));
    }
    Ok(v)
}

/// Pages are fetched in concurrent batches of 6 (stopping at the first short page), not one after another.
pub async fn get_paged(c: &reqwest::Client, base: &str, token: Option<&str>, max_pages: u32) -> Result<Vec<Value>, String> {
    const BATCH: u32 = 6;
    let sep = if base.contains('?') { '&' } else { '?' };
    let mut all = vec![];
    let mut next = 1;
    while next <= max_pages {
        let last = (next + BATCH - 1).min(max_pages);
        let mut set = tokio::task::JoinSet::new();
        for page in next..=last {
            let (c, url, t) = (c.clone(), format!("{base}{sep}per_page=100&page={page}"), token.map(String::from));
            set.spawn(async move { (page, get(&c, &url, t.as_deref()).await) });
        }
        let mut got: Vec<(u32, Result<Value, String>)> = vec![];
        while let Some(r) = set.join_next().await {
            got.push(r.map_err(|e| e.to_string())?);
        }
        got.sort_by_key(|(p, _)| *p);
        let mut done = false;
        for (_, r) in got {
            let arr = r?.as_array().cloned().unwrap_or_default();
            let n = arr.len();
            all.extend(arr);
            if n < 100 {
                done = true;
                break;
            }
        }
        if done {
            break;
        }
        next = last + 1;
    }
    Ok(all)
}

/// Everything the PR page needs, fetched concurrently: PR, issue timeline, files, review comments.
pub async fn fetch_bundle(pr: &PrRef, token: Option<&str>) -> Result<Value, String> {
    let c = client();
    let base = format!("https://api.github.com/repos/{}/{}", pr.owner, pr.repo);
    let n = pr.number;
    let (u_pull, u_tl) = (format!("{base}/pulls/{n}"), format!("{base}/issues/{n}/timeline"));
    let u_issue = format!("{base}/issues/{n}");
    let (u_files, u_rc) = (format!("{base}/pulls/{n}/files"), format!("{base}/pulls/{n}/comments"));
    let u_commits = format!("{base}/pulls/{n}/commits");
    let (pull, timeline, files, review_comments, issue, commits) = tokio::join!(
        get(&c, &u_pull, token),
        get_paged(&c, &u_tl, token, 30),
        get_paged(&c, &u_files, token, 3),
        get_paged(&c, &u_rc, token, 3),
        get(&c, &u_issue, token),
        get_paged(&c, &u_commits, token, 3),
    );
    // The PR endpoint omits reactions on the description; the issue endpoint has them.
    let mut pull = pull?;
    pull["reactions"] = issue.map(|i| i["reactions"].clone()).unwrap_or(Value::Null);
    let timeline = timeline?;
    // Commits referenced by "added a commit that referenced this pull request" events need their message.
    let mut shas: Vec<String> = timeline
        .iter()
        .filter_map(|e| match e["event"].as_str()? {
            "referenced" => e["commit_id"].as_str().map(String::from),
            "committed" => e["sha"].as_str().map(String::from),
            _ => None,
        })
        .collect();
    shas.dedup();
    let mut set = tokio::task::JoinSet::new();
    for sha in shas.into_iter().take(8) {
        let (c, url, t) = (c.clone(), format!("{base}/commits/{sha}"), token.map(String::from));
        set.spawn(async move { (sha, get(&c, &url, t.as_deref()).await) });
    }
    let mut commit_info = serde_json::Map::new();
    while let Some(res) = set.join_next().await {
        let Ok((sha, Ok(c))) = res else { continue };
        commit_info.insert(sha.clone(), json!({ "sha": sha, "message": c["commit"]["message"], "html_url": c["html_url"], "author": c["author"] }));
    }
    // CI: check runs plus legacy commit statuses for the head commit. Best effort.
    let head = pull["head"]["sha"].as_str().unwrap_or_default().to_string();
    let (u_runs, u_status) = (format!("{base}/commits/{head}/check-runs?per_page=100"), format!("{base}/commits/{head}/status?per_page=100"));
    let (runs, status) = tokio::join!(get(&c, &u_runs, token), get(&c, &u_status, token));
    let checks: Vec<Value> = runs
        .ok()
        .and_then(|r| r["check_runs"].as_array().cloned())
        .unwrap_or_default()
        .into_iter()
        .map(|r| json!({ "name": r["name"], "status": r["status"], "conclusion": r["conclusion"], "url": r["html_url"], "app": r["app"]["name"], "started_at": r["started_at"], "completed_at": r["completed_at"] }))
        .chain(
            status.ok().and_then(|s| s["statuses"].as_array().cloned()).unwrap_or_default().into_iter().map(|s| {
                let (st, concl) = match s["state"].as_str() { Some("pending") => ("in_progress", Value::Null), Some("success") => ("completed", json!("success")), _ => ("completed", json!("failure")) };
                json!({ "name": s["context"], "status": st, "conclusion": concl, "url": s["target_url"], "app": "status", "started_at": s["created_at"], "completed_at": s["updated_at"], "description": s["description"] })
            }),
        )
        .collect();
    // Which review threads are resolved (only GraphQL knows). Best effort; needs a token.
    let mut resolved: Vec<Value> = vec![];
    let mut thread_ids = serde_json::Map::new();
    let q = "query($o:String!,$n:String!,$p:Int!){repository(owner:$o,name:$n){pullRequest(number:$p){reviewThreads(first:100){nodes{id isResolved comments(first:100){nodes{databaseId}}}}}}}";
    let vars = json!({ "query": q, "variables": { "o": pr.owner, "n": pr.repo, "p": n } });
    if let Ok(v) = send(&c, reqwest::Method::POST, "https://api.github.com/graphql", token, vars).await {
        for t in v["data"]["repository"]["pullRequest"]["reviewThreads"]["nodes"].as_array().cloned().unwrap_or_default() {
            for c in t["comments"]["nodes"].as_array().cloned().unwrap_or_default() { if let Some(id) = c["databaseId"].as_u64() { thread_ids.insert(id.to_string(), t["id"].clone()); } }
            if t["isResolved"].as_bool() == Some(true) {
                resolved.extend(t["comments"]["nodes"].as_array().cloned().unwrap_or_default().into_iter().map(|c| c["databaseId"].clone()));
            }
        }
    }
    // Which checks branch protection / rulesets require (GraphQL only). Best effort; needs a token.
    let mut required: Vec<Value> = vec![];
    let q = "query($o:String!,$n:String!,$p:Int!){repository(owner:$o,name:$n){pullRequest(number:$p){commits(last:1){nodes{commit{statusCheckRollup{contexts(first:100){nodes{__typename ... on CheckRun{name isRequired(pullRequestNumber:$p)} ... on StatusContext{context isRequired(pullRequestNumber:$p)}}}}}}}}}}";
    let vars = json!({ "query": q, "variables": { "o": pr.owner, "n": pr.repo, "p": n } });
    if let Ok(v) = send(&c, reqwest::Method::POST, "https://api.github.com/graphql", token, vars).await {
        for x in v["data"]["repository"]["pullRequest"]["commits"]["nodes"][0]["commit"]["statusCheckRollup"]["contexts"]["nodes"].as_array().cloned().unwrap_or_default() {
            if x["isRequired"].as_bool() == Some(true) { required.push(if x["name"].is_string() { x["name"].clone() } else { x["context"].clone() }); }
        }
    }
    Ok(json!({
        "resolved_ids": resolved,
        "thread_ids": thread_ids,
        "checks": checks,
        "required_checks": required,
        "commits": commits.unwrap_or_default(),
        "commit_info": commit_info,
        "pull": pull,
        "timeline": timeline,
        "files": files?,
        "review_comments": review_comments?,
    }))
}

/// ~/Library/Caches/github-pr-view/<owner>_<repo>_<n>.json
pub fn cache_path(pr: &PrRef) -> Option<std::path::PathBuf> {
    let name = format!("{}_{}_{}.json", pr.owner, pr.repo, pr.number);
    let home = || std::env::var_os("HOME").map(std::path::PathBuf::from);
    let dir = if cfg!(target_os = "macos") {
        home()?.join("Library/Caches/github-pr-view")
    } else if cfg!(windows) {
        std::path::PathBuf::from(std::env::var_os("LOCALAPPDATA")?).join("github-pr-view").join("cache")
    } else {
        std::env::var_os("XDG_CACHE_HOME").map(std::path::PathBuf::from).or_else(|| home().map(|h| h.join(".cache")))?.join("github-pr-view")
    };
    Some(dir.join(name))
}

const SERVICE: &str = "github-pr-view";
const USER: &str = "github-token";

static TOKEN: std::sync::Mutex<Option<Option<String>>> = std::sync::Mutex::new(None);

/// The GitHub CLI's login, if installed. Avoids the keychain prompt an unsigned app triggers on every rebuild.
fn gh_token() -> Option<String> {
    for bin in ["/opt/homebrew/bin/gh", "/usr/local/bin/gh", "/usr/bin/gh"] {
        if let Ok(o) = std::process::Command::new(bin).args(["auth", "token"]).output() {
            let t = String::from_utf8_lossy(&o.stdout).trim().to_string();
            if o.status.success() && !t.is_empty() {
                return Some(t);
            }
        }
    }
    None
}

/// Token lookup order: `gh auth token`, then the OS keychain. Cached for the process lifetime.
pub fn load_token() -> Option<String> {
    let mut slot = TOKEN.lock().ok()?;
    if let Some(t) = slot.as_ref() {
        return t.clone();
    }
    let t = gh_token().or_else(|| keyring::Entry::new(SERVICE, USER).ok()?.get_password().ok());
    *slot = Some(t.clone());
    t
}
fn forget_cached() {
    if let Ok(mut s) = TOKEN.lock() {
        *s = None;
    }
}
pub fn save_token(t: &str) -> Result<(), String> {
    forget_cached();
    keyring::Entry::new(SERVICE, USER).map_err(|e| e.to_string())?.set_password(t).map_err(|e| e.to_string())
}
pub fn clear_token() -> Result<(), String> {
    forget_cached();
    match keyring::Entry::new(SERVICE, USER).map_err(|e| e.to_string())?.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}
