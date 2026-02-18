---
name: discover
description: |
  Build a comprehensive world model of how a topic connects across product and internal surface areas. Maps customer-facing surfaces, internal subsystems, their dependencies, and current state — grounded in repo-level knowledge first, then original codebase investigation. Use before spec work, implementation planning, or any task that needs deep understanding of what a feature touches.
  Triggers: "discover", "what does this touch", "map the surfaces", "world model", "surface areas", "what's affected", "ground me in", "understand the domain", "feature scope", "what would this change", "map the impact".
argument-hint: "[topic/feature/area]"
---

# Discover

## What this is

Discover builds a **domain-level world model** — a structured map of how a topic connects across every product and system surface. It answers: *"What does this topic touch, how do those things connect, and what exists today?"*

Two complementary maps, always produced together:

- **Product surface-area map** — customer-facing surfaces this topic touches (UIs, APIs, SDKs, CLIs, docs, config, billing, telemetry)
- **Internal surface-area map** — internal subsystems this topic touches (build, CI/CD, database, auth, runtime, observability, deployment)

Plus: connection graph between surfaces, current state of key surfaces (code-verified), constraints discovered, and explicit gaps.

Discover operates above individual code files: **surfaces, not functions; dependency chains, not import graphs; domain impact, not line-level patterns.** It drills into code when needed to verify surface behavior, but organizes findings by surface, not by file.

## What this is NOT

- **Not `/inspect`** — `/inspect` understands code patterns and traces within a specific area (file-level grain). Use `/inspect` for debugging, troubleshooting, or "what conventions should I follow here?" `/discover` maps how a topic connects across the entire system (surface-level grain).
- **Not `/spec`** — does not make design decisions, evaluate options, or produce requirements. Returns a factual world model that `/spec` consumes.
- **Not `/research`** — does not investigate external prior art, competitors, or third-party documentation. Scoped to this repo's product and system.
- **Not architecture evaluation** — reports what exists and what's connected. Does not judge whether it's good.

## Stance

- **Existing knowledge first, investigation second.** Never rebuild what the repo already provides. Repo-level skills and catalogs are the primary source; original investigation fills gaps.
- **Both lenses, always.** Product surfaces AND internal surfaces. Every topic touches both. Never produce one map without the other.
- **Surface-centric, not file-centric.** A surface may span many files; a file may touch many surfaces. Organize understanding around surfaces.
- **Transitive thinking.** Follow dependency chains to their end. If A depends on B depends on C, the topic touches all three. Map the full chain.
- **Always deep.** Don't skim. For every surface this topic touches, understand: what changes, what depends on it, what breaks if it fails. Drill into code for surfaces that are high-coupling, unclear, or critical.
- **Explicit about unknowns.** Gaps are as valuable as findings. Name what you don't know and what it would take to find out.

---

## Workflow

### Phase 1: Scope the topic

Understand what to investigate and why.

**Input:** A topic — a feature, area, concern, or question about the system.

1. **Name the topic precisely.** If it's vague ("the API layer"), narrow: which domain? Which operations? Which consumers?
2. **Identify the driving question.** What does the consumer of this world model need to understand?
   - "What surfaces does feature X touch?" (pre-spec)
   - "What would change if we modified Y?" (impact analysis)
   - "How does concern Z work across the system?" (understanding)
3. **Identify the consumer.** Who will use this world model? This determines emphasis:
   - `/spec` → needs surface maps, constraints, and gaps to inform design decisions
   - `/docs` → needs surface maps scoped to documentation-relevant impact
   - `/ship` → needs surface maps to calibrate implementation scope
   - Direct user → needs the full picture with emphasis on what matters most to them

---

### Phase 2: Discover repo-level knowledge

Before any original investigation, find what the repo already knows.

**Scan locations** (check all that exist):
- `.agents/skills/` — look for skills with frontmatter describing surface area catalogs, system maps, dependency graphs
- `.claude/agents/` — same
- `AGENTS.md`, `CLAUDE.md` — may reference architecture docs or conventions
- Architecture documentation — READMEs, architecture decision records, system diagrams

