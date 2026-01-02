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

    let copy_options = &fs_extra::dir::CopyOptions::new().content_only(true);
    for entry in fs::read_dir(repo_dir).unwrap() {
        let entry = entry.unwrap();
        let name = entry.file_name();
        let dest = node_root.join(&name);

        if entry.file_type().unwrap().is_dir() {
            if name == "console-rs" {
                // Special handling for console-rs: copy it but exclude target/
                fs::create_dir_all(&dest).unwrap();
                for sub_entry in fs::read_dir(entry.path()).unwrap() {
                    let sub_entry = sub_entry.unwrap();
                    let sub_name = sub_entry.file_name();
                    
                    if sub_name == "target" {
                        continue; // Skip target directory to avoid race condition
                    }
                    
                    let sub_dest = dest.join(&sub_name);
                    if sub_entry.file_type().unwrap().is_dir() {
                        fs_extra::dir::copy(sub_entry.path(), &dest, &copy_options).unwrap();
                    } else {
                        fs::copy(sub_entry.path(), &sub_dest).unwrap();
                    }
                }
            } else {
                fs_extra::dir::copy(entry.path(), &node_root, &copy_options).unwrap();
            }
        } else {
            fs::copy(entry.path(), &dest).unwrap();
        }
    }

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
