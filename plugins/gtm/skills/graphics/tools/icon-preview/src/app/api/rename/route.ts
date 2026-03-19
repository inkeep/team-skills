import { NextRequest, NextResponse } from "next/server";
import { existsSync, renameSync } from "fs";
import { join } from "path";

const ICON_SET_DIR = join(
  process.env.TEAM_SKILLS_ROOT || join(process.cwd(), "../../../../../.."),
  "plugins/shared/skills/brand/assets/icon-set"
);

/**
 * POST /api/rename
 * Rename an icon file (SVG + PNG if exists).
 * Body: { iconKey: "category/oldName", newName: "newName" }
 */
export async function POST(request: NextRequest) {
  const { iconKey, newName } = await request.json();

  if (!iconKey || !newName) {
    return NextResponse.json({ error: "Missing iconKey or newName" }, { status: 400 });
  }

  // Sanitize new name
  const sanitized = newName.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
  const category = iconKey.split("/")[0];
  const srcSvg = join(ICON_SET_DIR, iconKey + ".svg");
  const destSvg = join(ICON_SET_DIR, category, sanitized + ".svg");

  if (!existsSync(srcSvg)) {
    return NextResponse.json({ error: "Source icon not found" }, { status: 404 });
  }
  if (existsSync(destSvg)) {
    return NextResponse.json({ error: `Icon "${sanitized}" already exists in ${category}/` }, { status: 409 });
  }

  try {
    renameSync(srcSvg, destSvg);

    // Also rename PNG if it exists
    const srcPng = join(ICON_SET_DIR, iconKey + ".png");
    const destPng = join(ICON_SET_DIR, category, sanitized + ".png");
    if (existsSync(srcPng)) {
      renameSync(srcPng, destPng);
    }

    return NextResponse.json({ newKey: `${category}/${sanitized}` });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