**What to look for:**
- **Product surface-area catalogs** — inventories of customer-facing surfaces with descriptions, dependencies, and source locations
- **Internal surface-area catalogs** — inventories of infrastructure and internal systems with dependency graphs
- **Impact matrices** — "what breaks when X changes" mappings
- **Domain glossaries** — canonical terminology and concepts

**What to record:**
- What was found and what it covers (reference by path — don't duplicate catalog content)
- What gaps remain — surfaces or system areas the existing knowledge doesn't cover
- How current the knowledge appears (check dates, verify a few claims against code)

**When nothing is found:** Fall back entirely to original investigation in Phases 3-4. Note the absence — the repo would benefit from surface area documentation.

---

### Phase 3: Map product surfaces

Identify which customer-facing surfaces this topic touches. Start from repo-level catalogs if available; enumerate from scratch for gaps.

**Canonical categories** (check all; not every repo has all of these):

| Category | Surfaces to check |
|---|---|
| **Management UI** | Admin dashboards, settings pages, configuration panels, user management |
| **User-facing experiences** | Chat, search, workflows, notifications, onboarding flows |
| **APIs & data contracts** | REST/GraphQL endpoints, webhook payloads, event schemas, response formats |
| **SDKs & libraries** | Client SDKs, integration libraries, framework plugins |
| **CLI tools** | Developer CLIs, admin CLIs, diagnostic tools |
| **MCP servers & protocols** | MCP endpoints, tool definitions, protocol handlers |
| **Documentation & content** | Docs site, API reference, guides, tutorials, changelogs |
| **Templates & scaffolding** | Starter templates, project generators, example configs |
| **Deployment interfaces** | Install scripts, Docker images, Helm charts, deployment configs |
| **Observability UI** | Dashboards, metrics views, log explorers, trace viewers |
| **Evaluation & testing UI** | Test runners, eval dashboards, benchmark views |
| **Config formats** | YAML/JSON/TOML config schemas, env vars, feature flags |
| **Error messages** | User-facing errors, validation messages, CLI output |
| **Billing & limits** | Usage tracking, plan limits, quota displays, billing pages |

For each surface the topic touches:

1. **Name the surface specifically** — not "the UI" but "the agent configuration panel in the management dashboard."
2. **Describe the change** — what behavior, content, or interface changes?
3. **Assess user impact** — is this visible to users? Does it change their workflow? Is it a breaking change?
4. **Map dependencies:**
   - What internal surfaces does this product surface depend on? (e.g., the config panel depends on the config API, which depends on the database schema)
   - What other product surfaces depend on this one? (e.g., the SDK depends on the API, so API changes cascade to the SDK)
5. **Identify consistency requirements** — naming, mental model, terminology that must be consistent across surfaces.

Don't just list surfaces — **trace why each is affected.** A surface is touched because something upstream in the dependency chain connects it to the topic. Name that connection.

---

### Phase 4: Map internal surfaces

Identify which internal subsystems this topic touches. Start from repo-level catalogs if available; enumerate from scratch for gaps.

**Canonical categories** (check all; not every repo has all of these):

| Category | Surfaces to check |
|---|---|
| **Build & package graph** | Package boundaries, dependency tree, build configuration, monorepo structure |
| **CI/CD pipelines** | Build pipelines, test pipelines, deploy pipelines, release automation |
| **Test infrastructure** | Test frameworks, fixtures, mocks, test utilities, integration test setup |
| **Database schemas & migrations** | Table definitions, migration files, seed data, indexes |
| **Database clients & data access** | ORMs, query builders, connection management, transaction handling |
| **Validation & shared types** | Shared type definitions, validation schemas, error types, constants |
| **Auth & authorization** | Auth middleware, permission models, token management, session handling |
| **Observability infrastructure** | Logging, tracing, metrics collection, alerting rules, dashboards |
| **Runtime engine** | Core processing, execution pipeline, scheduling, queue management |
| **Tool execution** | Sandboxes, tool runners, plugin systems, extension points |
| **Environment & configuration** | Env var management, config loading, feature flags, secrets management |
| **Docker & deployment** | Dockerfiles, compose files, Kubernetes manifests, infrastructure-as-code |
| **Package publishing** | Version management, changelog generation, publish scripts, registry config |
| **AI/ML infrastructure** | Model management, prompt templates, embedding pipelines, evaluation harnesses |

For each surface the topic touches:

1. **Name the surface specifically** — not "the database" but "the `conversations` table and its migration history."
2. **Describe the change** — what code, schema, config, or behavior changes?
3. **Assess coupling tightness:**
   - **Tight** — shared DB tables, shared types imported across domains, direct function calls. Changes here force changes there.
   - **Medium** — API contracts, event schemas, config keys. Changes here require coordination.
   - **Loose** — conventions, documentation references. Changes here are independent.
4. **Map blast radius:**
   - **Direct dependents** — what directly imports, reads from, or calls this surface?
   - **Transitive dependents** — what depends on the direct dependents? Follow the chain.
   - **Fan-out** — does this surface serve as an amplifier node? (shared primitive used widely)
5. **Identify failure modes** — if this surface breaks during or after the change, what happens? Silent failure (data corruption, wrong results) is worse than loud failure (errors, crashes).

---

### Phase 5: Trace connections

Map how product and internal surfaces connect for this topic. This is where the world model becomes a graph, not just two lists.

**Dependency chain tracing:**
- Start from the topic's primary entry point(s)
- Trace forward: what does this call, write, emit, configure?
- Trace backward: what calls this, reads from it, depends on its output?
- Follow chains transitively until you hit **stable boundaries** (versioned APIs, well-defined schemas, explicit contracts that absorb change)
- Keep tracing through **leaky boundaries** (shared types across domains, internal utilities without versioning, convention-based contracts)

**Cross-boundary transitions:**
- Where does data/control cross from one surface to another?
- What's the contract at each crossing? (types, API, events, DB schema)
- Is the coupling tight or loose?

**Implicit coupling** (highest-risk — invisible in the import graph):
- Shared database tables read/written by multiple domains
- Event-driven or message-based communication
- Config values that change behavior in distant code
- Telemetry contracts that downstream dashboards depend on
- Shared validation schemas or error codes consumers match on

**Amplifier nodes:**
- Shared primitives where a change fans out to many surfaces
- Core types, foundational utilities, base classes
- These are where blast radius grows exponentially — flag them explicitly

**Build the connection map:** Surface → depends on → Surface. Call out the key chains that define how this topic flows through the system.

---

### Phase 6: Inspect key surfaces

For surfaces that are high-coupling, unclear, or critical to the topic — drill into the actual code to verify current behavior.

**Progressive depth methodology:**

1. **Direct search** — Find the entry points for this surface. Exact names, type names, function names, import statements.

2. **Sibling discovery** — Read 3-5 files that serve the same role. This distinguishes patterns (consistent across files) from one-offs. When siblings disagree, report the divergence — don't pick one. Use git history to identify which convention is newer.

3. **Reference tracing** — Follow imports/exports to understand the shared vocabulary: types, utilities, helpers this surface builds on. Reveal what the codebase expects you to use.

4. **Cross-boundary tracing** — Where does data/control enter and leave this surface? What are the contracts at each boundary? Which transitions are tight coupling vs. loose coupling?

**What to capture for each inspected surface:**
- Current behavior (factual — what the code does today)
- Key code paths (file:line references)
- Constraints the code imposes (things that limit design options)
- Latent issues discovered (bugs, inconsistencies, tech debt)
- Patterns and conventions in this area

**Scope control:** Not every surface needs full code inspection. Prioritize:
- **Always inspect:** Surfaces with high coupling to the topic, surfaces where the connection is unclear, surfaces critical to the topic's success
- **Inspect if relevant:** Surfaces where catalog knowledge exists but hasn't been verified against current code
- **Note without inspecting:** Peripheral surfaces with low coupling and clear catalog documentation

---

### Phase 7: Synthesize world model

Produce the structured output (see Output contract below).

**Classification discipline:** For every finding, label its provenance:
- **Code-verified** — confirmed by reading actual code this session
- **Catalog-sourced** — from repo-level knowledge, not code-verified this session
- **Inferred** — reasonable inference from evidence, not directly confirmed

**Gap discipline:** For every surface the topic might touch but you couldn't verify:
- Name the surface and why you think it's relevant
- State what you checked and didn't find
- State what investigation would resolve the uncertainty

---

## Output contract: World Model Brief

### 1. Topic & scope
What was investigated and why. The driving question. Who consumes this world model.

### 2. Knowledge sources
- Repo-level skills/catalogs loaded (paths, what they cover)
- Code areas inspected (paths, depth reached)
- Gaps in existing knowledge (areas the repo doesn't document)

### 3. Product surface-area map

| Surface | What changes | User impact | Dependencies | Breaking? | Confidence |
|---|---|---|---|---|---|

### 4. Internal surface-area map

| Surface | What changes | Coupling | Blast radius | Failure mode | Confidence |
|---|---|---|---|---|---|

### 5. Connection graph
How surfaces connect for this topic. Key dependency chains: Surface → depends on → Surface.

Amplifier nodes. Implicit coupling. Cross-boundary contracts.

### 6. Current state (code-verified)
For each inspected surface: what exists today. Code paths, behavior, constraints, patterns.

Organized by surface, not by file.

### 7. Constraints
What limits design options for this topic. Discovered from code, catalogs, or dependency structure.

### 8. Gaps & unknowns
What we don't know. Surfaces not investigated or not verified. What it would take to resolve each gap.

---

## Quality bar

**Good discovery:**
- Both maps present — product AND internal surfaces, always
- Surfaces organized by domain impact, not by file path
- Connections traced transitively, not just one level
- Implicit coupling identified (not just import-visible dependencies)
- Key surfaces code-verified, not just catalog-referenced
- Gaps explicitly named with resolution paths
- Findings labeled by confidence (code-verified / catalog-sourced / inferred)
- Output is directly consumable by the requesting skill

**Bad discovery:**
- Only one map (product without internal, or vice versa)
- File-by-file summary instead of surface-organized findings
- Surface list without connections — just two flat lists, no graph
- Accepted catalog claims without any code verification
- No gaps section — implies complete knowledge when uncertainty exists
- Shallow — listed surfaces but didn't trace why they're affected or how they connect
- Guessed at surface behavior instead of reading code

---

## Anti-patterns

- **Starting from code instead of existing knowledge.** Always check for repo-level catalogs, skills, and architecture docs first. Original investigation fills gaps — it doesn't replace structured knowledge.
- **Producing one map without the other.** Product and internal surfaces are always both required. A topic that only touches product surfaces still has internal implications (and vice versa).
- **File-centric organization.** "File A is affected, File B is affected" is not a world model. "The auth surface is affected because the token validation chain connects to the API gateway surface" is.
- **Stopping at direct dependencies.** If A depends on B, and B depends on C, the topic touches C. Trace transitively until you hit stable boundaries.
- **Ignoring implicit coupling.** The highest-risk dependencies are invisible in the import graph — shared DB tables, events, config values, telemetry contracts. Actively look for these.
- **Treating catalog knowledge as ground truth.** Catalogs may be stale. Verify key claims against code, especially for high-coupling surfaces.
- **Omitting gaps.** If you didn't investigate a surface, say so. Silence is not confidence.
- **Boiling the ocean on inspection.** Not every surface needs full code inspection. Prioritize: high-coupling, unclear, critical. Peripheral surfaces with good catalog coverage can be noted without deep inspection.
