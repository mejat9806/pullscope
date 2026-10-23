//! Dev helper: `cargo run --bin dump -- owner/repo#N out.json` writes the same bundle the app renders.
use github_pr_view_lib::github;

#[tokio::main]
async fn main() {
    let args: Vec<String> = std::env::args().collect();
    let (r, out) = (args.get(1).expect("pr ref"), args.get(2).expect("out path"));
    let token = std::env::var("GITHUB_TOKEN").ok();
    let pr = github::parse_pr_ref(r).expect("bad PR reference");
    let bundle = github::fetch_bundle(&pr, token.as_deref()).await.expect("fetch failed");
    std::fs::write(out, serde_json::to_string(&bundle).unwrap()).unwrap();
}
