# Releasing

How the console frontend is versioned and how it tracks Lakekeeper backend
releases.

## TL;DR

- Each frontend repo keeps its **own semver** (managed by release-please). Those
  numbers are **not** the Lakekeeper version and never will be — resetting them
  would be a version downgrade, which breaks npm and release tooling.
- Alignment to a Lakekeeper release is expressed by a **shared branch name**, not
  by the version number. The branch `rel-0-13` in this repo pairs with
  `rel-0-13` in `lakekeeper/lakekeeper`.
- `main` is the newest, in-development line. `rel-0-X` branches are the
  maintenance lines for already-released Lakekeeper minors.

## Branch model

| Branch | Purpose |
|---|---|
| `main` | Newest line; tracks the latest Lakekeeper. New features land here. |
| `rel-0-X` | Maintenance line for Lakekeeper `0.X`. Mirrors `lakekeeper/lakekeeper`'s `rel-0-X`. Long-lived; **never delete** until that Lakekeeper minor is EOL. |
| feature / fix branches | Short-lived; open a PR into `main` or a `rel-0-X`, squash-merge, auto-delete. |

The shared branch name is the whole cross-repo reference: `rel-0-13` means "the
console that goes with Lakekeeper 0.13", no lookup table required. Frontend semver
stays monotonic (e.g. `console` may be `0.21.x` on `rel-0-13`); the **branch name
carries the Lakekeeper line, the tag carries the frontend version**.

Compatibility chain for a given line:

```
lakekeeper rel-0-13  →  console rel-0-13  →  @lakekeeper/console-components (pinned in package.json)
```

The exact library version is always the pin in `console`'s `package.json`; you
never track it separately. The frontend `rel-0-X` line is built against
[`lakekeeper` @ `rel-0-13`](https://github.com/lakekeeper/lakekeeper/tree/rel-0-13).

### Compatibility matrix

One row per Lakekeeper release; **append a new row on each release**. The `Version`
column is the Lakekeeper release line (plain text, matches `rel-0-X`); the remaining
cells are **linked tags** — immutable, one click → exact commit + changelog. Not
branch names (they move) or raw SHAs (redundant with the tag).

| Version | lakekeeper | console | console-components |
|---|---|---|---|
| 0.13.1 | [v0.13.1](https://github.com/lakekeeper/lakekeeper/releases/tag/v0.13.1) | [v0.21.1](https://github.com/lakekeeper/console/releases/tag/v0.21.1) | [v0.17.1](https://github.com/lakekeeper/console-components/releases/tag/v0.17.1) |

## Why the OpenAPI spec makes this necessary

`main` follows the newest Lakekeeper, so its `openapi/*.yaml` (and the generated
client) can carry API changes that do **not** exist in an older backend. A fix
that depends on new spec cannot be shipped to an old line. That is the entire
reason a `rel-0-X` line exists.

**Rule:** on a `rel-0-X` branch, the OpenAPI spec is pinned to the matching
Lakekeeper `rel-0-X` (not Lakekeeper `main`). Point the spec-update recipe at the
`rel-0-X` ref before regenerating on a maintenance branch.

## How to use it

### Ship a fix to the current (`main`) line
1. Branch off `main`, make the change, open a PR into `main`.
2. Squash-merge. release-please opens/updates a `chore(main): release …` PR.
3. Merge that release PR → tag + GitHub release.

### Ship a patch to an older Lakekeeper line (backport)
1. If `rel-0-X` does not exist yet, cut it from the last tag that was on the `0.X`
   spec and push it:
   ```bash
   git branch rel-0-13 <last-0.13-tag>
   git push -u origin rel-0-13
   ```
   Keep it afterward — do not delete.
2. Branch off `rel-0-X`, apply the fix (cherry-pick from `main` when the fix
   already exists there; otherwise write it directly on the branch), open a PR
   **into `rel-0-X`**.
3. Squash-merge. release-please cuts the next patch on that line.

### PR conventions
- Conventional commits; add the `BEGIN_COMMIT_OVERRIDE` / `END_COMMIT_OVERRIDE`
  block in the PR body so release-please builds the changelog from it on squash.
- When the release relates to a specific Lakekeeper version, say so in the
  override line — it lands permanently in `CHANGELOG.md`:
  ```
  BEGIN_COMMIT_OVERRIDE
  fix(ui): <what changed> for Lakekeeper 0.13.1
  END_COMMIT_OVERRIDE
  ```

## release-please on maintenance branches

release-please must run per branch. In `.github/workflows/release.yml`:

1. Add the maintenance branches to the push trigger:
   ```yaml
   on:
     push:
       branches: [main, main-*, rel-*]
   ```
2. Make it target the branch that triggered the run:
   ```yaml
   target-branch: ${{ github.ref_name }}
   ```
   (Confirm this against the `RELEASE_PLEASE_TARGET_BRANCH` repo variable — that
   variable is single-valued and cannot drive both `main` and `rel-*` at once.)

Each branch keeps its own entry in `release-please/.release-please-manifest.json`
and its own `CHANGELOG.md` section and tags.

## Repo settings (GitHub Settings — not in git)

The branch/target logic lives in `release.yml` (version-controlled). These few
things *cannot* — documented here so they aren't hidden knowledge:

- **Secret `RELEASE_PLEASE_TOKEN`** — token release-please uses to open release PRs
  and push tags.
- **Variable `RELEASE_PLEASE_ACTIVATED`** — gate that enables the release job.
  (The old `RELEASE_PLEASE_TARGET_BRANCH` variable is no longer used — the workflow
  derives the target from `github.ref_name`.)
- **Branch protection** on `main` and `rel-*` — PR-only, no direct push, no deletion.
- **General → Pull Requests → "Automatically delete head branches"** enabled — cleans
  up short-lived feature/fix branches; `main` / `rel-*` are protected from deletion.
