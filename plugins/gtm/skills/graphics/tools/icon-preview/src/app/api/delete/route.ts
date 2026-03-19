import { NextRequest, NextResponse } from "next/server";
import { existsSync, unlinkSync } from "fs";
import { join } from "path";

const ICON_SET_DIR = join(
  process.env.TEAM_SKILLS_ROOT || join(process.cwd(), "../../../../../.."),
  "plugins/shared/skills/brand/assets/icon-set"
);

/**
 * POST /api/delete
 * Delete icon(s) from disk.
 * Body: { icons: string[] }
 */
export async function POST(request: NextRequest) {
  const { icons } = await request.json();

  if (!icons?.length) {
    return NextResponse.json({ error: "No icons specified" }, { status: 400 });
  }

  const results: { icon: string; deleted: boolean; error?: string }[] = [];

  for (const iconKey of icons) {
    const svgPath = join(ICON_SET_DIR, iconKey + ".svg");
    const pngPath = join(ICON_SET_DIR, iconKey + ".png");

    try {
      if (!existsSync(svgPath)) {
        results.push({ icon: iconKey, deleted: false, error: "Not found" });
        continue;
      }
      unlinkSync(svgPath);
      if (existsSync(pngPath)) unlinkSync(pngPath);
      results.push({ icon: iconKey, deleted: true });
    } catch (e: unknown) {
      results.push({ icon: iconKey, deleted: false, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return NextResponse.json({ results });
}
