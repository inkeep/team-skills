import { NextRequest, NextResponse } from "next/server";
import { existsSync, renameSync, mkdirSync } from "fs";
import { join, dirname } from "path";

const ICON_SET_DIR = join(
  process.env.TEAM_SKILLS_ROOT || join(process.cwd(), "../../../../../.."),
  "plugins/shared/skills/brand/assets/icon-set"
);

/**
 * POST /api/move
 * Move icon(s) to a different section (directory).
 * Body: { icons: string[], targetSection: string }
 */
export async function POST(request: NextRequest) {
  const { icons, targetSection } = await request.json();

  if (!icons?.length || !targetSection) {
    return NextResponse.json({ error: "Missing icons or targetSection" }, { status: 400 });
  }

  const targetDir = join(ICON_SET_DIR, targetSection);
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  const results: { icon: string; success: boolean; error?: string }[] = [];

  for (const iconKey of icons) {
    const srcPath = join(ICON_SET_DIR, iconKey + ".svg");
    const fileName = iconKey.split("/").pop();
    const destPath = join(targetDir, fileName + ".svg");

    // Also move PNG if it exists
    const srcPng = join(ICON_SET_DIR, iconKey + ".png");
    const destPng = join(targetDir, fileName + ".png");

    try {
      if (!existsSync(srcPath)) {
        results.push({ icon: iconKey, success: false, error: "Source not found" });
        continue;
      }
      if (existsSync(destPath)) {
        results.push({ icon: iconKey, success: false, error: "Destination already exists" });
        continue;
      }

      renameSync(srcPath, destPath);
      if (existsSync(srcPng)) {
        renameSync(srcPng, destPng);
      }
      results.push({ icon: iconKey, success: true });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({ icon: iconKey, success: false, error: msg });
    }
  }

  return NextResponse.json({ results });
}
