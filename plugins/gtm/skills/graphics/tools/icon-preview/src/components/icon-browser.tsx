"use client";

import { useState, useCallback, useEffect } from "react";
import { IconCard } from "./icon-card";
import { DownloadToolbar } from "./download-toolbar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface StyleGroup {
  name: string;
  description: string;
  count: number;
  icons: string[];
}

interface IconInfo {
  file: string;
  category: string;
  key: string;
}

interface IconBrowserProps {
  groups: StyleGroup[];
  allIcons: IconInfo[];
}

export function IconBrowser({ groups: initialGroups, allIcons: initialIcons }: IconBrowserProps) {
  const [selectedIcons, setSelectedIcons] = useState<Set<string>>(new Set());
  const [sections, setSections] = useState<string[]>([]);
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const iconMap = new Map(initialIcons.map((i) => [i.key, i]));
  const totalIcons = initialIcons.length;

  // Fetch available sections for move-to menus
  useEffect(() => {
    fetch("/api/sections")
      .then((r) => r.json())
      .then((d) => setSections(d.sections || []))
      .catch(() => {});
  }, [refreshKey]);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    // Force page reload to get fresh data from filesystem
    window.location.reload();
  }, []);

  const handleSelect = useCallback((iconKey: string, selected: boolean) => {
    setSelectedIcons((prev) => {
      const next = new Set(prev);
      if (selected) next.add(iconKey);
      else next.delete(iconKey);
      return next;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedIcons(new Set());
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIcons(new Set(initialIcons.map((i) => i.key)));
  }, [initialIcons]);

  const handleSelectGroup = useCallback((groupIcons: string[]) => {
    setSelectedIcons((prev) => {
      const allSelected = groupIcons.every((k) => prev.has(k));
      const next = new Set(prev);
      for (const k of groupIcons) {
        if (allSelected) next.delete(k);
        else next.add(k);
      }
      return next;
    });
  }, []);

  // Rename handler
  const handleRename = useCallback((iconKey: string) => {
    const name = iconKey.split("/").pop() || "";
    setRenameTarget(iconKey);
    setRenameValue(name);
  }, []);

  const submitRename = useCallback(async () => {
    if (!renameTarget || !renameValue.trim()) return;
    const res = await fetch("/api/rename", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ iconKey: renameTarget, newName: renameValue.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setRenameTarget(null);
      refresh();
    } else {
      alert(data.error || "Rename failed");
    }
  }, [renameTarget, renameValue, refresh]);

  // Delete handler
  const handleDelete = useCallback((iconKey: string) => {
    setDeleteTarget(iconKey);
  }, []);

  const submitDelete = useCallback(async () => {
    const icons = deleteTarget
      ? [deleteTarget]
      : Array.from(selectedIcons);
    if (!icons.length) return;

    const res = await fetch("/api/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ icons }),
    });
    if (res.ok) {
      setDeleteTarget(null);
      setSelectedIcons(new Set());
      refresh();
    }
  }, [deleteTarget, selectedIcons, refresh]);

  // Move handler
  const handleMoveTo = useCallback(async (iconKey: string, targetSection: string) => {
    const res = await fetch("/api/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ icons: [iconKey], targetSection }),
    });
    if (res.ok) refresh();
  }, [refresh]);

  // Batch move
  const handleBatchMove = useCallback(async (targetSection: string) => {
    const icons = Array.from(selectedIcons);
    if (!icons.length) return;
    const res = await fetch("/api/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ icons, targetSection }),
    });
    if (res.ok) {
      setSelectedIcons(new Set());
      refresh();
    }
  }, [selectedIcons, refresh]);

  // Drop handler for drag-and-drop between sections
  const handleDrop = useCallback(
    async (e: React.DragEvent, targetSection: string) => {
      e.preventDefault();
      e.currentTarget.classList.remove("ring-2", "ring-[#3784FF]");
      const iconKey = e.dataTransfer.getData("text/plain");
      if (!iconKey) return;

      // If icon is already in this section, do nothing
      if (iconKey.startsWith(targetSection + "/")) return;

      await handleMoveTo(iconKey, targetSection);
    },
    [handleMoveTo]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    e.currentTarget.classList.add("ring-2", "ring-[#3784FF]");
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.currentTarget.classList.remove("ring-2", "ring-[#3784FF]");
  }, []);

  return (
    <>
      <DownloadToolbar
        selectedIcons={selectedIcons}
        onClearSelection={handleClearSelection}
        onSelectAll={handleSelectAll}
        totalIcons={totalIcons}
        sections={sections}
        onBatchMove={handleBatchMove}
        onBatchDelete={() => setDeleteTarget("__batch__")}
      />

      <p className="text-xs text-gray-500 mb-8">
        Click to select. Right-click for actions. Drag icons between sections to move them.
      </p>

      {initialGroups.map((group) => {
        const isDarkBg =
          group.name.toLowerCase().includes("brand") ||
          group.name.toLowerCase().includes("white");

        const selectedInGroup = group.icons.filter((k) => selectedIcons.has(k)).length;
        const allInGroupSelected = group.icons.length > 0 && group.icons.every((k) => selectedIcons.has(k));

        // Derive the folder name from the first icon's category
        const folderName = group.icons[0]?.split("/")[0] || group.name;

        return (
          <section key={group.name} className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <Checkbox
                checked={allInGroupSelected}
                onCheckedChange={() => handleSelectGroup(group.icons)}
                className="data-[state=checked]:bg-[#3784FF] data-[state=checked]:border-[#3784FF]"
              />
              <h2 className="text-lg font-semibold text-gray-800">
                {group.name}
              </h2>
              <span className="text-sm text-[#3784FF] font-medium">
                {group.count}
              </span>
              {selectedInGroup > 0 && (
                <span className="text-xs text-green-600">
                  ({selectedInGroup} selected)
                </span>
              )}
            </div>

            {group.description && (
              <p className="text-xs mb-3 max-w-3xl text-gray-500">
                {group.description}
              </p>
            )}

            <div
              className={`rounded-2xl p-6 transition-all duration-200 ${
                isDarkBg ? "bg-gray-800" : "bg-gray-50"
              }`}
              onDrop={(e) => handleDrop(e, folderName)}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="flex flex-wrap gap-2">
                {group.icons.map((iconKey) => {
                  const icon = iconMap.get(iconKey);
                  if (!icon) return null;
                  return (
                    <IconCard
                      key={iconKey}
                      iconKey={iconKey}
                      displayName={icon.file}
                      darkBg={isDarkBg}
                      selected={selectedIcons.has(iconKey)}
                      onSelect={handleSelect}
                      onRename={handleRename}
                      onDelete={handleDelete}
                      onMoveTo={handleMoveTo}
                      sections={sections}
                    />
                  );
                })}
              </div>
            </div>
          </section>
        );
      })}

      {/* Rename Dialog */}
      <Dialog open={!!renameTarget} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Icon</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-2">
              Renaming: <code className="text-xs bg-muted px-1 py-0.5 rounded">{renameTarget}</code>
            </p>
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="New name (without extension)"
              onKeyDown={(e) => e.key === "Enter" && submitRename()}
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-2">
              Only lowercase letters, numbers, hyphens, and underscores.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>Cancel</Button>
            <Button onClick={submitRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget === "__batch__" ? `${selectedIcons.size} icons` : "icon"}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget === "__batch__"
                ? `This will permanently delete ${selectedIcons.size} icon files from disk. This cannot be undone.`
                : `This will permanently delete "${deleteTarget}" from disk. This cannot be undone.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submitDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
