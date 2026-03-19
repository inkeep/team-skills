import { readdirSync, statSync, readFileSync, existsSync } from "fs";
import { join, basename } from "path";

// Use absolute paths — these are stable within the team-skills monorepo
const TEAM_SKILLS_ROOT = process.env.TEAM_SKILLS_ROOT
  || join(process.cwd(), "../../../../../..");

const ICON_SET_DIR = join(
  TEAM_SKILLS_ROOT,
  "plugins/shared/skills/brand/assets/icon-set"
);

const CLASSIFICATION_PATH = join(
  TEAM_SKILLS_ROOT,
  "specs/2026-03-18-graphics-icon-content-type/evidence/icon-style-groups.json"
);

export interface IconInfo {
  file: string;
  category: string; // original directory
  key: string; // "category/file" unique key
  svgPath: string;
}

export interface StyleGroup {
  name: string;
  description: string;
  count: number;
  icons: string[]; // "category/file" keys
}

/**
 * Scan the icon-set directory and return all SVG icons.
 */
export function scanIconSet(): IconInfo[] {
  const icons: IconInfo[] = [];

  if (!existsSync(ICON_SET_DIR)) {
    console.error(`Icon set directory not found: ${ICON_SET_DIR}`);
    return icons;
  }

  const categories = readdirSync(ICON_SET_DIR).filter((d) =>
    statSync(join(ICON_SET_DIR, d)).isDirectory()
  );

  for (const cat of categories.sort()) {
    const svgs = readdirSync(join(ICON_SET_DIR, cat))
      .filter((f) => f.endsWith(".svg"))
      .sort();
    for (const f of svgs) {
      const name = basename(f, ".svg");
      icons.push({
        file: name,
        category: cat,
        key: `${cat}/${name}`,
        svgPath: join(ICON_SET_DIR, cat, f),
      });
    }
  }

  return icons;
}

/**
 * Load the style group classification JSON (if it exists).
 * Falls back to grouping by original directory.
 */
export function loadStyleGroups(): StyleGroup[] | null {
  if (!existsSync(CLASSIFICATION_PATH)) return null;

  try {
    const data = JSON.parse(readFileSync(CLASSIFICATION_PATH, "utf-8"));
    return data as StyleGroup[];
  } catch {
    return null;
  }
}

/**
 * Group icons by original directory (fallback when no classification exists).
 */
export function groupByDirectory(icons: IconInfo[]): StyleGroup[] {
  const groups = new Map<string, string[]>();
  for (const icon of icons) {
    const list = groups.get(icon.category) || [];
    list.push(icon.key);
    groups.set(icon.category, list);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, iconKeys]) => ({
      name,
      description: `${iconKeys.length} icons from ${name}/`,
      count: iconKeys.length,
      icons: iconKeys,
    }));
}

/**
 * Read an SVG file and return its content as a string.
 */
export function readSvg(iconKey: string): string | null {
  const svgPath = join(ICON_SET_DIR, iconKey + ".svg");
  if (!existsSync(svgPath)) return null;
  return readFileSync(svgPath, "utf-8");
}
