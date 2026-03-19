"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DownloadToolbarProps {
  selectedIcons: Set<string>;
  onClearSelection: () => void;
  onSelectAll: () => void;
  totalIcons: number;
  sections?: string[];
  onBatchMove?: (targetSection: string) => void;
  onBatchDelete?: () => void;
}

const PNG_PRESETS = [
  { label: "16px", value: 16 },
  { label: "24px", value: 24 },
  { label: "32px", value: 32 },
  { label: "40px (native)", value: 40 },
  { label: "48px", value: 48 },
  { label: "64px", value: 64 },
  { label: "80px (2×)", value: 80 },
  { label: "128px", value: 128 },
  { label: "256px", value: 256 },
  { label: "512px", value: 512 },
];

export function DownloadToolbar({
  selectedIcons,
  onClearSelection,
  onSelectAll,
  totalIcons,
  sections = [],
  onBatchMove,
  onBatchDelete,
}: DownloadToolbarProps) {
  const [pngSize, setPngSize] = useState(80);
  const [customSize, setCustomSize] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [moveTarget, setMoveTarget] = useState("");

  const count = selectedIcons.size;

  const download = async (format: "svg" | "png") => {
    if (count === 0) return;
    setDownloading(true);
    try {
      const size = customSize ? parseInt(customSize) : pngSize;
      const icons = Array.from(selectedIcons);
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icons, format, size }),
      });

      if (count === 1) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const ext = format === "svg" ? ".svg" : `-${size}px.png`;
        a.download = `${icons[0].split("/").pop()}${ext}`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const data = await res.json();
        if (data.files) {
          for (const file of data.files) {
            const binary = atob(file.data);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const blob = new Blob([bytes], { type: file.type });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = file.name;
            a.click();
            URL.revokeObjectURL(url);
            await new Promise((r) => setTimeout(r, 100));
          }
        }
      }
    } finally {
      setDownloading(false);
    }
  };

  if (count === 0) return null;

  return (
    <div className="sticky top-0 z-50">
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-6 flex items-center gap-3 flex-wrap shadow-lg">
        <span className="text-sm text-[#3784FF] font-medium">
          {count} selected
        </span>

        <Button variant="ghost" size="sm" onClick={onSelectAll} className="text-xs">
          Select All ({totalIcons})
        </Button>
        <Button variant="ghost" size="sm" onClick={onClearSelection} className="text-xs">
          Clear
        </Button>

        <div className="h-6 w-px bg-gray-200" />

        {/* Download SVG */}
        <Button size="sm" variant="outline" onClick={() => download("svg")} disabled={downloading} className="text-xs">
          ↓ SVG
        </Button>

        {/* Download PNG */}
        <Popover>
          <PopoverTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-medium border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground h-8 px-3 disabled:opacity-50" disabled={downloading}>
            ↓ PNG
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" side="bottom">
            <div className="space-y-3">
              <p className="text-xs font-medium">PNG Resolution</p>
              <Select value={String(pngSize)} onValueChange={(v: string | null) => { if (v) { setPngSize(parseInt(v)); setCustomSize(""); } }}>
                <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PNG_PRESETS.map((p) => (
                    <SelectItem key={p.value} value={String(p.value)} className="text-xs">{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Custom:</span>
                <input
                  type="number" min="8" max="4096" placeholder="e.g. 1024"
                  value={customSize} onChange={(e) => setCustomSize(e.target.value)}
                  className="flex-1 h-8 rounded-md border border-input px-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#3784FF]"
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
              <Button size="sm" className="w-full text-xs" onClick={() => download("png")} disabled={downloading}>
                {downloading ? "Exporting..." : `Download ${count} PNG${count > 1 ? "s" : ""} @ ${customSize || pngSize}px`}
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <div className="h-6 w-px bg-gray-200" />

        {/* Move to section */}
        {sections.length > 0 && (
          <Popover>
            <PopoverTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-medium border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground h-8 px-3">
              Move to…
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2 max-h-64 overflow-y-auto" side="bottom">
              {sections.map((s) => (
                <button
                  key={s}
                  onClick={() => onBatchMove?.(s)}
                  className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-accent transition-colors"
                >
                  {s}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        )}

        {/* Delete */}
        <Button size="sm" variant="outline" onClick={onBatchDelete} className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50">
          Delete
        </Button>
      </div>
    </div>
  );
}
