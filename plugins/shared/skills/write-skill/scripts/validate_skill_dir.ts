#!/usr/bin/env bun
/**
 * validate_skill_dir.ts
 *
 * A lightweight, dependency-free validator for Skill folders.
 *
 * Usage:
 *   bun scripts/validate_skill_dir.ts /path/to/skill-folder
 *
 * Checks:
 * - SKILL.md exists
 * - YAML frontmatter exists and includes name + description (warns if parsing is partial)
 * - name format (lowercase, digits, hyphens; <= 64 chars)
 * - description size (<= 1024 chars) + basic XML-tag guard
 * - warns if SKILL.md exceeds 500 lines
 * - warns on suspicious deep file references (best-effort)
 *
 * This is intentionally conservative and may produce warnings rather than hard failures.
 */

import { existsSync, readFileSync, statSync } from 'fs';
import { basename, resolve } from 'path';

type Frontmatter = Record<string, string>;

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n/;
const NAME_RE = /^[a-z0-9-]+$/;

function parseFrontmatter(text: string): { data: Frontmatter | null; warnings: string[] } {
  const m = text.match(FRONTMATTER_RE);
  if (!m) {
    return {
      data: null,
      warnings: ['Missing YAML frontmatter block (--- ... ---) at top of SKILL.md'],
    };
  }

  const raw = m[1];
  const data: Frontmatter = {};
  const warnings: string[] = [];

  for (const originalLine of raw.split(/\r?\n/)) {
    const line = originalLine.trim();
    if (!line || line.startsWith('#')) continue;

    const idx = line.indexOf(':');
    if (idx === -1) {
      warnings.push(`Unparsed frontmatter line (expected key: value): ${line}`);
      continue;
    }

    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();

    // Strip surrounding quotes if present
    if (
      (val.startsWith('"') && val.endsWith('"') && val.length >= 2) ||
      (val.startsWith("'") && val.endsWith("'") && val.length >= 2)
    ) {
      val = val.slice(1, -1);
    }

    data[key] = val;
  }

  return { data, warnings };
}

function validateName(name: string): string[] {
  const errs: string[] = [];

  if (name.length > 64) errs.push(`name too long (${name.length} > 64)`);
  if (!NAME_RE.test(name))
    errs.push('name must match ^[a-z0-9-]+$ (lowercase letters/digits/hyphens only)');
  if (name.startsWith('-') || name.endsWith('-') || name.includes('--')) {
    errs.push("name cannot start/end with '-' or contain consecutive '--'");
  }
  if (name.includes('<') || name.includes('>')) {
    errs.push('name should not contain angle brackets / XML-like tags');
  }

  return errs;
}

function validateDescription(desc: string): string[] {
  const errs: string[] = [];

  if (!desc.trim()) errs.push('description must be non-empty');
  if (desc.length > 1024) errs.push(`description too long (${desc.length} > 1024)`);
  // Soft guard for XML/HTML-like tags (best-effort)
  if (/<[^>]+>/.test(desc))
    errs.push('description appears to contain an XML/HTML-like tag; avoid tags in description');

  return errs;
}

function findSuspiciousReferences(skillText: string): string[] {
  const warnings: string[] = [];

  // Markdown links: [text](path)
  const linkRe = /\[[^\]]+]\(([^)]+)\)/g;
  const links: string[] = [];
  for (const match of skillText.matchAll(linkRe)) {
    if (match[1]) links.push(match[1]);
  }

  // Bare-ish paths (very rough): something/something.ext (or nested)
  const pathRe = /\b[\w.-]+\/[\w.\-/]+\b/g;
  const paths: string[] = [];
  for (const match of skillText.matchAll(pathRe)) {
    if (match[0]) paths.push(match[0]);
  }

  const candidates = new Set<string>([...links, ...paths]);

  for (const p of Array.from(candidates).sort()) {
    if (p.startsWith('http://') || p.startsWith('https://')) continue;

    const segs = p
      .split('/')
      .map((s) => s.trim())
      .filter((s) => s && s !== '.');

    if (segs.length >= 3) {
      warnings.push(`Reference path looks deeply nested (consider one-level-deep refs): ${p}`);
    }
    if (p.includes('\\')) {
      warnings.push(`Reference uses backslashes (prefer forward slashes): ${p}`);
    }
  }

  return warnings;
}

function main(): number {
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    console.log('Usage: bun scripts/validate_skill_dir.ts /path/to/skill-folder');
    return 2;
  }

  const skillDir = resolve(args[0]);
  if (!existsSync(skillDir) || !statSync(skillDir).isDirectory()) {
    console.log(`ERROR: Not a directory: ${skillDir}`);
    return 2;
  }

  const skillMdPath = resolve(skillDir, 'SKILL.md');
  if (!existsSync(skillMdPath)) {
    console.log('ERROR: SKILL.md not found');
    return 1;
  }

  const text = readFileSync(skillMdPath, 'utf8');

  const { data: fm, warnings: fmWarnings } = parseFrontmatter(text);
  const errors: string[] = [];
  const warnings: string[] = [...fmWarnings];

  if (!fm) {
    errors.push('Missing or invalid frontmatter (cannot continue validating name/description).');
  } else {
    const name = (fm['name'] ?? '').trim();
    const desc = (fm['description'] ?? '').trim();

    if (!name) {
      errors.push('Missing required frontmatter key: name');
    } else {
      for (const e of validateName(name)) errors.push(`name: ${e}`);

      const dirName = basename(skillDir);
      if (name !== dirName) {
        warnings.push(
          `name '${name}' does not match directory '${dirName}' (recommended to match).`
        );
      }
    }

    if (!desc) {
      errors.push('Missing required frontmatter key: description');
    } else {
      for (const e of validateDescription(desc)) errors.push(`description: ${e}`);
    }
  }

  const lineCount = text.split(/\r?\n/).length;
  if (lineCount > 500) {
    warnings.push(`SKILL.md is ${lineCount} lines (> 500). Consider splitting into references/.`);
  }

  warnings.push(...findSuspiciousReferences(text));

  if (errors.length > 0) {
    console.log('❌ Skill validation FAILED');
    for (const e of errors) console.log(`  - ${e}`);

    if (warnings.length > 0) {
      console.log('\nWarnings:');
      for (const w of warnings) console.log(`  - ${w}`);
    }
    return 1;
  }

  console.log('✅ Skill validation PASSED');
  if (warnings.length > 0) {
    console.log('\nWarnings:');
    for (const w of warnings) console.log(`  - ${w}`);
  }
  return 0;
}

process.exit(main());
