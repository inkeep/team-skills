#!/usr/bin/env bun
/**
 * React Three Fiber 3D scene → PNG render pipeline (Option F).
 *
 * Bundles an R3F scene TSX file via Bun, serves it locally,
 * renders via Playwright (system Chrome for GPU, SwiftShader fallback),
 * and captures a screenshot.
 *
 * Usage:
 *   bun plugins/gtm/skills/graphics/tools/r3f/render.ts render --scene my-scene.tsx --output render.png
 *   bun plugins/gtm/skills/graphics/tools/r3f/render.ts render --scene my-scene.tsx --output render.png --width 1280 --height 720 --scale 2
 *   bun plugins/gtm/skills/graphics/tools/r3f/render.ts render --scene my-scene.tsx --output render.png --gpu swiftshader
 *   bun plugins/gtm/skills/graphics/tools/r3f/render.ts render --scene my-scene.tsx --output render.png --transparent
 *
 * Scene file requirements:
 *   - TSX file using React Three Fiber (<Canvas>, drei components, etc.)
 *   - Must mount to document.getElementById('root') via createRoot
 *   - Must set window.status = 'ready' after rendering is complete (use RenderSignal component)
 *
 * Prerequisites:
 *   - bun (for bundling + running)
 *   - playwright (bun add playwright)
 *   - three, react, react-dom, @react-three/fiber, @react-three/drei (bun add)
 *   - System Google Chrome installed (for GPU mode)
 */

import { resolve, dirname, parse as parsePath } from 'path';
import { parseArgs } from 'util';
import { mkdtemp, rm, copyFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

// --- Dependency check (auto-install on first use) ---
async function ensureDeps() {
  const missing: string[] = [];
  try { require.resolve('three'); } catch { missing.push('three'); }
  try { require.resolve('playwright'); } catch { missing.push('playwright'); }
  try { require.resolve('react'); } catch { missing.push('react'); }
  try { require.resolve('react-dom'); } catch { missing.push('react-dom'); }
  try { require.resolve('@react-three/fiber'); } catch { missing.push('@react-three/fiber'); }
  try { require.resolve('@react-three/drei'); } catch { missing.push('@react-three/drei'); }
  try { require.resolve('@react-three/postprocessing'); } catch { missing.push('@react-three/postprocessing'); }
  try { require.resolve('@react-three/csg'); } catch { missing.push('@react-three/csg'); }
  try { require.resolve('three-bvh-csg'); } catch { missing.push('three-bvh-csg'); }
  try { require.resolve('three-custom-shader-material'); } catch { missing.push('three-custom-shader-material'); }
  try { require.resolve('three-gpu-pathtracer'); } catch { missing.push('three-gpu-pathtracer'); }
  try { require.resolve('@react-three/gpu-pathtracer'); } catch { missing.push('@react-three/gpu-pathtracer'); }
  if (missing.length > 0) {
    console.log(`Installing missing dependencies: ${missing.join(', ')}...`);
    const result = Bun.spawnSync(['bun', 'add', ...missing], { cwd: resolve(dirname(new URL(import.meta.url).pathname), '..') });
    if (result.exitCode !== 0) {
      console.error(`Failed to install dependencies. Run manually:\n  cd ${resolve(dirname(new URL(import.meta.url).pathname), '..')} && bun add ${missing.join(' ')}`);
      process.exit(1);
    }
    console.log('Dependencies installed.');
  }
}
await ensureDeps();

import { chromium } from 'playwright';

const { values: args, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  allowPositionals: true,
  options: {
    scene:       { type: 'string' },
    output:      { type: 'string', default: 'render.png' },
    width:       { type: 'string', default: '1280' },
    height:      { type: 'string', default: '720' },
    scale:       { type: 'string', default: '2' },
    gpu:         { type: 'string', default: 'auto' },  // auto | chrome | swiftshader
    mode:        { type: 'string', default: 'full' },  // full | compositing
    transparent: { type: 'boolean', default: false },
    timeout:     { type: 'string', default: '15000' },
    background:  { type: 'string' },  // hex color override (default: scene controls this)
    assets:      { type: 'string' },  // path to assets dir (for HDRI, matcap textures, .glb models)
  },
});

