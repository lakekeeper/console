use std::env;
use std::fs;
use std::path::Path;

fn main() {
    let out_dir = env::var_os("OUT_DIR").unwrap();
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    let repo_dir = Path::new(&manifest_dir).parent().unwrap();
    let node_root = Path::new(&out_dir).join("node");
    let asset_dir = node_root.join("dist");

    println!("cargo:warning=Node root: {node_root:?}");
    println!("cargo:warning=Asset dir (dist): {asset_dir:?}");
    // limit rebuilds to UI changes
    println!("cargo:rerun-if-changed={}", repo_dir.join("package.json").display());
    println!("cargo:rerun-if-changed={}", repo_dir.join("package-lock.json").display());
    println!("cargo:rerun-if-changed={}", repo_dir.join("src").display());
    println!("cargo:rerun-if-changed={}", repo_dir.join("public").display());
    println!("cargo:rerun-if-changed={}", repo_dir.join("vite.config.js").display());
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
            "cd {} && HOME=\"{}\" npm ci --include=optional",
            node_root.to_str().unwrap(),
            node_root.to_str().unwrap()
        ))
        .current_dir(node_root.clone())
        .status()
        .expect("Failed to install Lakekeeper UI dependencies with npm");
    
    // Explicitly install rollup native binary to work around npm bug
    // See: https://github.com/npm/cli/issues/4828
    // Detect the correct platform-specific binary
    let rollup_package = if cfg!(target_os = "linux") {
        if cfg!(target_arch = "x86_64") {
            "@rollup/rollup-linux-x64-gnu"
        } else if cfg!(target_arch = "aarch64") {
            "@rollup/rollup-linux-arm64-gnu"
        } else {
            // Fallback - let npm try to figure it out
            ""
        }
    } else if cfg!(target_os = "macos") {
        if cfg!(target_arch = "aarch64") {
            "@rollup/rollup-darwin-arm64"
        } else {
            "@rollup/rollup-darwin-x64"
        }
    } else {
        // Windows or other platforms
        ""
    };
    
    if !rollup_package.is_empty() {
        std::process::Command::new("bash")
            .arg("-c")
            .arg(format!(
                "cd {} && HOME=\"{}\" npm install --no-save --legacy-peer-deps {}",
                node_root.to_str().unwrap(),
                node_root.to_str().unwrap(),
                rollup_package
            ))
            .current_dir(node_root.clone())
            .status()
            .expect("Failed to install rollup native binary");
    }
    
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
