---
name: inspect
description: "Codebase inspection — build a structured understanding of an area of the codebase before acting on it. Two complementary lenses: (1) Pattern inspection — discover conventions, shared abstractions, and the \"grain\" of an area. (2) System tracing — follow call chains, map transitive dependencies, identify blast radius and surface area touched. Use when you need to understand patterns before implementing, trace code flow before speccing, map blast radius before changing core primitives, or find similar patterns elsewhere. Subsumes find-similar. Triggers: inspect, what patterns exist here, how does this area do X, before implementing, check conventions, find existing patterns, codebase inspection, what abstractions exist, find similar, trace the flow, what connects to this, blast radius, what would break, dependency tree, what does this touch."
argument-hint: "[area to investigate] (optional: purpose — speccing|implementing|reviewing|testing|tracing)"
---

# Codebase Inspection

## What this is

Inspect builds structured understanding of a codebase area through two complementary lenses:

- **Pattern inspection** — discover the area's **grain**: conventions, shared abstractions, naming, error handling, imports. Answers: *"What patterns should I follow and what should I build on?"*
- **System tracing** — follow call chains, map transitive dependencies, identify blast radius and surface area touched. Answers: *"What does this connect to and what breaks if I change it?"*

Pattern inspection is horizontal (what do peers look like?). System tracing is vertical (what does this flow through?). An inspection can use either lens or both, depending on purpose.

**Inspect is factual, not prescriptive.** It reports what exists — conventions, flows, dependencies. It does not evaluate whether patterns are good, recommend changes, or propose architecture.

**Output defaults to conversation.** Saving to a file is fine when it makes sense (e.g., feeding an implementation prompt, saving as spec evidence), but default to ephemeral — codebases change, and saved output gets stale.

## What this is NOT