const command = positionals[0];
if (command !== 'render' || !args.scene) {
  console.error(`Usage: bun plugins/gtm/skills/graphics/tools/r3f/render.ts render --scene <scene.tsx> --output <output.png> [options]

Options:
  --scene <file>       R3F scene TSX file (required)
  --output <file>      Output PNG path (default: render.png)
  --width <px>         Canvas width (default: 1280)
  --height <px>        Canvas height (default: 720)
  --scale <n>          Device scale factor (default: 2 → 2x retina)
  --gpu <mode>         GPU mode: auto | chrome | swiftshader (default: auto)
  --mode <mode>        Rendering mode: full (opaque bg, postprocessing OK) | compositing (transparent, no postprocessing)
  --transparent        Transparent background (shorthand for --mode compositing)
  --timeout <ms>       Render timeout in ms (default: 15000)
  --background <hex>   Override background color (e.g. '#FBF9F4')
  --assets <dir>       Path to assets directory for HDRI, matcap, .glb files (default: tools/r3f/assets/)
`);
  process.exit(1);
}

const width = parseInt(args.width!);
const height = parseInt(args.height!);
const scale = parseInt(args.scale!);
const scenePath = resolve(args.scene!);
const outputPath = resolve(args.output!);
const timeoutMs = parseInt(args.timeout!);
const renderMode = args.transparent ? 'compositing' : (args.mode || 'full');
const assetsDir = resolve(args.assets || resolve(dirname(new URL(import.meta.url).pathname), 'assets'));

// GPU launch configurations
const CHROME_GPU_ARGS = [
  '--enable-webgl', '--enable-webgl2',
  '--ignore-gpu-blocklist', '--enable-gpu-rasterization',
  '--no-sandbox',
];

const SWIFTSHADER_ARGS = [
  '--enable-webgl', '--enable-webgl2',
  '--ignore-gpu-blocklist',
  '--use-gl=angle', '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--disable-gpu-sandbox', '--no-sandbox',
];

