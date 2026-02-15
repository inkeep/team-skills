---
name: ralph
description: "Convert SPEC.md to prd.json, craft the implementation prompt, and execute the iteration loop via subprocess. Use when converting specs to prd.json, preparing implementation artifacts, running the Ralph iteration loop, or implementing features autonomously. Triggers: ralph, prd.json, convert spec, implementation prompt, execute ralph, run implementation."
argument-hint: "[path to SPEC.md or prd.json]"
---

# Ralph

Convert a SPEC.md into implementation-ready artifacts and execute the iteration loop. Ralph operates in three phases:

1. **Convert** — Transform SPEC.md into a structured prd.json
2. **Prepare** — Validate the prd.json, craft the implementation prompt, save it to a file
3. **Execute** — Run `scripts/ralph.sh` to iterate through user stories via subprocess

Each phase can be entered independently. If you already have a prd.json, start at Phase 2. If artifacts are ready and you need execution, start at Phase 3. If you only need conversion, stop after Phase 1.

When composed by `/ship`, Ship invokes Ralph for the full lifecycle and reviews the output afterward. When standalone, Ralph runs end-to-end and reports results directly.

---

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| SPEC.md or prd.json path | Yes | — | Source artifact. When SPEC.md: used for Phase 1 conversion AND forwarded as iteration reference in Phase 2 (see Spec path forwarding). When prd.json: start at Phase 2 directly. |
| `--test-cmd` | No | `pnpm test --run` | Test runner command for quality gates |
| `--typecheck-cmd` | No | `pnpm typecheck` | Type checker command for quality gates |
| `--lint-cmd` | No | `pnpm lint` | Linter command for quality gates |
| `--no-browser` | No | Browser assumed available | Omit "Verify in browser" criteria from UI stories; substitute with Bash-verifiable criteria |
| `--docker [compose-file]` | No | — | Use Docker for Phase 3 execution. Optionally accepts a path to the compose file (e.g., `--docker .ai-dev/docker-compose.yml`). When passed without a path, discovers the compose file automatically. When omitted entirely, execution runs on the host. |

When composed by `/ship`, these overrides are passed based on Phase 0 context detection. When running standalone, defaults apply.

### Spec path forwarding

When a SPEC.md is provided (directly or by the invoker), the path persists beyond Phase 1 conversion. In Phase 2, Ralph embeds a file-path reference in the implementation prompt so that iteration agents read the full SPEC.md as the first action of every iteration. The spec content is NOT embedded in the prompt — the prompt contains only the file path.

This is mandatory when a spec path is available. The spec contains critical implementation context that prd.json's `implementationContext` cannot fully capture:
- **Non-goals** (what NOT to build) — completely absent from prd.json
- **Current state code traces** (file paths, line numbers, existing patterns) — compressed to prose in implementationContext
- **Decision rationale** — reduced to conclusions only
- **Risks and failure modes** — only partially captured in acceptance criteria

When only prd.json is provided (no SPEC.md available), `implementationContext` serves as the sole implementation context source. See Phase 1's implementationContext guidance for how to calibrate depth.

---

## Detect starting point

| Condition | Begin at |
|---|---|
| SPEC.md exists, no prd.json | Phase 1 (Convert) |
| prd.json exists, needs validation/prompt | Phase 2 (Prepare) |
| prd.json + `.claude/ralph-prompt.md` exist, ready to execute | Phase 3 (Execute) |
| Called with only a conversion request | Phase 1, then stop |

---

## Phase 1: Convert (SPEC.md to prd.json)

Take a SPEC.md and convert it to `prd.json` in the working directory.

### Output format

```json
{
  "project": "[Project Name]",
  "branchName": "ralph/[feature-name-kebab-case]",
  "description": "[Feature description from SPEC.md title/intro]",
  "implementationContext": "[Concise prose summary of architecture, constraints, key decisions, and current state from the SPEC.md — everything the implementer needs to know that doesn't fit in individual stories]",
  "userStories": [
    {
      "id": "US-001",
      "title": "[Story title]",
      "description": "As a [user], I want [feature] so that [benefit]",
      "acceptanceCriteria": [
        "Criterion 1",
        "Criterion 2",
        "Typecheck passes"
      ],
      "priority": 1,
      "passes": false,
      "notes": ""
    }
  ]
}
```

### Story size: the number one rule

**Each story must be completable in ONE Ralph iteration (one context window).**

