use std::env;
use std::fs;
use std::path::Path;

fn main() {
    let out_dir = env::var_os("OUT_DIR").unwrap();
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    let repo_dir = Path::new(&manifest_dir).parent().unwrap();
    let node_root = Path::new(&out_dir).join("node");
    let asset_dir = node_root.join("dist");

    println!("Node root: {node_root:?}");
    println!("Asset dir (dist): {asset_dir:?}");
    // Copy everything from repo_dir to node_dir, we are not allowed to write anywhere else
    fs::remove_dir_all(&node_root).ok();
    fs::create_dir_all(&asset_dir).unwrap();
    fs_extra::dir::copy(
        repo_dir,
        &node_root,
        &fs_extra::dir::CopyOptions::new().content_only(true),
    )
    .unwrap();

    std::process::Command::new("bash")
        .arg("-c")
        .arg(format!(
            "cd {} && HOME=\"{}\" npm ci",
            node_root.to_str().unwrap(),
            node_root.to_str().unwrap()
        ))
        .current_dir(node_root.clone())
        .status()
        .expect("Failed to install Lakekeeper UI dependencies with npm");
    let output = std::process::Command::new("npm")
        .args(["run", "build-placeholder"])
        .current_dir(&node_root)
        .output()
        .expect("Failed to spawn npm to build Lakekeeper UI");
    if !output.status.success() {
    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    panic!(
        "npm run build-placeholder failed with exit code: {:?}\n\
         STDOUT:\n{stdout}\n\
         STDERR:\n{stderr}\n\
         Working directory: {}",
        output.status.code(),
        node_root.display()
    );
}
}