async function render() {
  const t0 = Date.now();

  // 1. Bundle the scene
  console.log(`Bundling: ${scenePath}`);
  const tmpDir = await mkdtemp(join(tmpdir(), 'r3f-render-'));
  const bundlePath = join(tmpDir, 'scene-bundle.js');
  const htmlPath = join(tmpDir, 'index.html');

  // Ensure node_modules is accessible from the scene file's directory.
  // bun build resolves imports relative to the source file, not cwd.
  // If the scene is outside the skill dir (e.g. /tmp/), it can't find packages.
  const sceneDir = dirname(scenePath);
  const sceneNodeModules = join(sceneDir, 'node_modules');
  const skillRoot = resolve(dirname(new URL(import.meta.url).pathname), '../..');
  const skillNodeModules = join(skillRoot, 'node_modules');
  let createdSymlink = false;

  try {
    const existing = Bun.file(sceneNodeModules);
    if (!(await existing.exists())) {
      const { symlinkSync } = await import('fs');
      symlinkSync(skillNodeModules, sceneNodeModules);
      createdSymlink = true;
    }
  } catch {
    // If symlink fails (e.g. permissions), proceed anyway — bundler may still resolve via parent dirs
  }

  const bundleResult = Bun.spawnSync([
    'bun', 'build', scenePath,
    '--outfile', bundlePath,
    '--target', 'browser',
  ]);

  // Clean up symlink immediately after bundling
  if (createdSymlink) {
    try { const { unlinkSync } = await import('fs'); unlinkSync(sceneNodeModules); } catch {}
  }

  if (bundleResult.exitCode !== 0) {
    console.error('Bundle failed:', bundleResult.stderr.toString());
    process.exit(1);
  }
  console.log(`Bundle: ${(Bun.file(bundlePath).size / 1024).toFixed(0)}KB`);

  // 2. Write HTML shell
  const isCompositing = renderMode === 'compositing';
  const bgStyle = isCompositing ? 'transparent' :
                  args.background ? args.background : '#FBF9F4';
  await Bun.write(htmlPath, `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
*{margin:0;padding:0}
html,body,#root{width:${width}px;height:${height}px;overflow:hidden;background:${bgStyle}}
</style></head><body>
<div id="root"></div>
<script>window.__R3F_MODE__ = '${renderMode}';</script>
<script src="/scene-bundle.js"></script>
</body></html>`);

  // 3. Serve locally (HTML + bundle + assets directory)
  const server = Bun.serve({
    port: 0,
    async fetch(req) {
      const url = new URL(req.url);

      // Known routes
      if (url.pathname === '/') {
        return new Response(Bun.file(htmlPath), { headers: { 'Content-Type': 'text/html' } });
      }
      if (url.pathname === '/scene-bundle.js') {
        return new Response(Bun.file(bundlePath), { headers: { 'Content-Type': 'application/javascript' } });
      }

      // Serve from assets directory (/assets/studio.hdr, /assets/matcap-clay.png, /assets/model.glb, etc.)
      if (url.pathname.startsWith('/assets/')) {
        const assetPath = resolve(assetsDir, url.pathname.slice('/assets/'.length));
        const file = Bun.file(assetPath);
        if (await file.exists()) {
          return new Response(file); // Bun auto-detects MIME; RGBELoader reads raw bytes regardless
        }
      }

      // Serve from scene's directory (for co-located assets like textures)
      const localFile = resolve(sceneDir, url.pathname.slice(1));
      const file = Bun.file(localFile);
      if (await file.exists()) {
        return new Response(file);
      }

      return new Response('Not found', { status: 404 });
    },
  });

  // 4. Launch browser
  const gpuMode = args.gpu === 'auto' ? 'chrome' : args.gpu!;
  let browser;
  let usedGpu = gpuMode;

  if (gpuMode === 'chrome') {
    try {
      browser = await chromium.launch({ channel: 'chrome', args: CHROME_GPU_ARGS });
    } catch (err: any) {
      console.warn(`System Chrome not available (${err.message}), falling back to SwiftShader...`);
      browser = await chromium.launch({ args: SWIFTSHADER_ARGS });
      usedGpu = 'swiftshader';
    }
  } else {
    browser = await chromium.launch({ args: SWIFTSHADER_ARGS });
    usedGpu = 'swiftshader';
  }

  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: scale,
  });

  // Capture errors
  let renderError: string | null = null;
  page.on('pageerror', (err) => {
    if (err.message.includes('WebGL')) {
      renderError = err.message;
    }
    console.error(`  [page error] ${err.message}`);
  });
  page.on('console', (msg) => {
    if (msg.text().includes('rendered')) console.log(`  [browser] ${msg.text()}`);
    if (msg.type() === 'error' && msg.text().includes('WebGL')) {
      renderError = msg.text();
    }
  });

  // 5. Navigate and wait for render
  await page.goto(`http://localhost:${server.port}`, { waitUntil: 'networkidle', timeout: timeoutMs });

  // If Chrome GPU failed, retry with SwiftShader
  if (renderError && usedGpu === 'chrome') {
    console.warn('WebGL failed with Chrome GPU, retrying with SwiftShader...');
    await browser.close();
    browser = await chromium.launch({ args: SWIFTSHADER_ARGS });
    const page2 = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
    await page2.goto(`http://localhost:${server.port}`, { waitUntil: 'networkidle', timeout: timeoutMs });
    try {
      await page2.waitForFunction(() => (window as any).status === 'ready', { timeout: timeoutMs });
    } catch { await page2.waitForTimeout(3000); }
    await page2.screenshot({ path: outputPath, type: 'png', omitBackground: isCompositing });
    usedGpu = 'swiftshader';
    await browser.close();
  } else {
    try {
      await page.waitForFunction(() => (window as any).status === 'ready', { timeout: timeoutMs });
    } catch {
      console.warn('Render signal timeout — capturing anyway...');
      await page.waitForTimeout(3000);
    }

    // 6. Report GPU info
    const gpuInfo = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      if (!c) return 'no canvas';
      const gl = c.getContext('webgl2') || c.getContext('webgl');
      if (!gl) return 'no webgl';
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      if (!ext) return 'webgl (no debug ext)';
      return gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
    });
    console.log(`GPU: ${gpuInfo}`);

    // 7. Screenshot
    await page.screenshot({
      path: outputPath,
      type: 'png',
      omitBackground: isCompositing,
    });
    await browser.close();
  }

  server.stop();

  // 8. Save scene source as sibling of output PNG
  const parsed = parsePath(outputPath);
  const sceneExt = scenePath.endsWith('.tsx') ? '.tsx' : '.ts';
  const sceneOutPath = join(parsed.dir, `${parsed.name}.scene${sceneExt}`);
  await copyFile(scenePath, sceneOutPath);

  // 9. Cleanup tmp (bundle + HTML shell only — scene source is preserved above)
  await rm(tmpDir, { recursive: true, force: true });

  const elapsed = Date.now() - t0;
  const finalSize = Bun.file(outputPath).size;
  console.log(`\nOutput: ${outputPath}`);
  console.log(`Source: ${sceneOutPath}`);
  console.log(`Resolution: ${width * scale}×${height * scale}px`);
  console.log(`Mode: ${renderMode}`);
  console.log(`GPU: ${usedGpu}`);
  console.log(`Size: ${(finalSize / 1024).toFixed(0)}KB`);
  console.log(`Time: ${elapsed}ms`);
}

render().catch((err) => {
  console.error('Render failed:', err);
  process.exit(1);
});
