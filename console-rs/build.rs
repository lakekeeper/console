use std::env;
use std::fs;
use std::path::Path;

fn main() {
    let out_dir = env::var_os("OUT_DIR").unwrap();
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    let repo_dir = Path::new(&manifest_dir).parent().unwrap();
    let node_dir = Path::new(&out_dir).join("node");

    println!("Node dir: {:?}", node_dir);
    println!("Repo dir: {:?}", repo_dir);
    // Copy everything from repo_dir to node_dir, we are not allowed to write anywhere else
    fs::remove_dir_all(&node_dir).ok();
    fs::create_dir_all(&node_dir).unwrap();
    fs_extra::dir::copy(
        &repo_dir,
        &node_dir,
        &fs_extra::dir::CopyOptions::new().content_only(true),
    )
    .unwrap();

    println!("id: {:?}", std::process::Command::new("id").output());
    println!(
        "ls -alh /: {:?}",
        std::process::Command::new("ls")
            .arg("-alh")
            .arg("/")
            .output()
    );

    // Print value of $HOME via bash
    println!(
        "HOME: {:?}",
        std::process::Command::new("bash")
            .arg("-c")
            .arg("echo $HOME")
            .output()
    );

    // Npm install via bash
    std::process::Command::new("bash")
        .arg("-c")
        .arg("npm i")
        .current_dir(node_dir.clone())
        .status()
        .expect("Failed to install Lakekeeper UI dependencies with npm");

    // std::process::Command::new("npm")
    //     .args(&["ci"])
    //     .current_dir(node_dir.clone())
    //     .status()
    //     .map_err(|e| {
    //         println!("Error: {:?}", e);
    //         e
    //     })
    //     .expect("Failed to install Lakekeeper UI dependencies with npm");
    println!(
        "ls -alh /: {:?}",
        std::process::Command::new("ls")
            .arg("-alh")
            .arg("/")
            .output()
    );
    std::process::Command::new("npm")
        .args(&["run", "build-placeholder"])
        .current_dir(node_dir.clone())
        .status()
        .expect("Failed to build Lakekeeper UI with npm");
}
