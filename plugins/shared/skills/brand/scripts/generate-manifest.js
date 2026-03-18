// Figma Plugin API script — run via figma_execute
// Extracts ALL design system data (tokens + components) as a single JSON blob
// Then use generate-manifest-md.py to format into markdown

async function generateManifest() {
  const page = figma.root.children.find(p => p.name === 'Brand Assets');
  if (!page) return { error: 'Brand Assets page not found' };
  await figma.setCurrentPageAsync(page);

  const manifest = {
    generatedAt: new Date().toISOString(),
    file: { name: figma.root.name, key: '__FILE_KEY__' },

    // === DESIGN TOKENS ===
    tokens: {},

    // === COMPONENTS ===
    sections: [],
    components: []
  };

  // --- Extract all variable collections and tokens ---
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  for (const col of collections) {
    const tokens = [];
    for (const varId of col.variableIds) {
      const v = await figma.variables.getVariableByIdAsync(varId);
      if (!v || v.hiddenFromPublishing) continue;

      const values = {};
      for (const modeId of Object.keys(v.valuesByMode)) {
        const mode = col.modes.find(m => m.modeId === modeId);
        const val = v.valuesByMode[modeId];

        if (v.resolvedType === 'COLOR' && val && typeof val === 'object' && 'r' in val) {
          const r = Math.round(val.r * 255);
          const g = Math.round(val.g * 255);
          const b = Math.round(val.b * 255);
          const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
          values[mode?.name || modeId] = hex;
        } else {
          values[mode?.name || modeId] = val;
        }
      }

      tokens.push({
        name: v.name,
        type: v.resolvedType,
        value: Object.values(values)[0], // default mode value
        allValues: values,
        description: v.description || '',
        scopes: v.scopes,
        codeSyntax: v.codeSyntax || {}
      });
    }

    manifest.tokens[col.name] = {
      modes: col.modes.map(m => m.name),
      defaultMode: col.modes.find(m => m.modeId === col.defaultModeId)?.name || col.modes[0]?.name,
      tokens
    };
  }

  // --- Extract all components with section hierarchy ---
  function collectComponents(node, sectionPath) {
    for (const child of node.children || []) {
      if (child.type === 'SECTION') {
        const newPath = sectionPath ? `${sectionPath} > ${child.name}` : child.name;
        manifest.sections.push({ name: child.name, path: newPath });
        collectComponents(child, newPath);
      } else if (child.type === 'COMPONENT') {
        manifest.components.push({
          name: child.name,
          id: child.id,
          key: child.key,
          description: child.description || '',
          width: Math.round(child.width),
          height: Math.round(child.height),
          section: sectionPath || ''
        });
      }
    }
  }
  collectComponents(page, '');

  return manifest;
}

return await generateManifest();
