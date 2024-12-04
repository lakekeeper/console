use std::env;
use std::fs;
use std::path::Path;

fn main() {
    let out_dir = env::var_os("OUT_DIR").unwrap();
    let dest_path = Path::new(&out_dir).join("console");
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    let repo_dir = Path::new(&manifest_dir).parent().unwrap();
    // Clear the output directory
    let _ = fs::remove_dir_all(&dest_path);
    fs::create_dir_all(&dest_path).unwrap();
    // Build the console (npm)
    std::process::Command::new("npm")
        .args(&["ci"])
        .current_dir(repo_dir)
        .status()
        .expect("Failed to install Lakekeeper UI dependencies with npm");
    std::process::Command::new("npm")
        .args(&["run", "build-placeholder"])
        .current_dir(repo_dir)
        .status()
        .expect("Failed to build Lakekeeper UI with npm");

    // Copy all files from CARGO_MANIFEST_DIR/(parent)/dist to $OUT_DIR/console (recursively)
    let src_path = repo_dir.join("dist");
    fs_extra::dir::copy(&src_path, &dest_path, &fs_extra::dir::CopyOptions::new()).unwrap();
    // println!("cargo::rerun-if-changed=build.rs");
}
