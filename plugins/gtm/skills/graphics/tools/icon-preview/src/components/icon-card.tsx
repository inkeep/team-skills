"use client";

import { useCallback } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

const PNG_SIZES = [16, 24, 32, 40, 48, 64, 80, 128, 256, 512];

interface IconCardProps {
  iconKey: string;
  displayName: string;
  darkBg?: boolean;
  selected?: boolean;
  onSelect?: (iconKey: string, selected: boolean) => void;
  onRename?: (iconKey: string) => void;
  onDelete?: (iconKey: string) => void;
  onMoveTo?: (iconKey: string, section: string) => void;
  sections?: string[];
}

export function IconCard({
  iconKey,
  displayName,
  darkBg,
  selected,
  onSelect,
  onRename,
  onDelete,
  onMoveTo,
  sections = [],
}: IconCardProps) {
  const handleClick = useCallback(() => {
    onSelect?.(iconKey, !selected);
  }, [iconKey, selected, onSelect]);

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData("text/plain", iconKey);
      e.dataTransfer.effectAllowed = "move";
    },
    [iconKey]
  );

  const copyName = useCallback(async () => {
    await navigator.clipboard.writeText(iconKey);
  }, [iconKey]);

  const copySvg = useCallback(async () => {
    const res = await fetch(`/api/icon/${iconKey}`);
    const svg = await res.text();
    await navigator.clipboard.writeText(svg);
  }, [iconKey]);

  const downloadSvg = useCallback(async () => {
    const res = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ icons: [iconKey], format: "svg" }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${displayName}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [iconKey, displayName]);

  const downloadPng = useCallback(
    async (size: number) => {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icons: [iconKey], format: "png", size }),
      });
      const contentType = res.headers.get("content-type");
      if (contentType?.includes("image/png")) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${displayName}-${size}px.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    [iconKey, displayName]
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger className="inline-block">
        <div
          onClick={handleClick}
          draggable
          onDragStart={handleDragStart}
          className={`
            group relative w-20 h-20 rounded-lg flex items-center justify-center
            cursor-pointer transition-all duration-150 p-1.5
            ${darkBg ? "bg-secondary hover:bg-secondary/80" : "bg-card hover:bg-accent"}
            ${selected
              ? "outline outline-1 outline-[#3784FF] -outline-offset-1"
              : "hover:outline hover:outline-1 hover:outline-border hover:-outline-offset-1"
            }
          `}
        >
          {selected && (
            <div className="absolute top-1 right-1 w-4 h-4 rounded-sm bg-primary border-2 border-primary flex items-center justify-center z-10">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}

          <img
            src={`/api/icon/${iconKey}`}
            alt={displayName}
            className="w-full h-full object-contain pointer-events-none"
            loading="lazy"
            draggable={false}
          />

          <div className="absolute bottom-0 left-0 right-0 text-center text-[8px] py-0.5 px-1 truncate rounded-b-lg transition-opacity duration-150 opacity-0 group-hover:opacity-100 bg-popover text-popover-foreground shadow-sm">
            {displayName}
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={copyName}>
          Copy name
          <span className="ml-auto text-xs text-muted-foreground">{iconKey}</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={copySvg}>
          Copy SVG to clipboard
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={downloadSvg}>
          Download SVG
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Download PNG</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-40">
            {PNG_SIZES.map((size) => (
              <ContextMenuItem key={size} onClick={() => downloadPng(size)}>
                {size}×{size}px
                {size === 40 && <span className="ml-auto text-xs text-muted-foreground">native</span>}
                {size === 80 && <span className="ml-auto text-xs text-muted-foreground">2×</span>}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        <ContextMenuSub>
          <ContextMenuSubTrigger>Move to…</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48 max-h-64 overflow-y-auto">
            {sections.map((s) => (
              <ContextMenuItem key={s} onClick={() => onMoveTo?.(iconKey, s)}>
                {s}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuItem onClick={() => onRename?.(iconKey)}>
          Rename…
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem
          onClick={() => onDelete?.(iconKey)}
          className="text-destructive focus:text-destructive"
        >
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
