#!/usr/bin/env bun
/**
 * generate-product-manifest.ts
 *
 * Deterministically extracts product tokens from the agents-manage-ui
 * codebase via GitHub API and outputs a markdown manifest for AI agents
 * creating product-representative graphics.
 *
 * Usage:
 *   bun generate-product-manifest.ts <output-path> [--repo owner/repo] [--ref branch] [--prefix subdir]
 *
 * Examples:
 *   bun generate-product-manifest.ts                           # defaults to ../tokens/product.md
 *   bun generate-product-manifest.ts /tmp/manifest.md --ref feat/new-ui
 *   bun generate-product-manifest.ts ./out.md --repo inkeep/agents --prefix agents-manage-ui
 *
 * Defaults:
 *   --repo    inkeep/agents
 *   --ref     main
 *   --prefix  agents-manage-ui
 *
 * Sources fetched (all relative to <prefix>):
 *   - src/app/globals.css          → CSS custom properties, animations, canvas tokens
 *   - components.json              → shadcn config (base color, icon library, style)
 *   - src/app/layout.tsx           → font definitions
 *   - src/components/ui/button.tsx  → button variant definitions (CVA)
 *   - src/components/ui/badge.tsx   → badge variant definitions (CVA)
 *   - src/constants/theme.ts        → brand color constant
 *
 * Phase 2 — Widget library sources (from inkeep/agents-ui, prefix: packages/agents-ui):
 *   - tailwind.config.ts                       → shadow definitions, theme extensions
 *   - src/styled/index.css                     → border colors, CSS custom properties
 *   - src/theme/colors.ts                      → color definitions, state colors
 *   - src/styled/components/chat-bubble.tsx     → chat widget dimensions, radius, shadow
 *   - src/styled/components/embedded-chat.tsx   → message spacing, avatar sizes
 *
 * Output: A compact markdown manifest (~220 lines) organized for AI agent consumption.
 *
 * Deterministic: same source files → identical output. No timestamps embedded.
 *
 * Error handling: the script validates structural expectations against each source
 * file. If the codebase changes in a way that breaks extraction (e.g., globals.css
 * drops its @theme block, or button.tsx stops using CVA), the script fails with a
 * specific error message naming the file and what it expected to find.
 *
 * Requires either:
 *   - `gh` CLI installed and authenticated (preferred — brew install gh && gh auth login), OR
 *   - GITHUB_TOKEN env var set
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

// ============================================================
// CLI args
// ============================================================

interface Config {
  repo: string;
  ref: string;
  prefix: string;
  outputPath: string;
}

function parseArgs(): Config {
  const args = process.argv.slice(2);

  function flagValue(flag: string, fallback: string): string {
    const idx = args.indexOf(flag);
    if (idx === -1) return fallback;
    const val = args[idx + 1];
    if (!val || val.startsWith('-')) {
      console.error(`Error: ${flag} requires a value`);
      process.exit(1);
    }
    return val;
  }

  const repo = flagValue('--repo', 'inkeep/agents');
  const ref = flagValue('--ref', 'main');
  const prefix = flagValue('--prefix', 'agents-manage-ui');

  // Output path: first positional arg, or default to ../tokens/product.md
  const flagIndices = new Set<number>();
  for (const flag of ['--repo', '--ref', '--prefix']) {
    const idx = args.indexOf(flag);
    if (idx !== -1) { flagIndices.add(idx); flagIndices.add(idx + 1); }
  }
  const positional = args.filter((_, i) => !flagIndices.has(i));

  // Default output: sibling tokens/ directory (skill-relative)
  const scriptDir = import.meta.dirname ?? import.meta.dir ?? '.';
  const defaultOutput = resolve(scriptDir, '..', 'tokens', 'product.md');
  const outputPath = positional[0] || defaultOutput;

  return { repo, ref, prefix, outputPath };
}

const config = parseArgs();

// ============================================================
// GitHub file fetching
// ============================================================

const SOURCE_FILES = {
  globalsCss: 'src/app/globals.css',
  componentsJson: 'components.json',
  layoutTsx: 'src/app/layout.tsx',
  buttonTsx: 'src/components/ui/button.tsx',
  badgeTsx: 'src/components/ui/badge.tsx',
  themeTs: 'src/constants/theme.ts',
} as const;

/**
 * Fetch a file from GitHub using `gh api` (preferred) or raw.githubusercontent.com fallback.
 */
async function fetchFromGitHub(filePath: string): Promise<string> {
  const { repo, ref } = config;
  const fullPath = config.prefix ? `${config.prefix}/${filePath}` : filePath;

  // Try `gh` CLI first — handles auth via system keyring
  try {
    const proc = Bun.spawn(
      ['gh', 'api', `repos/${repo}/contents/${fullPath}?ref=${ref}`, '-H', 'Accept: application/vnd.github.raw'],
      { stdout: 'pipe', stderr: 'pipe' },
    );
    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const code = await proc.exited;

    if (code === 0 && stdout.length > 0) return stdout;

    if (stderr.includes('Not Found') || stderr.includes('404')) {
      console.error(`Error: File not found on GitHub: ${repo}/${fullPath} (ref: ${ref})`);
      console.error(`  The agents-manage-ui codebase structure may have changed.`);
      console.error(`  Expected file at: ${filePath}`);
      process.exit(1);
    }

    throw new Error(`gh api exit ${code}: ${stderr.trim()}`);
  } catch (e: unknown) {
    // gh not installed or failed for non-404 reason — try GITHUB_TOKEN fallback
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`Error fetching ${fullPath} from ${repo}@${ref}:`);
      console.error(`  ${msg}`);
      console.error('');
      console.error('  Fix: install gh CLI (brew install gh && gh auth login)');
      console.error('  Or:  set GITHUB_TOKEN env var');
      process.exit(1);
    }

    const url = `https://raw.githubusercontent.com/${repo}/${ref}/${fullPath}`;
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (resp.status === 404) {
      console.error(`Error: File not found: ${url}`);
      console.error(`  The agents-manage-ui codebase structure may have changed.`);
      console.error(`  Expected file at: ${filePath}`);
      process.exit(1);
    }
    if (!resp.ok) {
      console.error(`Error: GitHub API returned ${resp.status} ${resp.statusText} for ${url}`);
      console.error(`  Check that the ref '${ref}' exists and your token has repo access.`);
      process.exit(1);
    }
    return resp.text();
  }
}

async function readSource(relPath: string): Promise<string> {
  console.log(`  Fetching ${config.prefix}/${relPath}...`);
  return fetchFromGitHub(relPath);
}

// ============================================================
// agents-ui (widget library) file fetching
// ============================================================

const AGENTS_UI_REPO = 'inkeep/agents-ui';
const AGENTS_UI_PREFIX = 'packages/agents-ui';

const AGENTS_UI_SOURCE_FILES = {
  tailwindConfig: 'tailwind.config.ts',
  indexCss: 'src/styled/index.css',
  colorsTs: 'src/theme/colors.ts',
  chatBubbleTsx: 'src/styled/components/chat-bubble.tsx',
  embeddedChatTsx: 'src/styled/components/embedded-chat.tsx',
} as const;

