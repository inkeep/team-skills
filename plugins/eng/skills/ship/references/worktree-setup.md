Use when: Setting up an isolated development environment for feature work (Phase 2)
Priority: P0
Impact: Wrong pnpm version breaks lockfile; work bleeds into main directory; CI fails on lockfile mismatch

---

# Worktree Setup

## Why a worktree

A git worktree creates a separate working directory on its own branch while sharing the same `.git` directory. This keeps feature work isolated from the user's main `~/InkeepDev/agents` directory, where they may be doing other work.

## Detect existing environment

Before creating a worktree, check whether you are already in one:

```bash
# Check if currently in a worktree
git worktree list
git branch --show-current
```

**If you are already on a feature branch** (e.g., invoked via Conductor, or the user set up the branch manually):
- Do NOT create a new worktree. Use the current directory.
- Verify branch is not `main` or `master`.
- Skip to step 2 (install dependencies) to ensure the environment is clean.

**If you are on `main`/`master`** in the primary repo:
- Proceed with step 1 to create a fresh worktree.

## Setup procedure

### 1. Create the worktree

From the main repo directory:

```bash
git fetch origin main
git worktree add ../<feature-name> -b feat/<feature-name> origin/main
```

**Naming:** Match directory name to branch name (minus prefix). If a Linear ticket exists, include it: `feat/ENG-123-feature-name`.

### 2. Install dependencies with the correct pnpm version

The repo uses `pnpm@10.10.0` (specified in `packageManager` field of root `package.json`). The system may have an older version. Using the wrong version will strip overrides from the lockfile, causing `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH` in CI.

```bash
cd ../<feature-name>
npx pnpm@10.10.0 install
```

Verify the lockfile is clean:
```bash
npx pnpm@10.10.0 install --frozen-lockfile
```

If this fails, regenerate:
```bash
rm pnpm-lock.yaml
npx pnpm@10.10.0 install
```

### 3. Run conductor setup (if applicable)

If `conductor.json` exists in the repo root:
```bash
# conductor setup copies skills and configures .claude/settings.local.json
# Check conductor.json for the setup script and run it
```

### 4. Build and verify

```bash
npx pnpm@10.10.0 build
npx pnpm@10.10.0 typecheck
npx pnpm@10.10.0 test --run
```

### 5. Create draft PR

Use the SPEC.md as the basis for the PR body. At this stage (pre-implementation), the Approach section reflects the plan; the Changes section is a placeholder. Both will be updated as implementation progresses.

```bash
cd ../<feature-name>
git push -u origin feat/<feature-name>
gh pr create --draft --title "feat: <feature description>" --body "$(cat <<'EOF'
## Summary
<distill from SPEC.md §1 — what this PR will do and why>

## Motivation
<distill from SPEC.md §1-§2 — problem, why now, who benefits>

## Approach
<distill from SPEC.md §9 — planned design and key decisions>

## Changes
_Implementation in progress._

## Test plan
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Manual verification complete

**Spec:** <link or path to SPEC.md>

Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## Cleanup (after PR is merged)

From the main repo:
```bash
git worktree remove ../<feature-name>
git branch -d feat/<feature-name>
git worktree prune
```

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH` | Wrong pnpm version used | `rm pnpm-lock.yaml && npx pnpm@10.10.0 install` |
| Lockfile has unexpected changes | pnpm 9 vs 10 difference | Always use `npx pnpm@10.10.0` in worktrees |
| `Cannot create worktree: branch already exists` | Stale branch | `git branch -D feat/<name>` then retry (confirm with user first) |
| Build fails in worktree but not in main | Missing env vars | Copy `.env` from main repo or create from `.env.example` |
