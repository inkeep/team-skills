#!/usr/bin/env bun

// qa.json schema validator — zero dependencies.
// Usage: bun validate-qa.ts <path-to-qa.json>
// Exit 0: valid | Exit 1: invalid or error
//
// Used in two places:
// 1. Orchestrator — validate qa.json before crafting the prompt
// 2. qa.sh — validate qa.json integrity after each iteration

import { readFileSync } from 'fs';

// --- Type definitions ---

const VALID_CATEGORIES = [
  'visual',
  'e2e-flow',
  'error-state',
  'edge-case',
  'integration',
  'api-contract',
  'usability',
  'failure-mode',
] as const;

const VALID_TOOLS = ['browser', 'browser-inspection', 'cli', 'macos'] as const;

const VALID_RESULTS = ['pass', 'fail-fixed', 'blocked', 'skipped', ''] as const;

interface TestScenario {
  id: string;
  title: string;
  description: string;
  category: string;
  tools: string[];
  successCriteria: string[];
  priority: number;
  passes: boolean;
  result: string;
  notes: string;
}

interface QaJson {
  project: string;
  branchName: string;
  description: string;
  testContext: string;
  availableTools: string[];
  scenarios: TestScenario[];
}

// --- Validation helpers ---

function requireString(obj: Record<string, unknown>, field: string, label: string): string | null {
  const val = obj[field];
  if (typeof val !== 'string') return `${label}: must be a string (got ${typeof val})`;
  if (val.length === 0) return `${label}: must not be empty`;
  return null;
}

function validateScenario(raw: unknown, index: number): string[] {
  const errors: string[] = [];
  const prefix = `scenarios[${index}]`;

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return [`${prefix}: must be an object`];
  }

  const scenario = raw as Record<string, unknown>;

  // id — must match QA-NNN
  if (typeof scenario.id !== 'string') {
    errors.push(`${prefix}.id: must be a string (got ${typeof scenario.id})`);
  } else if (!/^QA-\d{3}$/.test(scenario.id)) {
    errors.push(`${prefix}.id: must match QA-NNN format (e.g., QA-001), got "${scenario.id}"`);
  }

  // Required string fields
  for (const field of ['title', 'description'] as const) {
    const err = requireString(scenario, field, `${prefix}.${field}`);
    if (err) errors.push(err);
  }

  // category — must be a valid enum value
  if (typeof scenario.category !== 'string') {
    errors.push(`${prefix}.category: must be a string (got ${typeof scenario.category})`);
  } else if (!(VALID_CATEGORIES as readonly string[]).includes(scenario.category)) {
    errors.push(
      `${prefix}.category: must be one of [${VALID_CATEGORIES.join(', ')}], got "${scenario.category}"`,
    );
  }

  // tools — non-empty array of valid tool strings
  if (!Array.isArray(scenario.tools)) {
    errors.push(`${prefix}.tools: must be an array`);
  } else if (scenario.tools.length === 0) {
    errors.push(`${prefix}.tools: must have at least one tool`);
  } else {
    for (let i = 0; i < scenario.tools.length; i++) {
      const t = scenario.tools[i];
      if (typeof t !== 'string') {
        errors.push(`${prefix}.tools[${i}]: must be a string`);
      } else if (!(VALID_TOOLS as readonly string[]).includes(t)) {
        errors.push(
          `${prefix}.tools[${i}]: must be one of [${VALID_TOOLS.join(', ')}], got "${t}"`,
        );
      }
    }
  }

  // successCriteria — non-empty array of non-empty strings
  if (!Array.isArray(scenario.successCriteria)) {
    errors.push(`${prefix}.successCriteria: must be an array`);
  } else if (scenario.successCriteria.length === 0) {
    errors.push(`${prefix}.successCriteria: must have at least one criterion`);
  } else {
    for (let i = 0; i < scenario.successCriteria.length; i++) {
      const c = scenario.successCriteria[i];
      if (typeof c !== 'string') {
        errors.push(`${prefix}.successCriteria[${i}]: must be a string`);
      } else if (c.length === 0) {
        errors.push(`${prefix}.successCriteria[${i}]: must not be empty`);
      }
    }
  }

  // priority — positive integer
  if (typeof scenario.priority !== 'number') {
    errors.push(`${prefix}.priority: must be a number (got ${typeof scenario.priority})`);
  } else if (!Number.isInteger(scenario.priority) || scenario.priority < 1) {
    errors.push(`${prefix}.priority: must be a positive integer (got ${scenario.priority})`);
  }

  // passes — boolean
  if (typeof scenario.passes !== 'boolean') {
    errors.push(`${prefix}.passes: must be a boolean (got ${typeof scenario.passes})`);
  }

  // result — must be a valid enum value
  if (typeof scenario.result !== 'string') {
    errors.push(`${prefix}.result: must be a string (got ${typeof scenario.result})`);
  } else if (!(VALID_RESULTS as readonly string[]).includes(scenario.result)) {
    errors.push(
      `${prefix}.result: must be one of [${VALID_RESULTS.map((r) => r || '""').join(', ')}], got "${scenario.result}"`,
    );
  }

  // notes — must be a string (can be empty)
  if (typeof scenario.notes !== 'string') {
    errors.push(`${prefix}.notes: must be a string (got ${typeof scenario.notes})`);
  }

  return errors;
}