/**
 * Fetch a file from the agents-ui repo via GitHub API.
 * Uses the same fetching strategy as fetchFromGitHub but with agents-ui repo/prefix.
 */
async function fetchFromAgentsUi(filePath: string): Promise<string> {
  const fullPath = `${AGENTS_UI_PREFIX}/${filePath}`;
  const ref = config.ref; // use same ref (default: main)

  // Try `gh` CLI first
  try {
    const proc = Bun.spawn(
      ['gh', 'api', `repos/${AGENTS_UI_REPO}/contents/${fullPath}?ref=${ref}`, '-H', 'Accept: application/vnd.github.raw'],
      { stdout: 'pipe', stderr: 'pipe' },
    );
    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const code = await proc.exited;

    if (code === 0 && stdout.length > 0) return stdout;

    if (stderr.includes('Not Found') || stderr.includes('404')) {
      console.error(`Error: File not found on GitHub: ${AGENTS_UI_REPO}/${fullPath} (ref: ${ref})`);
      console.error(`  The agents-ui codebase structure may have changed.`);
      console.error(`  Expected file at: ${filePath}`);
      process.exit(1);
    }

    throw new Error(`gh api exit ${code}: ${stderr.trim()}`);
  } catch (e: unknown) {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`Error fetching ${fullPath} from ${AGENTS_UI_REPO}@${ref}:`);
      console.error(`  ${msg}`);
      console.error('');
      console.error('  Fix: install gh CLI (brew install gh && gh auth login)');
      console.error('  Or:  set GITHUB_TOKEN env var');
      process.exit(1);
    }

    const url = `https://raw.githubusercontent.com/${AGENTS_UI_REPO}/${ref}/${fullPath}`;
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (resp.status === 404) {
      console.error(`Error: File not found: ${url}`);
      console.error(`  The agents-ui codebase structure may have changed.`);
      console.error(`  Expected file at: ${filePath}`);
      process.exit(1);
    }
    if (!resp.ok) {
      console.error(`Error: GitHub API returned ${resp.status} ${resp.statusText} for ${url}`);
      console.error(`  Check that the ref '${ref}' exists and your token has repo access.`);
      process.exit(1);
    }
    return resp.text();
  }
}

async function readAgentsUiSource(relPath: string): Promise<string> {
  console.log(`  Fetching ${AGENTS_UI_PREFIX}/${relPath}...`);
  return fetchFromAgentsUi(relPath);
}

/**
 * Assert a structural expectation about a source file's content.
 * Fails with a clear message if the codebase has changed in a breaking way.
 */
function expectStructure(file: string, description: string, test: boolean): void {
  if (!test) {
    console.error(`Error: Structural expectation failed in ${file}`);
    console.error(`  Expected: ${description}`);
    console.error(`  The codebase may have changed. Update this script to match.`);
    process.exit(1);
  }
}

// ============================================================
// Token types
// ============================================================

interface TokenEntry {
  name: string;
  value: string;
  resolved?: string; // var() references resolved to actual values
  notes?: string;
}

// ============================================================
// CSS extraction
// ============================================================

/**
 * Extract CSS custom properties from ALL blocks matched by selector.
 * Handles multi-line values (oklch with line breaks), inline comments,
 * and multiple blocks with the same selector (e.g., two `.dark {}` blocks).
 */
function extractCssBlock(css: string, selector: string): TokenEntry[] {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Use global flag to find ALL matching blocks
  const blockRegex = new RegExp(`(?:^|\\n)${escapedSelector}\\s*\\{([\\s\\S]*?)\\n\\}`, 'gm');
  const tokens: TokenEntry[] = [];

  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(css)) !== null) {
    const block = match[1];

    // Match CSS custom properties, handling multi-line values and comments
    const propRegex = /--([\w-]+)\s*:\s*([^;]+);(?:\s*\/\*\s*([^*]*)\*\/)?/g;
    let propMatch: RegExpExecArray | null;
    while ((propMatch = propRegex.exec(block)) !== null) {
      tokens.push({
        name: `--${propMatch[1]}`,
        value: propMatch[2].trim().replace(/\s+/g, ' '),
        notes: propMatch[3]?.trim(),
      });
    }
  }

  return tokens;
}

/**
 * Extract @theme block tokens from Tailwind v4 CSS.
 */
function extractThemeBlock(css: string): TokenEntry[] {
  const tokens: TokenEntry[] = [];

  // @theme { ... } — the non-inline block
  const themeMatch = css.match(/@theme\s*\{([\s\S]*?)^\}/m);
  if (!themeMatch) return tokens;

  const propRegex = /--([\w-]+)\s*:\s*([^;]+);(?:\s*\/\*\s*([^*]*)\*\/)?/g;
  let m: RegExpExecArray | null;
  while ((m = propRegex.exec(themeMatch[1])) !== null) {
    tokens.push({
      name: `--${m[1]}`,
      value: m[2].trim().replace(/\s+/g, ' '),
      notes: m[3]?.trim(),
    });
  }

  return tokens;
}

/**
 * Build a lookup table for resolving var() references one level deep.
 */
function buildVarLookup(allTokens: TokenEntry[]): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const t of allTokens) {
    lookup.set(t.name, t.value);
  }
  return lookup;
}

/**
 * Resolve var(--x) references one level deep.
 * Returns the resolved value, or the original if not resolvable.
 */
function resolveVar(value: string, lookup: Map<string, string>): string {
  const varMatch = value.match(/^var\((--[\w-]+)\)$/);
  if (!varMatch) return value;
  const resolved = lookup.get(varMatch[1]);
  return resolved || value;
}

/**
 * Extract @keyframes names from CSS.
 */
function extractKeyframeNames(css: string): string[] {
  const names: string[] = [];
  const regex = /@keyframes\s+([\w-]+)/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(css)) !== null) {
    names.push(m[1]);
  }
  return names;
}

// ============================================================
// CVA variant extraction
// ============================================================

/**
 * Extract CVA variant definitions from a component file.
 * Returns a map of group name → { variant name → class string }.
 *
 * This parser handles the specific formatting used by shadcn/ui components:
 *   - Variants are string literals (single-quoted, possibly multi-line with concatenation)
 *   - Groups are indented at consistent levels
 */
