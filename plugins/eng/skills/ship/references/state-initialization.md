Use when: Phase 1, Step 3 — creating execution state and activating the ship loop
Priority: P0
Impact: Without state initialization, stop hook cannot recover context after compaction, loop cannot activate

---

# State Initialization

The worktree and feature branch were created in Phase 0, Step 1. Dependency installation and build verification are handled by `/implement` at the start of Phase 2.

## 1. Create state.json

Create the execution state directory (`mkdir -p tmp/ship`) and write `tmp/ship/state.json` so hooks can recover context after compaction:

```json
{
  "currentPhase": "Phase 2",
  "featureName": "<derived from spec or user input>",
  "specPath": "<path to SPEC.md>",
  "specJsonPath": "tmp/ship/spec.json",
  "branch": "<feature branch name>",
  "worktreePath": "<worktree path or null if working in-place>",
  "prNumber": null,
  "qualityGates": { "test": "<cmd>", "typecheck": "<cmd>", "lint": "<cmd>" },
  "completedPhases": ["Phase 0", "Phase 1"],
  "capabilities": { "gh": true, "browser": true, "peekaboo": true, "docker": false },
  "scopeCalibration": "<feature|enhancement|bugfix>",
  "amendments": [],
  "lastUpdated": "<ISO 8601 timestamp>"
}
```

All ship execution state lives in `tmp/ship/` — this directory is typically gitignored and keeps execution artifacts out of the repo.

### Field reference

| Field | Set when | Updated when |
|---|---|---|
| `currentPhase` | Phase 1 | Every phase transition |
| `featureName` | Phase 1 | — |
| `specPath` | Phase 1 | — |
| `specJsonPath` | Phase 1 | — |
| `branch` | Phase 1 | — |
| `worktreePath` | Phase 1 | — |
| `prNumber` | Phase 1 (`null`) | After PR creation (set to PR number) |
| `qualityGates` | Phase 1 (from Phase 0 detection) | — |
| `completedPhases` | Phase 1 | Append at each phase transition |
| `capabilities` | Phase 1 (from Phase 0 detection) | — |
| `scopeCalibration` | Phase 1 (from Phase 0 Step 4) | — |
| `amendments` | Phase 1 (empty) | Any phase: append when user requests post-spec changes |
| `lastUpdated` | Phase 1 | Every phase transition |

## 2. Activate the ship loop

Create `tmp/ship/loop.md`:

```markdown
---
active: true
iteration: 1
max_iterations: 20
completion_promise: "SHIP COMPLETE"
started_at: "<current ISO 8601 timestamp>"
---
```

This activates the stop hook. If your context is compacted or you try to exit, the hook blocks exit and re-injects a phase-aware prompt with your current state, keeping you working through all remaining phases. The loop runs until you complete all phases and output `<complete>SHIP COMPLETE</complete>`, or until 20 iterations are reached.

To cancel the loop manually: `/cancel-ship`
