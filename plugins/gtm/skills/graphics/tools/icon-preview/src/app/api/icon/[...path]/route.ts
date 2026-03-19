import { NextRequest, NextResponse } from "next/server";
import { readSvg } from "@/lib/icons";

/**
 * API route to serve individual SVG icons.
 * GET /api/icon/category/filename
 * Returns the SVG with proper content-type for inline rendering.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const iconKey = path.join("/");
  const svg = readSvg(iconKey);

  if (!svg) {
    return NextResponse.json({ error: "Icon not found" }, { status: 404 });
  }

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
