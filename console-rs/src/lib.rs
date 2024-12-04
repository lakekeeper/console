use rust_embed::Embed;

#[derive(Embed)]
#[folder = "$OUT_DIR/console"]
pub struct LakekeeperConsole;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_index_available() {
        let index: rust_embed::EmbeddedFile = LakekeeperConsole::get("index.html").unwrap();
        assert!(index.data.len() > 0);
    }
}
