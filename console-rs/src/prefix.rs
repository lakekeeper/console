use std::fmt;

/// URL path in front of `/ui/` under which a reverse proxy mounts Lakekeeper,
/// for example `lakekeeper` for `https://example.com/lakekeeper/ui/`.
///
/// Segments consist of the characters RFC 3986 allows in a path segment
/// (letters, digits, `-._~!$'()*+,;=:@` and percent-encoded bytes) except `&`,
/// and are never dot segments, also not percent-encoded ones. So the value goes
/// into a double-quoted HTML attribute or a `Location` header unescaped, keeps
/// its meaning when a browser resolves it, and cannot leave the origin.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct BasePrefix(String);

/// A path prefix with a character or segment that [`BasePrefix`] rejects.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InvalidBasePrefix;

impl fmt::Display for InvalidBasePrefix {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(
            "path prefix must consist of non-empty path segments of letters, digits, `-._~!$'()*+,;=:@` and percent-encoded bytes, without `.` or `..` segments",
        )
    }
}

impl std::error::Error for InvalidBasePrefix {}

impl BasePrefix {
    /// No prefix: the console is served at `/ui/`.
    #[must_use]
    pub fn root() -> Self {
        Self::default()
    }

    /// Parse a prefix such as `/lakekeeper/` or `a/b`. Leading and trailing
    /// slashes are ignored; an empty value is [`BasePrefix::root`].
    ///
    /// # Errors
    /// If a segment is empty, is a dot segment, or contains a character outside
    /// the set described on [`BasePrefix`].
    pub fn parse(raw: &str) -> Result<Self, InvalidBasePrefix> {
        let trimmed = raw.trim_matches('/');
        if trimmed.is_empty() {
            return Ok(Self::root());
        }
        if trimmed.split('/').all(is_valid_segment) {
            Ok(Self(trimmed.to_string()))
        } else {
            Err(InvalidBasePrefix)
        }
    }

    /// Absolute path of the console: `/{prefix}/ui/`, or `/ui/` without a prefix.
    #[must_use]
    pub fn ui_path(&self) -> String {
        if self.0.is_empty() {
            "/ui/".to_string()
        } else {
            format!("/{}/ui/", self.0)
        }
    }
}

fn is_valid_segment(segment: &str) -> bool {
    // Browsers resolve these as `.` and `..` (WHATWG URL, single- and double-dot segments).
    let dot_segment = matches!(
        segment.to_ascii_lowercase().as_str(),
        "." | "%2e" | ".." | ".%2e" | "%2e." | "%2e%2e"
    );
    if segment.is_empty() || dot_segment {
        return false;
    }
    let bytes = segment.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        match bytes[i] {
            b'A'..=b'Z'
            | b'a'..=b'z'
            | b'0'..=b'9'
            | b'-'
            | b'.'
            | b'_'
            | b'~'
            | b'!'
            | b'$'
            | b'\''
            | b'('
            | b')'
            | b'*'
            | b'+'
            | b','
            | b';'
            | b'='
            | b':'
            | b'@' => i += 1,
            b'%' if bytes.len() > i + 2
                && bytes[i + 1].is_ascii_hexdigit()
                && bytes[i + 2].is_ascii_hexdigit() =>
            {
                i += 3;
            }
            _ => return false,
        }
    }
    true
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepted_prefixes() {
        for (raw, ui_path) in [
            ("", "/ui/"),
            ("/", "/ui/"),
            ("lakekeeper", "/lakekeeper/ui/"),
            ("/lakekeeper/", "/lakekeeper/ui/"),
            ("a/b", "/a/b/ui/"),
            ("v1.2_x~y-Z", "/v1.2_x~y-Z/ui/"),
            ("my%20lake", "/my%20lake/ui/"),
            ("data+ai", "/data+ai/ui/"),
            ("a:b@c;d=e,f!$'()*", "/a:b@c;d=e,f!$'()*/ui/"),
            ("v%2e1", "/v%2e1/ui/"),
            ("a%2Fb", "/a%2Fb/ui/"),
            ("ui", "/ui/ui/"),
            // Never protocol-relative: leading slashes are dropped.
            ("//evil.example", "/evil.example/ui/"),
        ] {
            assert_eq!(BasePrefix::parse(raw).unwrap().ui_path(), ui_path, "{raw}");
        }
    }

    #[test]
    fn rejected_prefixes() {
        for raw in [
            "\\evil.example",
            "a\\b",
            "a//b",
            ".",
            "..",
            "a/../b",
            "a/./b",
            "%2e",
            "%2E%2e",
            ".%2E",
            "a/%2e%2e/b",
            "a b",
            "a\"b",
            "<script>",
            "a`b",
            "a?b",
            "a#b",
            "a&b",
            "%zz",
            "%2",
            "a%",
            "caf\u{e9}",
            "a\tb",
        ] {
            assert_eq!(BasePrefix::parse(raw), Err(InvalidBasePrefix), "{raw:?}");
        }
    }
}
