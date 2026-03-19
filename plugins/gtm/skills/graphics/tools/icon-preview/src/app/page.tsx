import { scanIconSet, loadStyleGroups, groupByDirectory } from "@/lib/icons";
import { IconBrowser } from "@/components/icon-browser";

export const dynamic = "force-dynamic";

export default function Home() {
  const allIcons = scanIconSet();
  const styleGroups = loadStyleGroups();
  const groups = styleGroups || groupByDirectory(allIcons);

  const totalIcons = allIcons.length;
  const uniqueGroups = groups.length;
  const classified = groups.reduce((sum, g) => sum + g.icons.length, 0);

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-2">Icon Preview</h1>
      <p className="text-muted-foreground text-sm mb-8">
        {styleGroups
          ? `${uniqueGroups} style groups from classification. Click to select, right-click for actions.`
          : `${uniqueGroups} groups from folder structure. Add classification JSON for style-based grouping.`}
      </p>

      <div className="flex gap-4 mb-10 flex-wrap">
        <Stat value={totalIcons} label="Total SVGs" />
        <Stat value={uniqueGroups} label="Style groups" />
        <Stat value={classified} label="Classified" />
      </div>

      <p className="text-xs text-muted-foreground mb-2">
        Click to select · Right-click for actions · Drag between sections to move
      </p>

      <IconBrowser
        groups={groups}
        allIcons={allIcons.map((i) => ({
          file: i.file,
          category: i.category,
          key: i.key,
        }))}
      />
    </main>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-card border border-border rounded-lg px-5 py-3 shadow-sm">
      <div className="text-2xl font-bold text-primary">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