function extractCvaVariants(tsx: string, fileName: string): Record<string, Record<string, string>> {
  const variants: Record<string, Record<string, string>> = {};

  // Find the variants: { ... } block inside cva()
  const cvaMatch = tsx.match(/cva\s*\(\s*(?:"[^"]*"|'[^']*'|\`[^`]*\`|[^,])*,\s*\{[\s\S]*?variants:\s*\{([\s\S]*?)\n\s{4}\}/);
  if (!cvaMatch) {
    console.warn(`Warning: No CVA variants block found in ${fileName}. Component may have been restructured.`);
    return variants;
  }

  const variantsBlock = cvaMatch[1];

  // Extract variant groups — match group name followed by its entries block
  // Pattern: word-chars (possibly quoted): { ... entries ... }
  const groupRegex = /['"]?([\w-]+)['"]?\s*:\s*\{([\s\S]*?)\n\s{6}\}/g;
  let groupMatch: RegExpExecArray | null;

  while ((groupMatch = groupRegex.exec(variantsBlock)) !== null) {
    const groupName = groupMatch[1];
    const entries: Record<string, string> = {};
    const groupBlock = groupMatch[2];

    // Match each entry: 'variant-name': 'classes' or 'variant-name': "classes"
    // Also handles multi-line string concatenation patterns
    const lines = groupBlock.split('\n');
    let currentKey: string | null = null;
    let currentValue = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//')) continue;

      // Start of a new entry: key: 'value' or key:\n  'value'
      const entryStart = trimmed.match(/^['"]?([\w-]+)['"]?\s*:\s*$/);
      if (entryStart) {
        // Key on its own line, value continues on next lines
        if (currentKey && currentValue) {
          entries[currentKey] = currentValue.replace(/\s+/g, ' ').trim();
        }
        currentKey = entryStart[1];
        currentValue = '';
        continue;
      }

      const entryFull = trimmed.match(/^['"]?([\w-]+)['"]?\s*:\s*['"`](.*)['"`],?\s*$/);
      if (entryFull) {
        if (currentKey && currentValue) {
          entries[currentKey] = currentValue.replace(/\s+/g, ' ').trim();
        }
        currentKey = entryFull[1];
        entries[currentKey] = entryFull[2].replace(/\s+/g, ' ').trim();
        currentKey = null;
        currentValue = '';
        continue;
      }

      // Continuation of a multi-line value
      if (currentKey) {
        const valueContent = trimmed.replace(/^['"`]/, '').replace(/['"`],?\s*$/, '');
        currentValue += ' ' + valueContent;
      }
    }

    if (currentKey && currentValue) {
      entries[currentKey] = currentValue.replace(/\s+/g, ' ').trim();
    }

    if (Object.keys(entries).length > 0) {
      variants[groupName] = entries;
    }
  }

  return variants;
}

// ============================================================
// Read and validate all sources
// ============================================================

console.log(`Fetching source files from ${config.repo}@${config.ref} (prefix: ${config.prefix})...`);

const [globalsCss, componentsJsonRaw, layoutTsx, buttonTsx, badgeTsx, themeTsSource] = await Promise.all([
  readSource(SOURCE_FILES.globalsCss),
  readSource(SOURCE_FILES.componentsJson),
  readSource(SOURCE_FILES.layoutTsx),
  readSource(SOURCE_FILES.buttonTsx),
  readSource(SOURCE_FILES.badgeTsx),
  readSource(SOURCE_FILES.themeTs),
]);

// Parse components.json
let componentsJson: Record<string, unknown>;
try {
  componentsJson = JSON.parse(componentsJsonRaw);
} catch {
  console.error(`Error: ${SOURCE_FILES.componentsJson} is not valid JSON.`);
  process.exit(1);
}

// Structural validations
expectStructure(
  SOURCE_FILES.globalsCss,
  'a @theme { ... } block with CSS custom properties',
  globalsCss.includes('@theme {') || globalsCss.includes('@theme{'),
);

expectStructure(
  SOURCE_FILES.globalsCss,
  'a :root { ... } block with semantic color tokens',
  globalsCss.includes(':root {') || globalsCss.includes(':root{'),
);

expectStructure(
  SOURCE_FILES.globalsCss,
  'a .dark { ... } block with dark mode overrides',
  globalsCss.includes('.dark {') || globalsCss.includes('.dark{'),
);

expectStructure(
  SOURCE_FILES.globalsCss,
  '--color-azure-blue defined in @theme (the primary brand color)',
  globalsCss.includes('--color-azure-blue'),
);

expectStructure(
  SOURCE_FILES.globalsCss,
  '--radius defined in :root',
  globalsCss.includes('--radius:') || globalsCss.includes('--radius :'),
);

expectStructure(
  SOURCE_FILES.componentsJson,
  'a "style" field (shadcn/ui style variant)',
  typeof componentsJson.style === 'string',
);

expectStructure(
  SOURCE_FILES.componentsJson,
  'a "tailwind" object with "baseColor"',
  typeof componentsJson.tailwind === 'object' && componentsJson.tailwind !== null,
);

expectStructure(
  SOURCE_FILES.layoutTsx,
  'Inter font import from next/font/google',
  layoutTsx.includes('Inter'),
);

expectStructure(
  SOURCE_FILES.buttonTsx,
  'a cva() call defining button variants',
  buttonTsx.includes('cva('),
);

expectStructure(
  SOURCE_FILES.badgeTsx,
  'a cva() call defining badge variants',
  badgeTsx.includes('cva('),
);

expectStructure(
  SOURCE_FILES.themeTs,
  'INKEEP_BRAND_COLOR constant',
  themeTsSource.includes('INKEEP_BRAND_COLOR'),
);

// ============================================================
// Extract tokens
// ============================================================

const themeTokens = extractThemeBlock(globalsCss);
const rootTokens = extractCssBlock(globalsCss, ':root');
const darkTokens = extractCssBlock(globalsCss, '.dark');
const keyframeNames = extractKeyframeNames(globalsCss);

// Build var() resolution lookup from all @theme tokens
const varLookup = buildVarLookup(themeTokens);

// Extract specific values
const brandColorMatch = themeTsSource.match(/INKEEP_BRAND_COLOR\s*=\s*'([^']+)'/);
expectStructure(SOURCE_FILES.themeTs, 'INKEEP_BRAND_COLOR = \'#...\'', !!brandColorMatch);
const brandColor = brandColorMatch![1];

const radiusMatch = rootTokens.find(t => t.name === '--radius');
expectStructure(SOURCE_FILES.globalsCss, '--radius in :root block', !!radiusMatch);
const baseRadius = radiusMatch!.value;

// Fonts
const hasInter = layoutTsx.includes('Inter');
const hasJetBrains = layoutTsx.includes('JetBrains_Mono');
expectStructure(SOURCE_FILES.layoutTsx, 'at least one font import', hasInter || hasJetBrains);

// Categorize @theme tokens
const brandColors = themeTokens.filter(
  t => t.name.startsWith('--color-') && !t.name.match(/--color-(azure|gray)-\d/) && !t.name.startsWith('--text-'),
);
const azureScale = themeTokens.filter(t => t.name.match(/--color-azure-\d/));
const grayScale = themeTokens.filter(t => t.name.match(/--color-gray-\d/));
const textSizes = themeTokens.filter(t => t.name.startsWith('--text-'));

// Separate semantic from canvas tokens in :root
const semanticRootTokens = rootTokens.filter(
  t => !t.name.startsWith('--xy-') && !t.name.startsWith('--edge-') && t.name !== '--radius',
);
const canvasTokens = rootTokens.filter(
  t => t.name.startsWith('--xy-') || t.name.startsWith('--edge-'),
);

// Component variants
const buttonVariants = extractCvaVariants(buttonTsx, SOURCE_FILES.buttonTsx);
const badgeVariants = extractCvaVariants(badgeTsx, SOURCE_FILES.badgeTsx);

if (!buttonVariants.variant) {
  console.warn(`Warning: No button "variant" group extracted from ${SOURCE_FILES.buttonTsx}. CVA structure may have changed.`);
}
if (!badgeVariants.variant) {
  console.warn(`Warning: No badge "variant" group extracted from ${SOURCE_FILES.badgeTsx}. CVA structure may have changed.`);
}

const tailwind = componentsJson.tailwind as Record<string, string>;

// ============================================================
// Markdown generation
// ============================================================

const lines: string[] = [];
function emit(line = '') { lines.push(line); }
function emitTable(headers: string[], rows: string[][]) {
  emit(`| ${headers.join(' | ')} |`);
  emit(`|${headers.map(() => '---').join('|')}|`);
  for (const row of rows) {
    emit(`| ${row.join(' | ')} |`);
  }
}

// --- Header ---

emit('# Inkeep Product Tokens');
emit();
emit('Product tokens extracted from `agents-manage-ui` source code. Use these when creating product mockups (fidelity levels 1–3). For marketing tokens (the surround, headlines, backgrounds), use `tokens/marketing.md`.');
emit();
emit('> **Two-layer rule:** Inside the product mockup → these tokens. Outside the mockup → marketing tokens from `tokens/marketing.md`. See `references/product-representation.md` for the decision framework.');
emit();
emit('---');
emit();

// --- Foundation ---

emit('## Foundation');
emit();
emitTable(
  ['Property', 'Value'],
  [
    ['Component library', `shadcn/ui — **${componentsJson.style}** style`],
    ['Base color palette', `**${tailwind.baseColor || 'stone'}** (Tailwind)`],
    ['Icon library', `**${componentsJson.iconLibrary || 'lucide'}**`],
    ['Sans font', `**Inter** (Google Fonts, \`--font-inter\`)`],
    ['Mono font', `**JetBrains Mono** (Google Fonts, \`--font-jetbrains-mono\`)`],
    ['Base radius', `\`${baseRadius}\` (10px)`],
    ['Brand color constant', `\`${brandColor}\``],
  ],
);
emit();

// --- Brand Colors ---

const MARKETING_ONLY_COLORS = new Set(['morning-mist', 'cream', 'white-cream', 'orange-light']);

emit('## Brand Colors');
emit();
emit('Defined in `@theme`. Colors marked *(marketing only)* are present in CSS but not used on product UI surfaces.');
emit();
emitTable(
  ['Token', 'Value', 'Product usage'],
  brandColors.map(t => {
    const name = t.name.replace('--color-', '');
    const isMarketingOnly = MARKETING_ONLY_COLORS.has(name);
    return [
      `\`${name}\``,
      `\`${t.value}\``,
      isMarketingOnly ? '*(marketing only)*' : t.notes || '—',
    ];
  }),
);
emit();

// --- Semantic Colors Light ---

emit('## Semantic Colors — Light Mode');
emit();
emitTable(
  ['Token', 'Value', 'Notes'],
  semanticRootTokens.map(t => {
    const resolved = resolveVar(t.value, varLookup);
    const display = resolved !== t.value ? `\`${resolved}\` (via \`${t.value}\`)` : `\`${t.value}\``;
    return [
      `\`${t.name.replace('--', '')}\``,
      display,
      t.notes || '',
    ];
  }),
);
emit();

// --- Semantic Colors Dark ---

emit('## Semantic Colors — Dark Mode');
emit();
emitTable(
  ['Token', 'Value', 'Notes'],
  darkTokens.map(t => {
    const resolved = resolveVar(t.value, varLookup);
    const display = resolved !== t.value ? `\`${resolved}\` (via \`${t.value}\`)` : `\`${t.value}\``;
    return [
      `\`${t.name.replace('--', '')}\``,
      display,
      t.notes || '',
    ];
  }),
);
emit();

// --- Radius ---

emit('## Radius');
emit();
emitTable(
  ['Token', 'Value', 'Usage'],
  [
    ['`radius` (base)', `\`${baseRadius}\` (10px)`, 'Base reference'],
    ['`radius-sm`', '6px', 'Small elements, checkboxes'],
    ['`radius-md`', '8px', 'Buttons, inputs, badges'],
    ['`radius-lg`', '10px (= base)', 'Cards'],
    ['`radius-xl`', '14px', 'Large containers'],
  ],
);
emit();

// --- Custom Text Sizes ---

if (textSizes.length > 0) {
  emit('## Custom Text Sizes');
  emit();
  emit('Beyond standard Tailwind scale:');
  emit();
  emitTable(
    ['Token', 'Value'],
    textSizes.map(t => [
      `\`${t.name.replace('--', '')}\``,
      `\`${t.value}\`${t.notes ? ` (${t.notes})` : ''}`,
    ]),
  );
  emit();
}

// --- Button Variants ---

emit('## Button Variants');
emit();
emit('**Signature pattern:** All primary button variants use `font-mono uppercase` — the product\'s most recognizable typographic trait.');
emit();

if (buttonVariants.variant) {
  emitTable(
    ['Variant', 'Has mono uppercase?', 'Key distinction'],
    Object.entries(buttonVariants.variant).map(([name, classes]) => {
      const hasMono = classes.includes('font-mono') && classes.includes('uppercase');
      let distinction = '—';
      if (name === 'default') distinction = 'Azure blue fill, white text';
      else if (name === 'destructive') distinction = 'Red fill';
      else if (name === 'outline') distinction = 'Border on white bg';
      else if (name === 'outline-primary') distinction = 'Azure border on white bg';
      else if (name === 'gray-outline') distinction = 'Gray border — **no mono/uppercase**';
      else if (name === 'secondary') distinction = 'Stone-100 fill';
      else if (name === 'ghost') distinction = 'Transparent, accent on hover';
      else if (name === 'link') distinction = 'Underline link style';
      else if (name === 'unstyled') distinction = 'Inherits parent — **no styling**';
      else if (name === 'destructive-outline') distinction = 'Red border on white bg';
      return [`\`${name}\``, hasMono ? 'Yes' : '**No**', distinction];
    }),
  );
} else {
  emit('*Warning: Button variants could not be extracted. CVA structure may have changed.*');
}
emit();

if (buttonVariants.size) {
  emit('**Sizes:** ' + Object.entries(buttonVariants.size).map(([name, classes]) => {
    const heightMatch = classes.match(/h-(\d+)/);
    const sizeMatch = classes.match(/size-(\d+)/);
    const label = heightMatch ? `h-${heightMatch[1]}` : sizeMatch ? `${sizeMatch[1]}×${sizeMatch[1]}` : classes.split(' ')[0];
    return `${name} (${label})`;
  }).join(', '));
  emit();
}

// --- Badge Variants ---

emit('## Badge Variants');
emit();

if (badgeVariants.variant) {
  emitTable(
    ['Variant', 'Key visual'],
    Object.entries(badgeVariants.variant).map(([name, classes]) => {
      const hasMono = classes.includes('font-mono');
      const hasUppercase = classes.includes('uppercase');
      let visual: string;
      if (name === 'code' || name === 'count') visual = 'Muted bg, mono font';
      else if (name === 'success') visual = 'Emerald, mono uppercase';
      else if (name === 'error') visual = 'Red, mono uppercase';
      else if (name === 'warning') visual = 'Amber, mono uppercase';
      else if (name === 'primary') visual = 'Azure border, mono';
      else if (['sky', 'violet', 'orange'].includes(name)) visual = `${name.charAt(0).toUpperCase() + name.slice(1)} tint, mono`;
      else visual = hasMono ? 'Mono' + (hasUppercase ? ' uppercase' : '') : 'Standard';
      return [`\`${name}\``, visual];
    }),
  );
} else {
  emit('*Warning: Badge variants could not be extracted. CVA structure may have changed.*');
}
emit();

// --- Canvas ---

emit('## Agent Builder Canvas');
emit();
emit('The most distinctive product surface. These tokens define its visual identity.');
emit();
emitTable(
  ['Element', 'Value'],
  [
    ['Background dot color', '`#a8a29e` (stone-400)'],
    ['Background dot gap', '`20px` (snap grid)'],
    ['Node base style', '`rounded-lg border bg-card`'],
    ['Node selected', '`ring-2 ring-primary` (azure blue ring)'],
    ['Node error', '`ring-2 ring-red-300 border-red-300`'],
    ['MCP tool node shape', '`rounded-4xl` (pill — visually distinct)'],
    ['Handle size', '`h-3 w-3` (12×12px), `border-2 border-border bg-card`'],
    ['Node tab', '`font-mono text-xs uppercase` — "Default" label'],
    ['Toolbar buttons', '`backdrop-blur-3xl` (glass-morphism)'],
    ...canvasTokens.map(t => {
      const resolved = resolveVar(t.value, varLookup);
      const display = resolved !== t.value ? `\`${resolved}\` (via \`${t.value}\`)` : `\`${t.value}\``;
      return [t.name.replace('--', ''), display];
    }),
    ['Node pulse glow', '`rgba(105, 163, 255, 0.7)` — 1.5s ease-in-out'],
    ['Delegation flash', '`2s steps(1, end)`'],
  ],
);
emit();

// --- Animations ---

const ANIMATION_USAGE: Record<string, string> = {
  'bounce-dot': 'Loading dots (chat, copilot)',
  'shimmer': 'Skeleton loading, copilot thinking',
  'shine': 'Decorative background sweep',
  'node-pulse': 'Executing agent nodes — scale + blue glow',
  'node-animation': 'Node state transition',
  'node-delegating-inverted': 'Node delegation ring flash (not from keyframe name)',
  'edge-animation': 'Edge delegation color flash',
  'edge-delegating': 'Edge delegation (not from keyframe name)',
};

const relevantKeyframes = keyframeNames.filter(
  name => !['collapsible-down', 'collapsible-up'].includes(name), // skip shadcn internal animations
);

if (relevantKeyframes.length > 0) {
  emit('## Animations');
  emit();
  emitTable(
    ['Keyframe', 'Usage'],
    relevantKeyframes.map(name => [
      `\`${name}\``,
      ANIMATION_USAGE[name] || '—',
    ]),
  );
  emit();
}

// --- Reference Scales ---

emit('## Reference Scales');
emit();
emit('Full oklch values in `agents-manage-ui/src/app/globals.css`. Key landmarks:');
emit();
emitTable(
  ['Scale', 'Steps', 'Key value'],
  [
    ['Azure', `${azureScale.length}`, `\`azure-500\` = primary (\`${azureScale.find(t => t.name === '--color-azure-500')?.value || '?'}\`)`],
    ['Gray', `${grayScale.length}`, 'Warm undertone (hue 34–106), Stone-based'],
    ['Chart', '5 × 2 modes', 'Light: azure, teal, dark-teal, gold, orange'],
  ],
);
emit();

// --- What NOT to use ---

emit('## What NOT to Use Inside Product Mockups');
emit();
emit('These marketing brand tokens do **not** appear in the product UI:');
emit();
emit('- **Neue Haas Grotesk Display Pro** — product uses Inter');
emit('- **Noto Serif** — product uses Inter');
emit('- **Warm cream backgrounds** (`#FBF9F4`, `#F7F4ED`) — product uses pure white');
emit('- **Large radii** (32–60px) — product uses 8–14px');
emit('- **Brand shadow glow** (`shadow/brand`) — product uses `shadow-xs` to `shadow-sm`');
emit('- **Pill-radius buttons** (9999px) — product uses `rounded-md` (8px)');

// ============================================================
// Phase 2: Widget Library Tokens (agents-ui)
// ============================================================

console.log('');
console.log(`Fetching widget library sources from ${AGENTS_UI_REPO}@${config.ref} (prefix: ${AGENTS_UI_PREFIX})...`);

const [
  agentsUiTailwindConfig,
  agentsUiIndexCss,
  agentsUiColorsTs,
  agentsUiChatBubbleTsx,
  agentsUiEmbeddedChatTsx,
] = await Promise.all([
  readAgentsUiSource(AGENTS_UI_SOURCE_FILES.tailwindConfig),
  readAgentsUiSource(AGENTS_UI_SOURCE_FILES.indexCss),
  readAgentsUiSource(AGENTS_UI_SOURCE_FILES.colorsTs),
  readAgentsUiSource(AGENTS_UI_SOURCE_FILES.chatBubbleTsx),
  readAgentsUiSource(AGENTS_UI_SOURCE_FILES.embeddedChatTsx),
]);

// --- Phase 2 structural validations ---

expectStructure(
  AGENTS_UI_SOURCE_FILES.chatBubbleTsx,
  'a width definition for the chat widget (w-[...] or width class)',
  /w-\[\d+px\]/.test(agentsUiChatBubbleTsx) || /width/.test(agentsUiChatBubbleTsx),
);

// --- Phase 2: Shadow extraction ---

// Standard Tailwind 4 shadow values — used as defaults unless overridden
const TAILWIND_DEFAULT_SHADOWS: Record<string, string> = {
  'shadow-xs': '0 1px 2px 0 rgba(0,0,0,0.05)',
  'shadow-sm': '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
  'shadow-md': '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  'shadow-lg': '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
  'shadow-xl': '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
  'shadow-2xl': '0 25px 50px -12px rgba(0,0,0,0.25)',
};

// Check if tailwind.config.ts defines custom shadows
const customShadows: Record<string, string> = {};
const shadowBlockMatch = agentsUiTailwindConfig.match(/boxShadow\s*:\s*\{([\s\S]*?)\}/);
if (shadowBlockMatch) {
  const shadowEntryRegex = /['"]?([\w-]+)['"]?\s*:\s*['"]([^'"]+)['"]/g;
  let shadowMatch: RegExpExecArray | null;
  while ((shadowMatch = shadowEntryRegex.exec(shadowBlockMatch[1])) !== null) {
    customShadows[`shadow-${shadowMatch[1]}`] = shadowMatch[2];
  }
}

// Use custom shadows if found, otherwise Tailwind defaults
const resolvedShadows = Object.keys(customShadows).length > 0
  ? customShadows
  : TAILWIND_DEFAULT_SHADOWS;

const shadowSource = Object.keys(customShadows).length > 0
  ? 'custom (from tailwind.config.ts)'
  : 'Tailwind 4 defaults (no overrides in tailwind.config.ts)';

// --- Phase 2: Chat widget dimensions ---

interface WidgetDimensions {
  desktopWidth: number | null;
  maxHeight: number | null;
  bottomOffset: number | null;
  rightOffset: number | null;
  desktopRadius: number | null;
  desktopRadiusClass: string | null;
  shadowClass: string | null;
}

function extractWidgetDimensions(tsx: string): WidgetDimensions {
  const dims: WidgetDimensions = {
    desktopWidth: null,
    maxHeight: null,
    bottomOffset: null,
    rightOffset: null,
    desktopRadius: null,
    desktopRadiusClass: null,
    shadowClass: null,
  };

  // Width: w-[440px] or similar
  const widthMatch = tsx.match(/w-\[(\d+)px\]/);
  if (widthMatch) dims.desktopWidth = parseInt(widthMatch[1], 10);

  // Max height: max-h-[650px] or max-h-[min(650px,...)] or similar
  const maxHMatch = tsx.match(/max-h-\[(?:min\()?(\d+)px/);
  if (maxHMatch) dims.maxHeight = parseInt(maxHMatch[1], 10);

  // Bottom offset: bottom-[20px] or bottom-4 etc
  const bottomBracket = tsx.match(/bottom-\[(\d+)px\]/);
  const bottomTw = tsx.match(/\bbottom-(\d+)\b/);
  if (bottomBracket) dims.bottomOffset = parseInt(bottomBracket[1], 10);
  else if (bottomTw) dims.bottomOffset = parseInt(bottomTw[1], 10) * 4; // Tailwind spacing

  // Right offset: right-[20px] or right-4 etc
  const rightBracket = tsx.match(/right-\[(\d+)px\]/);
  const rightTw = tsx.match(/\bright-(\d+)\b/);
  if (rightBracket) dims.rightOffset = parseInt(rightBracket[1], 10);
  else if (rightTw) dims.rightOffset = parseInt(rightTw[1], 10) * 4;

  // Border radius: rounded-xl = 12px, rounded-lg = 8px, rounded-2xl = 16px, etc
  const radiusMap: Record<string, number> = {
    'rounded-sm': 2, 'rounded': 4, 'rounded-md': 6,
    'rounded-lg': 8, 'rounded-xl': 12, 'rounded-2xl': 16,
    'rounded-3xl': 24, 'rounded-full': 9999,
  };
  const radiusMatch = tsx.match(/rounded-(sm|md|lg|xl|2xl|3xl|full)\b/);
  if (radiusMatch) {
    const cls = `rounded-${radiusMatch[1]}`;
    dims.desktopRadiusClass = cls;
    dims.desktopRadius = radiusMap[cls] ?? null;
  }
  // Also check bare "rounded" (4px)
  if (!dims.desktopRadiusClass && /\brounded\b/.test(tsx)) {
    dims.desktopRadiusClass = 'rounded';
    dims.desktopRadius = 4;
  }

  // Shadow class: shadow-2xl, shadow-lg, etc
  const shadowMatch = tsx.match(/\b(shadow-(?:xs|sm|md|lg|xl|2xl))\b/);
  if (shadowMatch) dims.shadowClass = shadowMatch[1];

  return dims;
}

const widgetDims = extractWidgetDimensions(agentsUiChatBubbleTsx);

// --- Phase 2: Avatar sizes ---

interface AvatarInfo {
  size: number | null;
  sizeClass: string | null;
}

function extractAvatarSize(tsx: string): AvatarInfo {
  // Look for avatar-related context with generous window
  const avatarSections = tsx.match(/[Aa]vatar[\s\S]{0,500}/g) || [];

  for (const section of avatarSections) {
    // h-6 w-6 = 24px — may have other classes between them
    const sizeMatch = section.match(/\bh-(\d+)\b[\s\S]{0,50}\bw-(\d+)\b/);
    if (sizeMatch && sizeMatch[1] === sizeMatch[2]) {
      const twSize = parseInt(sizeMatch[1], 10);
      return { size: twSize * 4, sizeClass: `h-${twSize} w-${twSize}` };
    }

    // Try arbitrary value: h-[24px] w-[24px]
    const arbMatch = section.match(/\bh-\[(\d+)px\][\s\S]{0,50}w-\[(\d+)px\]/);
    if (arbMatch && arbMatch[1] === arbMatch[2]) {
      return { size: parseInt(arbMatch[1], 10), sizeClass: `h-[${arbMatch[1]}px] w-[${arbMatch[1]}px]` };
    }
  }

  // Fallback: search the entire file for h-N w-N patterns (less precise)
  const globalMatch = tsx.match(/\bh-(\d+)\s+w-\1\b/);
  if (globalMatch) {
    const twSize = parseInt(globalMatch[1], 10);
    return { size: twSize * 4, sizeClass: `h-${twSize} w-${twSize}` };
  }

  return { size: null, sizeClass: null };
}

// Try embedded-chat first (more likely to have avatar), fall back to chat-bubble
let avatarInfo = extractAvatarSize(agentsUiEmbeddedChatTsx);
if (!avatarInfo.size) {
  avatarInfo = extractAvatarSize(agentsUiChatBubbleTsx);
}

// --- Phase 2: Message spacing ---

interface MessageSpacing {
  wrapperPadding: string | null;
  messageGap: string | null;
  headerPadding: string | null;
}

function extractMessageSpacing(tsx: string): MessageSpacing {
  const spacing: MessageSpacing = {
    wrapperPadding: null,
    messageGap: null,
    headerPadding: null,
  };

  // Padding: p-4, px-4 py-3, p-[16px], etc
  // Look for the main wrapper padding patterns
  const pMatch = tsx.match(/\bp-(\d+)\b/);
  if (pMatch) spacing.wrapperPadding = `${parseInt(pMatch[1], 10) * 4}px (p-${pMatch[1]})`;

  const pxMatch = tsx.match(/\bpx-(\d+)\b/);
  const pyMatch = tsx.match(/\bpy-(\d+)\b/);
  if (pxMatch && pyMatch && !spacing.wrapperPadding) {
    spacing.wrapperPadding = `${parseInt(pyMatch[1], 10) * 4}px ${parseInt(pxMatch[1], 10) * 4}px (py-${pyMatch[1]} px-${pxMatch[1]})`;
  }

  // Gap: gap-4, gap-2, space-y-4, etc
  const gapMatch = tsx.match(/\bgap-(\d+)\b/);
  if (gapMatch) spacing.messageGap = `${parseInt(gapMatch[1], 10) * 4}px (gap-${gapMatch[1]})`;

  const spaceYMatch = tsx.match(/\bspace-y-(\d+)\b/);
  if (spaceYMatch && !spacing.messageGap) {
    spacing.messageGap = `${parseInt(spaceYMatch[1], 10) * 4}px (space-y-${spaceYMatch[1]})`;
  }

  // Header padding
  const headerSection = tsx.match(/header[\s\S]{0,200}/i);
  if (headerSection) {
    const headerP = headerSection[0].match(/\bp-(\d+)\b/);
    const headerPx = headerSection[0].match(/\bpx-(\d+)\b/);
    const headerPy = headerSection[0].match(/\bpy-(\d+)\b/);
    if (headerP) spacing.headerPadding = `${parseInt(headerP[1], 10) * 4}px (p-${headerP[1]})`;
    else if (headerPx && headerPy) {
      spacing.headerPadding = `${parseInt(headerPy[1], 10) * 4}px ${parseInt(headerPx[1], 10) * 4}px (py-${headerPy[1]} px-${headerPx[1]})`;
    }
  }

  return spacing;
}

const messageSpacing = extractMessageSpacing(agentsUiEmbeddedChatTsx);

// --- Phase 2: State colors ---

interface StateColors {
  success: string | null;
  error: string | null;
  warning: string | null;
}

function extractStateColors(colorsTs: string): StateColors {
  const colors: StateColors = { success: null, error: null, warning: null };

  // Look for success/error/warning color definitions
  // Could be: success: '#10B981', success: 'green-500', --color-success, etc
  const successMatch = colorsTs.match(/success['":\s]+['"]?([#\w.-]+)/i);
  if (successMatch) colors.success = successMatch[1];

  const errorMatch = colorsTs.match(/error['":\s]+['"]?([#\w.-]+)/i);
  if (errorMatch) colors.error = errorMatch[1];

  const warningMatch = colorsTs.match(/warning['":\s]+['"]?([#\w.-]+)/i);
  if (warningMatch) colors.warning = warningMatch[1];

  // Also look for green/red/amber Tailwind class references
  if (!colors.success) {
    const greenMatch = colorsTs.match(/\b(green-\d{3})\b/);
    if (greenMatch) colors.success = greenMatch[1];
  }
  if (!colors.error) {
    const redMatch = colorsTs.match(/\b(red-\d{3})\b/);
    if (redMatch) colors.error = redMatch[1];
  }
  if (!colors.warning) {
    const amberMatch = colorsTs.match(/\b(amber-\d{3})\b/);
    if (amberMatch) colors.warning = amberMatch[1];
  }

  return colors;
}

// Try colors.ts first, then fall back to scanning component files for Tailwind color classes
let stateColors = extractStateColors(agentsUiColorsTs);
if (!stateColors.success && !stateColors.error) {
  // Scan component files for Tailwind state color classes (text-green-500, text-red-500, etc.)
  const allComponentCode = agentsUiEmbeddedChatTsx + '\n' + agentsUiChatBubbleTsx;

  const greenMatch = allComponentCode.match(/text-(green-\d{3})\b/);
  const redMatch = allComponentCode.match(/text-(red-\d{3})\b/);
  const amberMatch = allComponentCode.match(/text-(amber-\d{3})\b/);

  // Standard Tailwind color values
  const twColorToHex: Record<string, string> = {
    'green-300': '#86efac', 'green-400': '#4ade80', 'green-500': '#22c55e', 'green-600': '#16a34a',
    'red-300': '#fca5a5', 'red-400': '#f87171', 'red-500': '#ef4444', 'red-600': '#dc2626',
    'amber-300': '#fcd34d', 'amber-400': '#fbbf24', 'amber-500': '#f59e0b', 'amber-600': '#d97706',
  };

  if (greenMatch) stateColors.success = twColorToHex[greenMatch[1]] || greenMatch[1];
  if (redMatch) stateColors.error = twColorToHex[redMatch[1]] || redMatch[1];
  if (amberMatch) stateColors.warning = twColorToHex[amberMatch[1]] || amberMatch[1];
}

// --- Phase 2: Border colors ---

interface BorderColors {
  light: string | null;
  dark: string | null;
}

function extractBorderColors(css: string): BorderColors {
  const borders: BorderColors = { light: null, dark: null };

  // The CSS uses Tailwind @apply directives, not raw hex values.
  // Pattern: @apply border-gray-200 (light mode), @apply border-white-alpha-200 (dark mode)
  // We need to identify the Tailwind class used and resolve to a known value.

  // Light mode: look for @apply border-gray-200 or similar in base/non-dark context
  const lightApply = css.match(/@apply\s+border-(gray-\d+)\b/);
  if (lightApply) {
    // Resolve well-known Tailwind gray values
    const grayToHex: Record<string, string> = {
      'gray-100': '#f3f4f6', 'gray-200': '#e5e7eb', 'gray-300': '#d1d5db',
      'gray-400': '#9ca3af', 'gray-500': '#6b7280',
    };
    borders.light = grayToHex[lightApply[1]] || `Tailwind ${lightApply[1]}`;
  }

  // Check if there's a custom --color-gray-200 override in the CSS (some projects remap defaults)
  const grayOverride = css.match(/--color-gray-200\s*:\s*(#[0-9a-fA-F]{3,8})/);
  if (grayOverride) borders.light = grayOverride[1];

  // Also check for direct hex or oklch border-color definitions
  const lightBorderHex = css.match(/(?:border-color|--border-color|--border)\s*:\s*(#[0-9a-fA-F]{3,8})/);
  if (lightBorderHex && !borders.light) borders.light = lightBorderHex[1];

  // Dark mode: look for @apply border-white-alpha-NNN or similar inside .dark block
  const darkApply = css.match(/\.dark[\s\S]*?@apply\s+border-(white-alpha-\d+)\b/);
  if (darkApply) {
    // Resolve white-alpha-200 to rgba
    const whiteAlphaToRgba: Record<string, string> = {
      'white-alpha-100': 'rgba(255,255,255,0.06)',
      'white-alpha-200': 'rgba(255,255,255,0.15)',
      'white-alpha-300': 'rgba(255,255,255,0.25)',
      'white-alpha-400': 'rgba(255,255,255,0.40)',
      'white-alpha-500': 'rgba(255,255,255,0.50)',
    };
    borders.dark = whiteAlphaToRgba[darkApply[1]] || `Tailwind ${darkApply[1]}`;
  }

  return borders;
}

const borderColors = extractBorderColors(agentsUiIndexCss);

// --- Phase 2: Validation fixtures ---

const WIDGET_FIXTURES: Record<string, { expected: string | number; actual: string | number | null; label: string }> = {
  chatWidgetDesktopWidth: {
    expected: 440,
    actual: widgetDims.desktopWidth,
    label: 'Chat widget desktop width (px)',
  },
  chatWidgetMaxHeight: {
    expected: 650,
    actual: widgetDims.maxHeight,
    label: 'Chat widget max height (px)',
  },
  chatWidgetDesktopRadius: {
    expected: 12,
    actual: widgetDims.desktopRadius,
    label: 'Chat widget desktop radius (px)',
  },
  chatWidgetShadow: {
    expected: 'shadow-2xl',
    actual: widgetDims.shadowClass,
    label: 'Chat widget shadow class',
  },
  avatarSize: {
    expected: 24,
    actual: avatarInfo.size,
    label: 'Avatar size (px)',
  },
  borderColorLight: {
    expected: '#e5e7eb',
    actual: borderColors.light,
    label: 'Light mode border color (gray-200)',
  },
  shadowMd: {
    expected: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
    actual: resolvedShadows['shadow-md'] ?? null,
    label: 'Shadow md value',
  },
  shadow2xl: {
    expected: '0 25px 50px -12px rgba(0,0,0,0.25)',
    actual: resolvedShadows['shadow-2xl'] ?? null,
    label: 'Shadow 2xl value',
  },
};

let widgetWarnings = 0;
for (const [key, fixture] of Object.entries(WIDGET_FIXTURES)) {
  const actualStr = String(fixture.actual ?? '(not extracted)');
  const expectedStr = String(fixture.expected);
  if (actualStr !== expectedStr) {
    widgetWarnings++;
    console.warn(`  WARNING [${key}]: ${fixture.label}`);
    console.warn(`    expected: ${expectedStr}`);
    console.warn(`    actual:   ${actualStr}`);
  }
}
if (widgetWarnings === 0) {
  console.log('  All widget fixture validations passed.');
} else {
  console.warn(`  ${widgetWarnings} widget fixture(s) differ from expected values — product may have changed.`);
}

// --- Phase 2: Markdown output ---

emit();
emit('---');
emit();
emit('## Widget Library Tokens (agents-ui)');
emit();
emit('Widget-specific tokens from `inkeep/agents-ui`. These define the chat bubble, embedded chat, and widget overlay surfaces.');
emit();

// Shadows
emit('### Shadows');
emit();
emit(`Source: ${shadowSource}`);
emit();
emitTable(
  ['Token', 'CSS Value'],
  Object.entries(resolvedShadows).map(([name, value]) => [
    `\`${name}\``,
    `\`${value}\``,
  ]),
);
emit();

// Chat widget dimensions
emit('### Chat Widget Dimensions');
emit();
{
  const dimRows: string[][] = [];
  if (widgetDims.desktopWidth !== null) dimRows.push(['Desktop width', `\`${widgetDims.desktopWidth}px\``]);
  if (widgetDims.maxHeight !== null) dimRows.push(['Max height', `\`${widgetDims.maxHeight}px\``]);
  if (widgetDims.bottomOffset !== null) dimRows.push(['Bottom offset', `\`${widgetDims.bottomOffset}px\``]);
  if (widgetDims.rightOffset !== null) dimRows.push(['Right offset', `\`${widgetDims.rightOffset}px\``]);
  if (widgetDims.desktopRadius !== null) dimRows.push(['Desktop border radius', `\`${widgetDims.desktopRadius}px\` (\`${widgetDims.desktopRadiusClass}\`)`]);
  if (widgetDims.shadowClass) dimRows.push(['Shadow', `\`${widgetDims.shadowClass}\` → \`${resolvedShadows[widgetDims.shadowClass] || '(unknown)'}\``]);
  if (dimRows.length > 0) {
    emitTable(['Property', 'Value'], dimRows);
  } else {
    emit('*Warning: No chat widget dimensions could be extracted from chat-bubble.tsx.*');
  }
}
emit();

// Avatar sizes
emit('### Avatar Sizes');
emit();
if (avatarInfo.size !== null) {
  emitTable(
    ['Element', 'Size', 'Class'],
    [['Message avatar', `\`${avatarInfo.size}px\``, `\`${avatarInfo.sizeClass}\``]],
  );
} else {
  emit('*Warning: Avatar size could not be extracted from embedded-chat.tsx or chat-bubble.tsx.*');
}
emit();

// Message spacing
emit('### Message Spacing');
emit();
{
  const spacingRows: string[][] = [];
  if (messageSpacing.wrapperPadding) spacingRows.push(['Wrapper padding', `\`${messageSpacing.wrapperPadding}\``]);
  if (messageSpacing.messageGap) spacingRows.push(['Message gap', `\`${messageSpacing.messageGap}\``]);
  if (messageSpacing.headerPadding) spacingRows.push(['Header padding', `\`${messageSpacing.headerPadding}\``]);
  if (spacingRows.length > 0) {
    emitTable(['Property', 'Value'], spacingRows);
  } else {
    emit('*Warning: Message spacing values could not be extracted from embedded-chat.tsx.*');
  }
}
emit();

// State colors
emit('### State Colors');
emit();
{
  const stateRows: string[][] = [];
  if (stateColors.success) stateRows.push(['Success', `\`${stateColors.success}\``]);
  if (stateColors.error) stateRows.push(['Error', `\`${stateColors.error}\``]);
  if (stateColors.warning) stateRows.push(['Warning', `\`${stateColors.warning}\``]);
  if (stateRows.length > 0) {
    emitTable(['State', 'Color'], stateRows);
  } else {
    emit('*No explicit state colors found in colors.ts. Widget likely uses Tailwind defaults (green-500, red-500, amber-500).*');
  }
}
emit();

// Border colors
emit('### Border Colors');
emit();
{
  const borderRows: string[][] = [];
  if (borderColors.light) borderRows.push(['Light mode', `\`${borderColors.light}\``]);
  if (borderColors.dark) borderRows.push(['Dark mode', `\`${borderColors.dark}\``]);
  if (borderRows.length > 0) {
    emitTable(['Mode', 'Border color'], borderRows);
  } else {
    emit('*Warning: Border colors could not be extracted from index.css.*');
  }
}

// ============================================================
// Write output
// ============================================================

const output = lines.join('\n') + '\n';
const resolvedOutput = resolve(config.outputPath);
const outDir = dirname(resolvedOutput);
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

writeFileSync(resolvedOutput, output);

// Summary
const widgetDimCount = [
  widgetDims.desktopWidth, widgetDims.maxHeight, widgetDims.bottomOffset,
  widgetDims.rightOffset, widgetDims.desktopRadius, widgetDims.shadowClass,
].filter(v => v !== null).length;

const widgetSpacingCount = [
  messageSpacing.wrapperPadding, messageSpacing.messageGap, messageSpacing.headerPadding,
].filter(v => v !== null).length;

const widgetStateCount = [
  stateColors.success, stateColors.error, stateColors.warning,
].filter(v => v !== null).length;

const widgetBorderCount = [
  borderColors.light, borderColors.dark,
].filter(v => v !== null).length;

const tokenCount = {
  foundation: 7,
  brandColors: brandColors.length,
  semanticLight: semanticRootTokens.length,
  semanticDark: darkTokens.length,
  radius: 5,
  textSizes: textSizes.length,
  buttonVariants: Object.keys(buttonVariants.variant || {}).length,
  badgeVariants: Object.keys(badgeVariants.variant || {}).length,
  canvas: canvasTokens.length + 14, // CSS tokens + hardcoded entries
  animations: relevantKeyframes.length,
  widgetShadows: Object.keys(resolvedShadows).length,
  widgetDimensions: widgetDimCount,
  widgetAvatars: avatarInfo.size !== null ? 1 : 0,
  widgetSpacing: widgetSpacingCount,
  widgetStateColors: widgetStateCount,
  widgetBorderColors: widgetBorderCount,
};
const total = Object.values(tokenCount).reduce((a, b) => a + b, 0);

console.log(`Product manifest written to ${resolvedOutput}`);
console.log(`  ${lines.length} lines, ${total} token entries`);
console.log(`  Breakdown: ${Object.entries(tokenCount).map(([k, v]) => `${k}=${v}`).join(', ')}`);
