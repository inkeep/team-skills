Use when: Setting up an isolated development environment (Phase 0 — worktree creation)
Priority: P0
Impact: Work bleeds into main directory

---

# Worktree Setup

## Why a worktree

A git worktree creates a separate working directory on its own branch while sharing the same `.git` directory. This keeps feature work isolated from the user's main working directory, where they may be doing other work.

## Decision table

Determine which action to take based on the current environment:

| Condition | Action |
|---|---|
| Already in a worktree or feature branch (e.g., invoked via Conductor, or user set up the branch manually) | Skip worktree creation. Verify branch is not `main`/`master`. Proceed to dependency installation. |
| In a container (`/.dockerenv` exists, or container-specific env vars like `CONTAINER=true` are set) | Skip worktree creation — containers typically lack the multi-directory structure worktrees need. If on `main`/`master`, create a feature branch: `git checkout -b feat/<feature-name>`. Proceed to dependency installation. |
| On `main`/`master` in the primary repo | Create a new worktree (see procedure below). |
| Ambiguous | Run `git worktree list` and `git branch --show-current` to determine which condition applies. |

**Feature name derivation:** Derive `<feature-name>` from the user's argument (feature description or SPEC.md filename). Use kebab-case. If a ticket ID exists (e.g., Linear, Jira), include it: `feat/ENG-123-feature-name`. If ambiguous, ask the user.

After this step, all subsequent phases operate from the feature workspace — specs, evidence, and state files all land here.

## Create the worktree

From the main repo directory:

```bash
git fetch origin main
git worktree add ../<feature-name> -b feat/<feature-name> origin/main
cd ../<feature-name>
```

## Install dependencies

Detect the package manager from `package.json`'s `packageManager` field (e.g., `pnpm@10.10.0`, `yarn@4.1.0`). If a specific version is pinned, use `npx <pm>@<version> install` to avoid lockfile mismatches. Using the wrong version can strip overrides from the lockfile, causing CI failures.

```bash
# Example for a pnpm-pinned repo:
npx pnpm@<version> install
```

Verify the lockfile is clean:
```bash
npx <pm>@<version> install --frozen-lockfile
```

If this fails, regenerate:
```bash
rm <lockfile>   # pnpm-lock.yaml, yarn.lock, package-lock.json
npx <pm>@<version> install
```

**Note:** Dependency installation and build verification may also be handled by the implementation skill at the start of its execution phase. This step ensures the worktree is usable immediately; the implementation skill's check is idempotent.

## Build and verify

Run the repo's quality gate commands to confirm the worktree is healthy:

```bash
<typecheck-cmd>   # e.g., pnpm typecheck
<test-cmd>        # e.g., pnpm test --run
```

Use the commands discovered during capability detection, not hardcoded defaults.

## Provision isolated app env (when supported)

If capability detection marks `isolatedEnv: true`, provision or attach the repo's isolated app env after the worktree is ready and before Phase 1 activates Ship state:

```bash
<path-to-skill>/scripts/ship-setup-isolated-env.sh --feature "<feature-name>"
```

What this helper does:
- derives a stable env name from the feature slug unless you pass `--name`
- prefers `pnpm setup-dev --isolated <name>` when the repo exposes it
- otherwise falls back to `./scripts/isolated-env.sh setup <name>`
- captures `./scripts/isolated-env.sh env <name>` into `${CLAUDE_SHIP_DIR:-tmp/ship}/isolated-env.sh`
- writes `${CLAUDE_SHIP_DIR:-tmp/ship}/isolated-env.json` so `ship-init-state.sh` can record the active env in `state.json`

From that point on, app-dependent repo commands can run under:

```bash
source ${CLAUDE_SHIP_DIR:-tmp/ship}/isolated-env.sh && <command>
```

Use the sourced env only for repo or app commands that talk to backing services, dev servers, or browser and integration targets. Do not prefix generic git-only steps with it.

## Cleanup (after PR is merged)

From the main repo:
```bash
git worktree remove ../<feature-name>
git branch -d feat/<feature-name>
git worktree prune
```

If the user wants the isolated app env torn down too, use the repo's own teardown command:

```bash
./scripts/isolated-env.sh down <feature-name>
```

Do not auto-destroy isolated envs by default. Leave them running unless the user explicitly asks for teardown.

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| Lockfile config mismatch in CI | Wrong package manager version used in worktree | Delete lockfile, reinstall with pinned version |
| Lockfile has unexpected changes | Major version mismatch (e.g., pnpm 9 vs 10) | Always use `npx <pm>@<pinned-version>` in worktrees |
| `Cannot create worktree: branch already exists` | Stale branch from previous run | `git branch -D feat/<name>` then retry (confirm with user first) |
| Build fails in worktree but not in main | Missing env vars or config | Copy `.env` from main repo or create from `.env.example` |