Ralph receives the same prompt each iteration with no memory of previous work — only files and git history persist. If a story is too big, the LLM runs out of context before finishing and produces broken code.

**Right-sized stories:**
- Add a database column and migration
- Add a UI component to an existing page
- Update a server action with new logic
- Add a filter dropdown to a list

**Too big (split these):**
- "Build the entire dashboard" — Split into: schema, queries, UI components, filters
- "Add authentication" — Split into: schema, middleware, login UI, session handling
- "Refactor the API" — Split into one story per endpoint or pattern

**Rule of thumb:** If you cannot describe the change in 2-3 sentences, it is too big.

### Story ordering: dependencies first

Stories execute in priority order. Earlier stories must not depend on later ones.

**Correct order:**
1. Schema/database changes (migrations)
2. Server actions / backend logic
3. UI components that use the backend
4. Dashboard/summary views that aggregate data

**Wrong order:**
1. UI component (depends on schema that does not exist yet)
2. Schema change

### Acceptance criteria: must be verifiable

Each criterion must be something Ralph can CHECK, not something vague.

**Good criteria (verifiable):**
- "Add `status` column to tasks table with default 'pending'"
- "Filter dropdown has options: All, Active, Completed"
- "Clicking delete shows confirmation dialog"
- "Typecheck passes"
- "Tests pass"

**Bad criteria (vague):**
- "Works correctly"
- "User can do X easily"
- "Good UX"
- "Handles edge cases"

**Implementation-coupled criteria (fragile):**
- "handleStatusChange calls db.update with the correct enum"
- "Component renders by calling useTaskList hook"
- "API handler invokes validateInput before processing"

**Behavioral criteria (resilient):**
- "Task with changed status is retrievable with the new status"
- "Task list displays only tasks matching the selected filter"
- "Invalid status value returns 400 with descriptive error message"

Implementation-coupled criteria produce tests that break on refactor even when behavior is unchanged. Behavioral criteria produce tests that survive internal restructuring. See /tdd.

**Always include as final criterion:**
```
"Typecheck passes"
```

For stories with testable logic, also include:
```
"Tests pass"
```

For stories that change UI — **if browser automation is available** (no `--no-browser` flag):
```
"Verify in browser using dev-browser skill"
```

Frontend stories are NOT complete until visually verified. Ralph will use the dev-browser skill to navigate to the page, interact with the UI, and confirm changes work.

**If browser is NOT available** (`--no-browser`): Omit the browser criterion. Instead, add Bash-verifiable criteria that cover the UI behavior through API responses or rendered output (e.g., "API response includes the updated status badge markup", "Server-rendered HTML contains filter dropdown with options: All, Active, Completed").

### Conversion rules

1. **Each user story becomes one JSON entry**
2. **IDs**: Sequential (US-001, US-002, etc.)
3. **Priority**: Based on dependency order, then document order
4. **All stories**: `passes: false` and empty `notes`
5. **branchName**: Derive from feature name, kebab-case, prefixed with `ralph/`
6. **Always add**: "Typecheck passes" to every story's acceptance criteria

### Extracting implementation context from the SPEC.md

The `implementationContext` field captures spec-level knowledge that applies across all stories — things the implementer needs every iteration but that don't belong in any single story's acceptance criteria.

Extract from these SPEC.md sections:

| SPEC.md section | What to extract | Why it matters |
|---|---|---|
| §9 Proposed solution — System design | Architecture overview, data model, API shape, auth/permissions model | Without this, the implementer guesses the architecture or contradicts the spec's design |
| §6 Non-functional requirements | Performance targets, security constraints, reliability requirements, operability needs | These constrain *how* every story is implemented, not *what* |
| §10 Decision log | Settled decisions (especially 1-way doors) with brief rationale | Prevents the implementer from revisiting or contradicting decisions made during the spec process |
| §8 Current state | How the system works today, key integration points, known gaps | The implementer needs to know what exists to integrate with it correctly |

**What to write:** A concise prose summary. Not a copy-paste of the spec sections — a distillation of what the implementer needs to hold in mind while working on every story.

**Calibrate depth based on spec availability:**

