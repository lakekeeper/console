use std::env;
use std::fs;
use std::io::Write;
use std::path::Path;

use flate2::write::GzEncoder;
use flate2::Compression;

// Files at or above this size are stored gzipped and decompressed at runtime.
// Below this threshold, gzip overhead outweighs savings.
const GZIP_THRESHOLD_BYTES: u64 = 64 * 1024;

// Extensions whose contents are already compressed — gzipping again costs CPU
// for ~no size win.
const SKIP_GZIP_EXTENSIONS: &[&str] = &[
    "woff", "woff2", "png", "jpg", "jpeg", "gif", "ico", "webp", "zip", "gz",
];

fn gzip_file(path: &Path) -> std::io::Result<()> {
    let raw = fs::read(path)?;
    let mut encoder = GzEncoder::new(Vec::new(), Compression::best());
    encoder.write_all(&raw)?;
    let compressed = encoder.finish()?;
    let gz_path = path.with_extension(format!(
        "{}.gz",
        path.extension().and_then(|s| s.to_str()).unwrap_or("")
    ));
    fs::write(&gz_path, compressed)?;
    fs::remove_file(path)?;
    Ok(())
}

fn gzip_large_files(dir: &Path) -> std::io::Result<()> {
    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();
        let file_type = entry.file_type()?;
        if file_type.is_dir() {
            gzip_large_files(&path)?;
            continue;
        }
        if !file_type.is_file() {
            continue;
        }
        let ext = path.extension().and_then(|s| s.to_str()).unwrap_or("");
        if SKIP_GZIP_EXTENSIONS.iter().any(|e| e.eq_ignore_ascii_case(ext)) {
            continue;
        }
        if entry.metadata()?.len() < GZIP_THRESHOLD_BYTES {
            continue;
        }
        gzip_file(&path)?;
    }
    Ok(())
}

fn main() {
    let out_dir = env::var_os("OUT_DIR").unwrap();
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    let repo_dir = Path::new(&manifest_dir).parent().unwrap();
    let node_root = Path::new(&out_dir).join("node");
    let asset_dir = node_root.join("dist");

    println!("cargo:warning=Node root: {node_root:?}");
    println!("cargo:warning=Asset dir (dist): {asset_dir:?}");
    // Only retrigger on dependency changes. Editing Vue/TS sources during dev
    // would otherwise restart a multi-minute npm+vite chain on every save —
    // run `cargo clean -p lakekeeper-console` (or touch package-lock.json) to
    // force a UI rebuild after source-only changes.
    println!("cargo:rerun-if-changed={}", repo_dir.join("package.json").display());
    println!("cargo:rerun-if-changed={}", repo_dir.join("package-lock.json").display());
    println!("cargo:rerun-if-changed={}", repo_dir.join("vite.config.mts").display());
    // Copy everything from repo_dir to node_dir, we are not allowed to write anywhere else
    fs::remove_dir_all(&node_root).ok();
    fs::create_dir_all(&asset_dir).unwrap();

    // Skip large generated/vendored dirs — `npm ci` recreates node_modules
    // and `vite build` recreates dist. Copying them adds ~700 MB of I/O per
    // build for no benefit.
    const SKIP_TOP_LEVEL: &[&str] = &["node_modules", "dist", "target", ".git"];

    let copy_options = &fs_extra::dir::CopyOptions::new().overwrite(true);
    for entry in fs::read_dir(repo_dir).unwrap() {
        let entry = entry.unwrap();
        let name = entry.file_name();
        let dest = node_root.join(&name);

        if SKIP_TOP_LEVEL.iter().any(|s| name == *s) {
            continue;
        }

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

    gzip_large_files(&asset_dir).expect("Failed to gzip dist files");
}
