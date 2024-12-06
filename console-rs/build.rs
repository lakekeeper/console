use std::env;
use std::fs;
use std::path::Path;

fn main() {
    let out_dir = env::var_os("OUT_DIR").unwrap();
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    let repo_dir = Path::new(&manifest_dir).parent().unwrap();
    let node_dir = Path::new(&out_dir).join("node");
    // Copy everything from repo_dir to node_dir, we are not allowed to write anywhere else
    fs::remove_dir_all(&node_dir).ok();
    fs::create_dir_all(&node_dir).unwrap();
    fs_extra::dir::copy(
        &repo_dir,
        &node_dir,
        &fs_extra::dir::CopyOptions::new().content_only(true),
    )
    .unwrap();
    // Build the console (npm)
    std::process::Command::new("npm")
        .args(&["ci"])
        .current_dir(node_dir.clone())
        .status()
        .expect("Failed to install Lakekeeper UI dependencies with npm");
    std::process::Command::new("npm")
        .args(&["run", "build-placeholder"])
        .current_dir(node_dir.clone())
        .status()
        .expect("Failed to build Lakekeeper UI with npm");
}
