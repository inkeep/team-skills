import { NextRequest, NextResponse } from "next/server";
import { readSvg } from "@/lib/icons";

/**
 * POST /api/export
 * Export icons as SVG or PNG (rendered server-side via resvg-js or canvas).
 *
 * Body: { icons: string[], format: "svg" | "png", size?: number }
 *
 * For SVG: returns a zip if multiple, raw SVG if single.
 * For PNG: renders SVG to PNG at the requested size, returns zip if multiple.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { icons, format, size = 200 } = body as {
    icons: string[];
    format: "svg" | "png";
    size: number;
  };

  if (!icons?.length) {
    return NextResponse.json({ error: "No icons specified" }, { status: 400 });
  }

  // Single icon — return directly
  if (icons.length === 1) {
    const svg = readSvg(icons[0]);
    if (!svg) {
      return NextResponse.json({ error: "Icon not found" }, { status: 404 });
    }

    if (format === "svg") {
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Content-Disposition": `attachment; filename="${icons[0].split("/").pop()}.svg"`,
        },
      });
    }

    // PNG — render server-side using sharp or canvas
    try {
      const sharp = (await import("sharp")).default;
      const png = await sharp(Buffer.from(svg))
        .resize(size, size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toBuffer();

      return new NextResponse(new Uint8Array(png), {
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="${icons[0].split("/").pop()}-${size}px.png"`,
        },
      });
    } catch {
      // Sharp not available — return SVG with a note
      return NextResponse.json(
        { error: "PNG export requires sharp. Install: bun add sharp" },
        { status: 500 }
      );
    }
  }

  // Multiple icons — build a zip
  // Use a simple concatenation approach: return JSON with base64-encoded files
  // The client-side will create the zip
  const results: { name: string; data: string; type: string }[] = [];

  for (const iconKey of icons) {
    const svg = readSvg(iconKey);
    if (!svg) continue;
    const name = iconKey.split("/").pop() || iconKey;

    if (format === "svg") {
      results.push({
        name: `${name}.svg`,
        data: Buffer.from(svg).toString("base64"),
        type: "image/svg+xml",
      });
    } else {
      try {
        const sharp = (await import("sharp")).default;
        const png = await sharp(Buffer.from(svg))
          .resize(size, size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
          .png()
          .toBuffer();
        results.push({
          name: `${name}-${size}px.png`,
          data: png.toString("base64"),
          type: "image/png",
        });
      } catch {
        // Skip icons that fail to render
      }
    }
  }

  return NextResponse.json({ files: results });
}