| Spec available during implementation? | implementationContext role | Recommended depth |
|---|---|---|
| **Yes** — spec path forwarded to Phase 2 (default when composed by `/ship` or when user provides both) | Quick orientation summary. The full SPEC.md provides deep context — iteration agents read it as step 1. | 3-5 sentences — architecture overview and key constraints only |
| **No** — prd.json is the sole artifact (user invokes Ralph with prd.json only, or spec is unavailable) | Primary and sole implementation context source. Must stand on its own. | 5-10 sentences — include architecture, non-goals, current state integration points, key decisions with rationale, and critical constraints |

When in doubt about whether the spec will be available, write the longer form — it's never wrong to include more context, but the shorter form risks leaving the iteration agent under-informed.

**Good example:**
> "The feature adds a `status` column to the tasks table with an enum type. The API uses the existing RESTful pattern in `/api/tasks/`. Auth is handled by the existing tenant-scoped middleware — do not add new auth logic. The current task list fetches via `getTasksByProject()` in the data-access layer; the new filter must use the same query pattern. Decision D3: we chose server-side filtering over client-side because the dataset can exceed 10k rows."

**Bad example (too vague):**
> "Implement the task status feature following good practices."

### Splitting large specs

If a SPEC.md has large features, split them:

**Original:**
> "Add user notification system"

**Split into:**
1. US-001: Add notifications table to database
2. US-002: Create notification service for sending notifications
3. US-003: Add notification bell icon to header
4. US-004: Create notification dropdown panel
5. US-005: Add mark-as-read functionality
6. US-006: Add notification preferences page

Each is one focused change that can be completed and verified independently.

### Converting failure paths into acceptance criteria

SPEC.md §5 (User journeys) includes failure/recovery paths and debug experience per persona. These are often the difference between a feature that works in demos and one that works in production.

Do not discard failure paths during conversion. For each failure scenario in the spec:

1. **Identify which story it belongs to** — match the failure to the story that implements the relevant functionality.
2. **Convert it to a verifiable acceptance criterion** on that story.

**Example:**

SPEC.md failure path:
> Failure: User sets an invalid status value via API → System returns 400 with error message "Invalid status. Allowed values: pending, in_progress, done"

Becomes an acceptance criterion on the relevant story:
```
"API returns 400 with descriptive error when status value is not in [pending, in_progress, done]"
```

If a failure scenario spans multiple stories (e.g., "network error during save should show retry button"), attach the criterion to the story where the user-facing behavior lives (the UI story, not the backend story).

### Applying non-functional requirements as cross-cutting criteria

SPEC.md §6 includes non-functional requirements: performance, reliability, security/privacy, operability, cost. These constrain *how* stories are implemented.

For each non-functional requirement in the spec:

1. **Determine if it's universally applicable** (e.g., "all endpoints must validate tenant isolation") or **story-specific** (e.g., "list query must return in <200ms for 10k rows").
2. **Universal constraints**: add as a criterion to every story they apply to.
3. **Story-specific constraints**: add as a criterion to the relevant story only.

**Examples:**

| Non-functional requirement | Becomes criterion on |
|---|---|
| "All API endpoints must validate tenant isolation" | Every story that adds/modifies an API endpoint |
| "List query must paginate and return in <200ms" | The story that implements the list/filter |
| "Status changes must be audit-logged" | The story that implements the status toggle |

Do not create separate "non-functional" stories. These constraints should be woven into the stories that implement the relevant functionality.

### Example

**Input SPEC.md (abbreviated):**
```markdown
# Task Status Feature

Add ability to mark tasks with different statuses.

## Requirements
- Toggle between pending/in-progress/done on task list
- Filter list by status
- Show status badge on each task
- Persist status in database

## Non-functional requirements
- Status changes must be tenant-scoped

## User journeys — Failure paths
- Invalid status value via API → return 400 with descriptive error

## Current state
- Tasks stored in tasks table, accessed via getTasksByProject()
- API uses RESTful patterns under /api/tasks/
- UI uses TaskCard component in components/tasks/
```

