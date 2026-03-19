import { NextResponse } from "next/server";
import { readdirSync, statSync } from "fs";
import { join } from "path";

const ICON_SET_DIR = join(
  process.env.TEAM_SKILLS_ROOT || join(process.cwd(), "../../../../../.."),
  "plugins/shared/skills/brand/assets/icon-set"
);

/**
 * GET /api/sections
 * Returns list of available icon directories (for move-to menus).
 */
export async function GET() {
  try {
    const sections = readdirSync(ICON_SET_DIR)
      .filter((d) => statSync(join(ICON_SET_DIR, d)).isDirectory())
      .sort();
    return NextResponse.json({ sections });
  } catch {
    return NextResponse.json({ sections: [] });
  }
}
