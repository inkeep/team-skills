Use when: Setting up an isolated development environment for feature work (Phase 2)
Priority: P0
Impact: Wrong pnpm version breaks lockfile; work bleeds into main directory; CI fails on lockfile mismatch

---

# Worktree Setup

## Why a worktree

A git worktree creates a separate working directory on its own branch while sharing the same `.git` directory. This keeps feature work isolated from the user's main `~/InkeepDev/agents` directory, where they may be doing other work.

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

```bash
cd ../<feature-name>
git push -u origin feat/<feature-name>
gh pr create --draft --title "feat: <feature description>" --body "## Summary
<initial description from SPEC.md>

## Test plan
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Manual verification complete

Generated with [Claude Code](https://claude.com/claude-code)"
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