**Output prd.json:**
```json
{
  "project": "TaskApp",
  "branchName": "ralph/task-status",
  "description": "Task Status Feature - Track task progress with status indicators",
  "implementationContext": "Tasks are stored in a tasks table accessed via getTasksByProject() in the data-access layer. The API follows RESTful patterns under /api/tasks/. Auth uses existing tenant-scoped middleware. The status field should be an enum column with a database-level constraint. UI components use the existing TaskCard component in components/tasks/.",
  "userStories": [
    {
      "id": "US-001",
      "title": "Add status field to tasks table",
      "description": "As a developer, I need to store task status in the database.",
      "acceptanceCriteria": [
        "Add status column: 'pending' | 'in_progress' | 'done' (default 'pending')",
        "Generate and run migration successfully",
        "Typecheck passes"
      ],
      "priority": 1,
      "passes": false,
      "notes": ""
    },
    {
      "id": "US-002",
      "title": "Display status badge on task cards",
      "description": "As a user, I want to see task status at a glance.",
      "acceptanceCriteria": [
        "Each task card shows colored status badge",
        "Badge colors: gray=pending, blue=in_progress, green=done",
        "Typecheck passes",
        "Verify in browser using dev-browser skill"
      ],
      "priority": 2,
      "passes": false,
      "notes": ""
    },
    {
      "id": "US-003",
      "title": "Add status toggle to task list rows",
      "description": "As a user, I want to change task status directly from the list.",
      "acceptanceCriteria": [
        "Each row has status dropdown or toggle",
        "Changing status saves immediately",
        "UI updates without page refresh",
        "API returns 400 with descriptive error when status value is not in [pending, in_progress, done]",
        "Status update is tenant-scoped (uses existing tenant middleware)",
        "Typecheck passes",
        "Verify in browser using dev-browser skill"
      ],
      "priority": 3,
      "passes": false,
      "notes": ""
    },
    {
      "id": "US-004",
      "title": "Filter tasks by status",
      "description": "As a user, I want to filter the list to see only certain statuses.",
      "acceptanceCriteria": [
        "Filter dropdown: All | Pending | In Progress | Done",
        "Filter persists in URL params",
        "Typecheck passes",
        "Verify in browser using dev-browser skill"
      ],
      "priority": 4,
      "passes": false,
      "notes": ""
    }
  ]
}
```

### Archiving previous runs

**Before writing a new prd.json, check if there is an existing one from a different feature:**

1. Read the current `prd.json` if it exists
2. Check if `branchName` differs from the new feature's branch name
3. If different AND `progress.txt` has content beyond the header:
   - Create archive folder: `archive/YYYY-MM-DD-feature-name/`
   - Copy current `prd.json` and `progress.txt` to archive
   - Reset `progress.txt` with fresh header

### Phase 1 checklist

Before writing prd.json, verify:

- [ ] **Previous run archived** (if prd.json exists with different branchName, archive it first)
- [ ] Each story is completable in one iteration (small enough)
- [ ] Stories are ordered by dependency (schema to backend to UI)
- [ ] Every story has "Typecheck passes" as criterion
- [ ] UI stories have "Verify in browser using dev-browser skill" as criterion (if browser available) or Bash-verifiable substitutes (if `--no-browser`)
- [ ] Acceptance criteria are verifiable and not vague; functional criteria describe observable behavior, not internal mechanisms (see /tdd)
- [ ] No story depends on a later story
- [ ] **`implementationContext` extracted** from SPEC.md §8, §9, §10, §6 — concise prose, not a copy-paste
- [ ] **Failure/recovery paths** from SPEC.md §5 converted into acceptance criteria on relevant stories
- [ ] **Non-functional requirements** from SPEC.md §6 applied as cross-cutting criteria where applicable

---

## Phase 2: Prepare

Validate the prd.json, craft the implementation prompt, and save it to a file for execution.

### Validate prd.json against SPEC.md

Compare each user story to its corresponding requirement in the SPEC.md:

- [ ] Stories are correctly scoped (each completable in one iteration)
- [ ] Stories are properly ordered (dependencies first)
- [ ] Acceptance criteria are specific and verifiable
- [ ] No requirements from the SPEC.md are missing from prd.json
- [ ] No stories exceed what the SPEC.md calls for

Fix discrepancies before starting Ralph — errors here compound through every iteration.

### Validate prd.json schema

If `bun` is available, run the schema validator:

```bash
bun <path-to-skill>/scripts/validate-prd.ts prd.json
```

This checks structural integrity: required fields, ID format (US-NNN), sequential priorities, duplicate detection, and "Typecheck passes" criterion presence. Zero external dependencies — runs anywhere bun is installed.

If `bun` is not available, manually verify the prd.json structure matches the schema in Phase 1.

### Place prd.json

Put `prd.json` in the worktree root or `.claude/` directory where Ralph can find it.

### Verify branch safety

If on `main` or `master`, warn before proceeding — Ralph should normally run on a feature branch. If no branching model exists (e.g., container environment with no PR workflow), proceed with caution and ensure commits are isolated.

