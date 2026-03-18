#!/usr/bin/env bun
/**
 * generate-product-manifest.ts
 *
 * Deterministically extracts product design tokens from the agents-manage-ui
 * codebase via GitHub API and outputs a markdown manifest for AI agents
 * creating product-representative graphics.
 *
 * Usage:
 *   bun generate-product-manifest.ts <output-path> [--repo owner/repo] [--ref branch] [--prefix subdir]
 *
 * Examples:
 *   bun generate-product-manifest.ts .claude/design-system/product-manifest.md
 *   bun generate-product-manifest.ts /tmp/manifest.md --ref feat/new-ui
 *   bun generate-product-manifest.ts ./manifest.md --repo inkeep/agents --prefix agents-manage-ui
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

  // Output path: first positional arg, or default to ../references/product-tokens.md
  const flagIndices = new Set<number>();
  for (const flag of ['--repo', '--ref', '--prefix']) {
    const idx = args.indexOf(flag);
    if (idx !== -1) { flagIndices.add(idx); flagIndices.add(idx + 1); }
  }
  const positional = args.filter((_, i) => !flagIndices.has(i));

  // Default output: sibling references/ directory (skill-relative)
  const scriptDir = import.meta.dirname ?? import.meta.dir ?? '.';
  const defaultOutput = resolve(scriptDir, '..', 'references', 'product-tokens.md');
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

emit('# Inkeep Product Design Tokens');
emit();
emit('Product UI tokens extracted from `agents-manage-ui` source code. Use these when creating product mockups (fidelity levels 1–3). For marketing tokens (the surround, headlines, backgrounds), use `manifest.md`.');
emit();
emit('> **Two-layer rule:** Inside the product mockup → these tokens. Outside the mockup → marketing tokens from `manifest.md`. See `references/product-representation.md` for the full framework.');
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
};
const total = Object.values(tokenCount).reduce((a, b) => a + b, 0);

console.log(`Product manifest written to ${resolvedOutput}`);
console.log(`  ${lines.length} lines, ${total} token entries`);
console.log(`  Breakdown: ${Object.entries(tokenCount).map(([k, v]) => `${k}=${v}`).join(', ')}`);
