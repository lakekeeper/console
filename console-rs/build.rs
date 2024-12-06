use std::env;
use std::fs;
use std::path::Path;

fn main() {
    let out_dir = env::var_os("OUT_DIR").unwrap();
    // Iterate up over the parents until we find a folder that contains index.html
    let repo_dir =
        out_dir
            .to_str()
            .unwrap()
            .split('/')
            .fold(Path::new(&out_dir).to_path_buf(), |acc, _x| {
                let mut acc = acc.clone();
                if acc.join("index.html").exists() {
                    return acc;
                }
                acc.pop();
                acc
            });
    println!("Found repo_dir: {:?}", repo_dir);
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

    std::process::Command::new("npm")
        .args(&["ci"])
        .current_dir(node_dir.clone())
        .status()
        .map_err(|e| {
            println!("Error: {:?}", e);
            e
        })
        .expect("Failed to install Lakekeeper UI dependencies with npm");
    std::process::Command::new("npm")
        .args(&["run", "build-placeholder"])
        .current_dir(node_dir.clone())
        .status()
        .expect("Failed to build Lakekeeper UI with npm");
}