### Craft the implementation prompt

**Load:** `templates/ralph-prompt.template.md`

The template contains two complete prompt variants with `{{PLACEHOLDER}}` syntax. Choose ONE variant and fill all placeholders.

**Choose variant:**
- **Variant A** — when a SPEC.md path is available (directly provided or from Phase 1)
- **Variant B** — when only prd.json is available (no SPEC.md)

**Conditionality lives HERE (in Phase 2 construction), NOT in the iteration prompt.** The iteration agent sees a single, unconditional workflow — never both variants, never conditional "if spec is available" logic.

**Fill `{{CODEBASE_CONTEXT}}`:** Include the specific patterns, shared vocabulary, and abstractions in the area being modified — more actionable than generic CLAUDE.md guidance. Examples: "The API follows RESTful patterns under /api/tasks/", "Auth uses tenant-scoped middleware in auth.ts", "Data access uses the repository pattern in data-access/". Also include repo conventions from CLAUDE.md (testing patterns, file locations, formatting) that the iteration agent needs.

**Fill quality gate commands:** Use the commands from Inputs (defaults: `pnpm typecheck`, `pnpm lint`, `pnpm test --run`) — override with `--typecheck-cmd`, `--lint-cmd`, `--test-cmd` if provided.

**Fill `{{SPEC_PATH}}`** (Variant A only): Use a path relative to the working directory (e.g., `.claude/specs/my-feature/SPEC.md`). Relative paths work across execution contexts (host, Docker, worktree). Do NOT use absolute paths — they break when the prompt is executed in a different environment. Do NOT embed spec content in the prompt — the iteration agent reads it via the Read tool each iteration.

### Save the prompt

Save the crafted implementation prompt to `.claude/ralph-prompt.md`. This file is consumed by Phase 3 (`scripts/ralph.sh`) for automated execution, or by the user for manual iteration (`/ralph-loop`, `claude -p`).

### Copy ralph.sh to execution location

Copy the skill's canonical `scripts/ralph.sh` to `.claude/ralph.sh` in the working directory and make it executable:

```bash
cp <path-to-skill>/scripts/ralph.sh .claude/ralph.sh
chmod +x .claude/ralph.sh
```

This places the iteration loop script alongside the implementation prompt (`.claude/ralph-prompt.md`) as a paired execution artifact. The copy enables:
- **Manual execution** — users can run `.claude/ralph.sh --force` directly without knowing the skill's install path
- **Docker execution** — containers access `.claude/ralph.sh` via bind mount (see `references/execution.md`)

Phase 3 on host uses the skill's own `scripts/ralph.sh` directly (validate-prd.ts is available next to it). The `.claude/ralph.sh` copy is for Docker, manual, and external execution contexts.

### Phase 2 checklist

- [ ] prd.json validated against SPEC.md (if available)
- [ ] prd.json schema validated (via `scripts/validate-prd.ts` if bun available)
- [ ] Stories correctly scoped, ordered, and with verifiable criteria
- [ ] Implementation prompt crafted from template with correct variant (A or B)
- [ ] All `{{PLACEHOLDERS}}` filled (spec path, quality gates, codebase context)
- [ ] Completion signal present in saved prompt (included in template — verify not accidentally removed)
- [ ] Prompt saved to `.claude/ralph-prompt.md`
- [ ] `ralph.sh` copied to `.claude/ralph.sh` and made executable

---

## Phase 3: Execute

Run the iteration loop via `scripts/ralph.sh`. Each iteration spawns a fresh Claude Code subprocess — full capabilities, zero shared context between iterations.

**Load:** `references/execution.md`

### Step 1: Probe for Claude CLI

Check if automated execution is possible:

```bash
env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude --version
```

If this fails, automated execution is not available — skip to the fallback below.

### Step 2: Choose execution context (host vs Docker)

**If `--docker` was NOT passed:** Execute on the host (default). Proceed to Step 3.

**If `--docker` was passed:** Use Docker for execution.

1. **Resolve the compose file.** If a path was provided (e.g., `--docker .ai-dev/docker-compose.yml`), use it. Otherwise, discover it: search the repo for `**/docker-compose.yml` or `**/compose.yml` files whose content defines a `sandbox` service. Use the first match. If none found, error: "No compose file with a sandbox service found in this repo."