- **Not architecture evaluation** — describes what exists, does not judge it
- **Not external research** — purely this codebase, not docs/blogs/APIs
- **Not a spec** — traces current behavior factually but does not design new behavior or make decisions (that's `/spec`)
- **Not a gate** — invocable on-demand from any context, never a mandatory phase

---

## Workflow

### 1. Scope the target

Determine what area to investigate and why.

**Input:** A target (files, directories, domain, module) and optionally a purpose.

If the target is vague (e.g., "the API layer"), narrow it before searching:
- Which domain or module?
- Which concern? (routes, services, data access, validation)
- Which operation? (create, list, execute, delete)

If purpose is not stated, infer from context:

| Context clue | Inferred purpose | Primary lens |
|---|---|---|
| In a spec conversation | Speccing | Both (patterns + tracing) |
| About to write or modify code | Implementing | Patterns |
| Evaluating reviewer feedback or PR comments | Reviewing | Patterns |
| Writing or modifying tests | Testing | Patterns |
| Asking "do we do X elsewhere?" or "find similar" | Pattern search | Patterns |
| Asking "what connects to X", "blast radius", "what would break" | Tracing | Tracing |
| Changing a core primitive or shared abstraction | Tracing | Tracing |
| Mapping surface area impact of a change | Tracing | Tracing |

### 2. Search (progressive depth)

Start narrow. Expand only when needed. Stop when patterns emerge. For "find similar" queries, also see the **Similarity types** section below for classification and search strategy guidance.

#### Level 1 — Direct search

Find the specific files, functions, or types mentioned or implied by the target.

- Exact names, type names, function names
- Known synonyms or alternate spellings
- Import/export statements

**Stop if:** Found clear matches that reveal the area.

#### Level 2 — Sibling discovery

Find files that serve the same role as the target. **This is the highest-signal level — never skip it.**

- Files in the same directory
- Files with the same naming pattern (e.g., `*.handler.ts`, `*.route.ts`, `use*.ts`)
- Files in parallel directories (e.g., `domains/manage/routes/agents.ts` → `domains/manage/routes/tools.ts`)

Read **3-5 sibling files**. This is the minimum to distinguish patterns (consistent across files) from one-offs (a single file doing something different). One file is an anecdote; three files showing the same thing is a convention.

**When siblings disagree:** If 3 files do X and 2 files do Y, report the divergence — don't pick one and call it "the pattern." Use git history (`git log --oneline <path>`) to identify which convention is newer (active migration) vs. older (legacy). Report both, noting which appears to be the forward direction. The consumer decides which to follow.

**When there are no siblings:** New modules or domains may have no peers yet. Note the absence — this is a finding, not a failure. Elevate Level 4 to find analogues in other domains, and flag reduced confidence in the brief ("patterns borrowed from `<other domain>`, not confirmed locally").

**Stop if:** Patterns are emerging across siblings (or you've confirmed there are none).

#### Level 3 — Reference tracing

Follow the dependency graph to understand what the area builds on.

- What does this area import? (shared types, utilities, helpers, services)
- What imports this area? (consumers, dependents)
- Where are the shared abstractions defined?

This level reveals the **shared vocabulary** — the types, utilities, and helpers the codebase expects you to use. If every sibling file imports `validateRequest` from a shared module, new code in this area should too.

**Stop if:** You understand the shared abstractions and import conventions.

#### Level 4 — Conceptual expansion

Broaden the search to find analogous patterns in other domains.

- Same concept, different domain (e.g., how auth works in `run/` vs. `manage/`)
- Same pattern shape, different names
- Cross-domain analogues

**Use sparingly.** Level 4 reads many files and is often unnecessary. Only go here when Levels 1-3 didn't reveal clear patterns or when you need to confirm whether a pattern is area-local or repo-wide.

#### Supplementary signals

Use these to add context, not as primary search methods:

- **Git history** (`git log --oneline <path>`, `git log --diff-filter=M <path>`) — files that change together are often related; recent changes reveal active patterns vs. legacy code.
- **Git blame** (`git log --follow <file>`) — helps distinguish intentional conventions from accidental one-offs.

### 2b. Tracing methodology (when the goal is flow, dependencies, or blast radius)

When the purpose is tracing rather than pattern discovery, use a different search approach. Instead of finding peers and comparing conventions, follow the actual flow of data and control through the system.

**Think in graphs, not chains.** A codebase is a dependency graph — changes propagate through it non-linearly. A change to a leaf function affects one caller. A change to a shared type, utility, or schema fans out to every consumer, and each consumer's dependents in turn. When tracing, notice where the graph fans out — shared primitives, core types, foundational utilities. These are **amplifier nodes** where blast radius grows exponentially. A trace that stops at direct dependencies misses most of the real impact.

**Start from an entry point** — a specific function, route, handler, type, or module.

**Trace forward (downstream):**
- What does this call? Follow the import/call chain.
- Where does data go after this point? What transformations happen?
- What side effects does this trigger? (DB writes, events, external calls)

**Trace backward (upstream):**
- What calls this? Who are the consumers?
- Where does the input data originate?
- What triggers this code path? (API routes, event handlers, cron jobs)

**Map cross-boundary transitions:**
- Where does control cross package or domain lines?
- What are the contracts at each boundary? (types, APIs, events, DB schemas)
- Which transitions are tight coupling (shared types, direct imports) vs. loose coupling (API contracts, events)?

**Trace implicit coupling** (not visible in the import graph):
- Shared database tables read or written by multiple domains
- Event-driven or message-based communication
- Config values that change behavior in distant code
- Telemetry contracts that downstream dashboards or alerts depend on
- Shared validation schemas or error codes that consumers match on

These are often the highest-risk dependencies — invisible to static analysis and easy to break accidentally.

**Identify surface area touched:**
- Product surfaces: API endpoints, SDK methods, UI components, CLI commands, docs, error messages
- Internal surfaces: database tables, auth/permissions, telemetry spans, build/CI, configuration

Check whether the repo provides **surface area inventories** (skills, AGENTS.md sections, architecture docs, or dependency graphs that enumerate known surfaces and their dependencies). If they exist, use them as the authoritative map — they're far more reliable than ad hoc enumeration. Reference the inventory rather than guessing which surfaces exist.

**Stop conditions:**
- You've hit **stable boundaries** — interfaces with strong contracts that isolate change: versioned APIs, well-defined database schemas, explicit event contracts, published SDK interfaces. A change inside a stable boundary doesn't propagate through it.
- You've mapped the full chain from entry to exit for the paths that matter
- You've identified all direct and key transitive dependents

**Leaky boundaries** (keep tracing through these): shared types imported across domains, internal utilities without versioning, implicit contracts (convention-based, not enforced). Changes here propagate because there's no contract to absorb them.

**Depth control:** Not every trace needs to go to full depth. Calibrate to the question:
- "What does this touch?" → trace one level of direct dependencies
- "What's the blast radius?" → trace transitively until you hit stable boundaries
- "Map the full flow" → entry point to system boundary, both directions

### 3. Synthesize

After searching, synthesize findings across files into a coherent brief. Organize by **concern**, not by file.

The brief should answer: *"If I were about to write new code in this area, what conventions would I follow and what abstractions would I build on?"*

When patterns diverge (e.g., older files do X, newer files do Y), report both and indicate which appears to be the active convention based on recency. Do not flatten the divergence into a single "pattern" — the consumer needs to know the area is mid-migration.

Use the pattern brief format below. Include only sections relevant to the purpose — not every section applies every time.

---

## Depth calibration

Calibrate search depth and brief detail to the purpose:

| Purpose | Depth | Focus | Typical levels |
|---|---|---|---|
| **Speccing** | Broad | How the area works, what abstractions exist, system constraints | L1-L3, sometimes L4 |
| **Implementing** | Focused | Adjacent patterns, shared utils, naming, imports, data access | L1-L3 (L2 is critical) |
| **Reviewing** | Targeted | Specific convention claim — confirm or refute with evidence | L1-L2, just enough to answer the question |
| **Testing** | Focused | Test utilities, setup/teardown patterns, what's mocked vs. real | L1-L2 in `__tests__/` directories |
| **Pattern search** | Varies | "Do we do X elsewhere?" — find and classify matches | Start L1, expand as needed |
| **Tracing** | Deep | Follow call chains, map dependencies, identify blast radius and surface area | Entry point → follow forward/backward to system boundaries |

---

## Pattern brief format

Structure findings by concern. A brief is concise — typically 15-40 lines, not a full report.

**Area overview**
What this area does, how files are organized, entry points. 2-3 sentences.

**Patterns observed**
The conventions that hold across files in this area. Only include categories where you found clear patterns:

- **Naming** — File, function, type, and variable naming conventions. Prefixes, suffixes, casing.
- **Error handling** — How errors are created, thrown, caught, or returned. Error types used.
- **Validation** — How input is validated. Schemas, manual checks, where validation happens (route, service, data access).
- **Data access** — How data is read/written. ORM patterns, query builders, transaction handling.
- **File organization** — File structure conventions. One export per file, barrel exports, index files.
- **Import conventions** — What's imported from where. Relative vs. absolute. Shared modules.
- **Logging / observability** — How logging, tracing, or metrics are handled.

**Shared vocabulary**
Types, utilities, helpers, and abstractions this area uses — things to build on, not duplicate. Format each as: `name` — what it does — where it's defined.

**Test patterns** *(when relevant)*
How tests are structured. What's mocked vs. real. Test utilities, setup/teardown, naming conventions.

**Non-obvious**
Things you'd miss reading one file but see across several. Implicit contracts, order-of-operations dependencies, gotchas.

**Search coverage**
What you read, what you didn't, and where patterns might be incomplete. This lets the consumer judge confidence and decide whether to investigate further.

---

## Trace brief format

When tracing, structure findings by flow rather than by concern. A trace brief maps connections, not conventions.

**Entry point**
What you traced and why. The specific function, route, or module and the question being answered.

**Flow**
The path data/control takes, described as a chain: entry → step → step → exit. Note what happens at each step (validation, transformation, persistence, side effects). Keep it to the load-bearing steps — not every function call.

**Dependencies**
What this area depends on (upstream) and what depends on it (downstream). Call out transitive dependencies that aren't obvious from direct imports — these are where hidden blast radius lives.

**Cross-boundary transitions**
Where control crosses package, domain, or service lines. For each: what's the contract (types? API? events?), and is the coupling tight or loose? Tight coupling = changes here force changes there.

**Blast radius**
What would be affected by a change here:
- **Direct:** imports or calls this code
- **Transitive:** depends on something that depends on this
- **Surface area:** product surfaces (API, SDK, UI, docs) and internal surfaces (DB, auth, telemetry) in the dependency chain. If the repo has surface area inventories or dependency graphs, reference them here — they make this section authoritative rather than speculative.

**Non-obvious**
Hidden dependencies, implicit contracts, side effects not visible from the direct call chain. Things like: event-driven coupling, shared database tables read by other domains, config values that affect behavior elsewhere.

**Search coverage**
What paths you traced, what you didn't, where the map might be incomplete.

---

## Similarity types

When searching for specific patterns (especially for "find similar" queries), classify what kind of similarity you're looking for. This determines the search strategy:

| Type | What it means | Search strategy | Example |
|---|---|---|---|
| **Lexical** | Same names, keywords, identifiers | Grep for exact terms | "Where else do we call `formatDate`?" |
| **Structural** | Same code shape, different names | Read siblings, look for repeating structure | "Where else do we have retry logic?" |
| **Analogous** | Same role in a different domain | Check parallel directories | "What's the equivalent handler in `run/` vs. `manage/`?" |
| **Conceptual** | Same purpose, potentially different approach | Level 4 expansion | "How do we handle validation elsewhere?" |

For each match found, note:
- **Location** — file path and line range
- **Similarity type** — which of the four types
- **Confidence** — HIGH (exact/near-exact), MEDIUM (similar structure or purpose, some differences), LOW (conceptually related, different approach)
- **Why similar** — brief explanation

Confidence factors: same directory/domain → higher. Same naming conventions → higher. Same imports/dependencies → higher. Different structure or approach → lower.

---

## Quality bar

**Good pattern inspection:**
- Reads 3-5 sibling files before generalizing
- Distinguishes patterns (consistent across files) from one-offs
- Notes what's imported — reveals the codebase's shared vocabulary
- Calibrates depth to the purpose
- Reports search coverage so the consumer can judge completeness
- Organizes by concern, not by file
- Produces actionable findings — "here's what to follow"

**Good system trace:**
- Starts from a specific entry point, not "the whole system"
- Follows actual call chains (reads the code), not assumed architecture
- Identifies cross-boundary transitions and their coupling tightness
- Maps both direct and transitive dependencies
- Notes surface area touched (product + internal)
- Distinguishes what's in the blast radius from what's safely isolated
- Reports trace depth and what paths were not followed

**Bad inspection (either lens):**
- Reads one file and treats it as the pattern / the whole flow
- Reads every file in the repo (wastes context, no synthesis)
- Confuses one-off implementations with conventions
- Ignores imports and shared utilities
- Produces a file-by-file summary instead of synthesized findings
- Doesn't report what was searched / traced
- Reports at the wrong detail level for the purpose

---

## Anti-patterns

- **Single-file generalization.** One file is an anecdote. Read siblings before declaring a pattern.
- **Boiling the ocean.** Inspection is scoped to an area, not the whole repo. If you're reading more than 10-15 files, you've gone too broad — narrow the target.
- **Judging what you find.** "This pattern is bad and should be changed" is architecture evaluation, not inspection. Report what exists; let the consumer decide what to do about it.
- **File-by-file reporting.** "File A does X, File B does Y, File C does Z" is not a pattern brief. "This area consistently does X (seen in A, B, C), except D which does Y" is.
- **Skipping Level 2.** Sibling discovery is the highest-signal activity. Going straight to conceptual expansion without reading siblings produces shallow, unreliable findings.
- **Inventing patterns.** If you saw something once, it's not a pattern. If you're uncertain, say so in the search coverage section. Do not present a guess as a finding.
- **Flattening divergence.** If half the files do X and half do Y, reporting "the pattern is X" is wrong. Report the divergence and use recency to indicate direction. The consumer needs to know the area is mid-migration.
- **Saving by default.** Prefer inline output unless the user asks for a file or the context clearly benefits from one (e.g., anchoring an implementation prompt). Saved briefs go stale — treat them as snapshots, not source of truth.
- **Assuming architecture instead of tracing.** When tracing, follow actual imports and call chains — don't assume "this probably calls that" based on naming or expected architecture. Read the code.
- **Tracing everything.** A trace answers a specific question ("what does this connect to?", "what's the blast radius of changing X?"). If you're tracing the entire system, you've lost focus — narrow the entry point or the question.