function validateSchema(json: unknown): { qa: QaJson | null; errors: string[] } {
  const errors: string[] = [];

  if (typeof json !== 'object' || json === null || Array.isArray(json)) {
    return { qa: null, errors: ['Root: must be a JSON object'] };
  }

  const obj = json as Record<string, unknown>;

  // Required top-level string fields
  for (const field of ['project', 'branchName', 'description', 'testContext'] as const) {
    const err = requireString(obj, field, field);
    if (err) errors.push(err);
  }

  // availableTools — non-empty array of valid tool strings
  if (!Array.isArray(obj.availableTools)) {
    errors.push('availableTools: must be an array');
  } else if (obj.availableTools.length === 0) {
    errors.push('availableTools: must have at least one tool');
  } else {
    for (let i = 0; i < obj.availableTools.length; i++) {
      const t = obj.availableTools[i];
      if (typeof t !== 'string') {
        errors.push(`availableTools[${i}]: must be a string`);
      } else if (!(VALID_TOOLS as readonly string[]).includes(t)) {
        errors.push(
          `availableTools[${i}]: must be one of [${VALID_TOOLS.join(', ')}], got "${t}"`,
        );
      }
    }
  }

  // scenarios — non-empty array
  if (!Array.isArray(obj.scenarios)) {
    errors.push('scenarios: must be an array');
  } else if (obj.scenarios.length === 0) {
    errors.push('scenarios: must have at least one test scenario');
  } else {
    for (let i = 0; i < obj.scenarios.length; i++) {
      errors.push(...validateScenario(obj.scenarios[i], i));
    }
  }

  if (errors.length > 0) return { qa: null, errors };
  return { qa: json as unknown as QaJson, errors: [] };
}

// --- Semantic checks (beyond structural schema) ---

function semanticChecks(qa: QaJson): string[] {
  const errors: string[] = [];

  const ids = qa.scenarios.map((s) => s.id);
  const priorities = qa.scenarios.map((s) => s.priority).sort((a, b) => a - b);

  // Duplicate IDs
  const idSet = new Set(ids);
  if (idSet.size !== ids.length) {
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    errors.push(`Duplicate scenario IDs: ${[...new Set(dupes)].join(', ')}`);
  }

  // Duplicate priorities
  const prioritySet = new Set(priorities);
  if (prioritySet.size !== priorities.length) {
    const dupes = priorities.filter((p, i) => priorities.indexOf(p) !== i);
    errors.push(`Duplicate priorities: ${[...new Set(dupes)].join(', ')}`);
  }

  // Sequential priorities (1, 2, 3, ..., N) — only check if no duplicates
  if (prioritySet.size === priorities.length) {
    for (let i = 0; i < priorities.length; i++) {
      if (priorities[i] !== i + 1) {
        errors.push(
          `Non-sequential priorities: expected ${i + 1} at position ${i}, found ${priorities[i]}. Priorities must be sequential starting from 1.`,
        );
        break;
      }
    }
  }

  // Every scenario's tools must be a subset of availableTools
  for (const scenario of qa.scenarios) {
    for (const tool of scenario.tools) {
      if (!qa.availableTools.includes(tool)) {
        errors.push(
          `${scenario.id}: requires tool "${tool}" which is not in availableTools [${qa.availableTools.join(', ')}]`,
        );
      }
    }
  }

  return errors;
}

// --- CLI ---

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: validate-qa.ts <path-to-qa.json>');
  process.exit(1);
}

try {
  const content = readFileSync(filePath, 'utf-8');

  let json: unknown;
  try {
    json = JSON.parse(content);
  } catch {
    console.error(`Error: ${filePath} is not valid JSON`);
    process.exit(1);
  }

  const { qa, errors: schemaErrors } = validateSchema(json);

  if (schemaErrors.length > 0) {
    console.error('Schema validation failed:');
    for (const err of schemaErrors) {
      console.error(`  ${err}`);
    }
    process.exit(1);
  }

  const semanticErrors = semanticChecks(qa!);
  if (semanticErrors.length > 0) {
    console.error('Semantic validation failed:');
    for (const err of semanticErrors) {
      console.error(`  ${err}`);
    }
    process.exit(1);
  }

  // Status summary on success
  const total = qa!.scenarios.length;
  const passing = qa!.scenarios.filter((s) => s.passes).length;
  console.log(`qa.json valid. Scenarios: ${passing}/${total} passing.`);
  process.exit(0);
} catch (e: unknown) {
  const message = e instanceof Error ? e.message : String(e);
  console.error(`Error reading ${filePath}: ${message}`);
  process.exit(1);
}
