# Icon Preview App — Feature Plan

## Current State (v1)
- [x] Derived from folder structure + classification JSON
- [x] SVG rendering via API route
- [x] Multi-select with Shift/⌘+click
- [x] Download toolbar (SVG + PNG with resolution picker)
- [x] shadcn UI components
- [x] Selection mode toggle

## v2 — Interactive Management (requested)

### Click = Select (change default behavior)
- Click on icon = toggle selection (no more copy-on-click)
- Copy moves to right-click context menu

### Right-Click Context Menu
- Copy name to clipboard
- Copy SVG to clipboard
- Download as SVG
- Download as PNG (→ sub-menu with size presets)
- Rename icon
- Delete icon (with confirmation)
- Move to section (→ sub-menu listing all sections)

### Drag & Drop Between Sections
- Drag icon from one section to another
- On drop: move the underlying SVG file to the new folder
- Update the classification JSON
- Visual feedback during drag (ghost + drop target highlight)

### Section-Level Actions
- Click section header checkbox = select all in section
- Section toolbar: select all, deselect all, download all

### Batch Actions (on multi-selection)
- Download selected (SVG or PNG)
- Move selected to section
- Delete selected (with confirmation)
- Rename prefix (batch rename)

### API Routes Needed
- POST /api/move — move icon between directories
- POST /api/rename — rename an icon file
- DELETE /api/delete — delete an icon file
- POST /api/export — already exists (SVG/PNG download)