2. **Ensure the container is running:**
   ```bash
   docker compose -f <compose-file> ps --status running sandbox
   ```
   If not running, start it: `docker compose -f <compose-file> up -d`.

3. Proceed — Step 5 uses the Docker invocation variant.

### Step 3: Pre-execution quality gate baseline

Before starting the iteration loop, run the quality gates to establish a baseline:

```bash
<typecheck-cmd>  # e.g., pnpm typecheck
<lint-cmd>       # e.g., pnpm lint
<test-cmd>       # e.g., pnpm test --run
```

If any gate fails, warn the operator: "Quality gates are failing before Ralph starts. Pre-existing failures will cost Ralph iterations to diagnose. Consider fixing them first."

Log the baseline to `progress.txt` regardless of result:

```
## Pre-execution baseline - [timestamp]
- Typecheck: PASS/FAIL
- Lint: PASS/FAIL
- Test: PASS/FAIL
```

Do not block execution — the operator may be running Ralph specifically to fix failures. But the baseline log helps iteration agents distinguish pre-existing failures from regressions they introduced.

### Step 4: Determine parameters

Count the incomplete stories in prd.json and select parameters:

| Feature complexity | --max-iterations | --max-turns |
|---|---|---|
| Small (1-3 stories) | 10-15 | 50 |
| Medium (4-8 stories) | 20-30 | 75 |
| Large (9+ stories) | 30-50 | 100 |

### Step 5: Invoke ralph.sh

Run in background to avoid the Bash tool's 600-second timeout.

**Host execution (default):**

```
Bash(command: "<path-to-skill>/scripts/ralph.sh --max-iterations <N> --max-turns <M> --force",
     run_in_background: true,
     description: "Ralph execution run 1")
```

**Docker execution (when `--docker` was passed — compose file resolved in Step 2):**

```
Bash(command: "docker compose -f <compose-file> exec sandbox .claude/ralph.sh --max-iterations <N> --max-turns <M> --force",
     run_in_background: true,
     description: "Ralph Docker execution run 1")
```

Always pass `--force` — background execution has no TTY for interactive prompts.

Poll for completion using `TaskOutput(block: false)` at intervals. While waiting, do lightweight work (re-read spec, review task list) but do NOT make code changes that could conflict.

### Step 6: Assess results

When ralph.sh completes, read `prd.json` and `progress.txt`:

- **All stories `passes: true`** → execution succeeded. Proceed to Phase 3 checklist.
- **Some stories incomplete** → check progress.txt for blockers. Apply stuck story handling (see `references/execution.md`), then re-invoke ralph.sh for another run.
- **ralph.sh exited with error** → read output for details. If transient (network, rate limit), retry once. If persistent, fall back to manual instructions.

### Step 7: Stuck story handling (between runs)

If the same story fails across 2 consecutive ralph.sh runs with the same blocker:

1. **Story too large** → split into smaller stories in prd.json
2. **Criteria ambiguous** → rewrite criteria to be more specific
3. **External dependency blocking** → skip the story, set `notes` explaining the blocker
4. **Wrong implementation approach** → add guidance to `progress.txt` suggesting an alternative

After 3 consecutive failed runs on the same story, stop and consult the user.

Re-invoke ralph.sh after applying remediation. Maximum 3 total ralph.sh runs before escalating to the user.

### Fallback: Claude CLI not available

If the Claude CLI probe in Step 1 failed, automated execution is not possible. Ralph still provides full value through Phases 1-2 — the artifacts are ready.

Tell the user:

1. The implementation artifacts have been saved to `.claude/ralph-prompt.md` and `.claude/ralph.sh`
2. For manual execution using the iteration loop:
   ```bash
   .claude/ralph.sh --max-iterations <N> --max-turns <M> --force
   ```
3. Or using `/ralph-loop`:
   ```
   /ralph-loop "$(cat .claude/ralph-prompt.md)" --max-iterations <N> --completion-promise "IMPLEMENTATION COMPLETE"
   ```

### Phase 3 checklist

- [ ] All stories in prd.json have `passes: true` (or stuck stories documented with `notes`)
- [ ] progress.txt reviewed — no unresolved blockers
- [ ] Quality gates pass: typecheck, lint, test

**After Phase 3:**
- If composed by `/ship`: Ship continues with post-implementation review and testing.
- If standalone: read every file created or modified. Ralph's output is your starting point, not your endpoint. Run quality gates manually.
