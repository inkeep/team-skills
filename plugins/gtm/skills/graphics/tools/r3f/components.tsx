/**
 * Reusable R3F components for the 3D render pipeline.
 *
 * Import from scene files:
 *   import { RenderSignal, SVGTo3D } from '../tools/r3f/components';
 *
 * These are generic building blocks — brand-specific choices (colors, SVG paths)
 * belong in the scene file, not here.
 */
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import * as THREE from 'three';

// === RENDER SIGNAL ===
// Required in every scene. Signals Playwright to capture the screenshot.
// Use frames={8} when MeshTransmissionMaterial is in the scene (needs multiple
// frames to converge its internal FBO).

export function RenderSignal({ frames = 8 }: { frames?: number }) {
  const count = useRef(0);
  useFrame(() => {
    count.current++;
    if (count.current === frames) {
      requestAnimationFrame(() => {
        (window as any).status = 'ready';
        console.log('R3F scene rendered successfully');
      });
    }
  });
  return null;
}

// === SVG TO 3D ===
// Extrude any SVG string into 3D geometry. Parses all paths, flips Y axis,
// centers, scales. Each path becomes a separate mesh with its own material.

export interface SVGTo3DProps {
  /** Raw SVG markup string */
  svgString: string;
  /** Scale factor — SVG coords are typically large (100-1000s), this normalizes to scene units */
  scale?: number;
  /** Extrude depth per path (single value or array matching path count) */
  depth?: number | number[];
  /** Bevel thickness (default 0.06) */
  bevelThickness?: number;
  /** Bevel size (default 0.06) */
  bevelSize?: number;
  /** Bevel segments (default 12 — higher = smoother beveled edges) */
  bevelSegments?: number;
  /** Curve segments for bezier paths (default 128 — higher = smoother organic curves) */
  curveSegments?: number;
  /** Override materials per path index. Falls back to the SVG fill color as meshStandardMaterial. */
  materials?: (THREE.Material | null)[];
  /** Z offset between overlapping paths (default 0.05) */
  pathZOffset?: number;
  /** SVG viewBox width — used for centering. Auto-detected from svgString if omitted. */
  viewBoxWidth?: number;
  /** SVG viewBox height — used for centering. Auto-detected from svgString if omitted. */
  viewBoxHeight?: number;
}

export function SVGTo3D({
  svgString,
  scale: s = 1 / 120,
  depth = 0.3,
  bevelThickness = 0.06,
  bevelSize = 0.06,
  bevelSegments = 12,
  curveSegments = 128,
  materials,
  pathZOffset = 0.05,
  viewBoxWidth,
  viewBoxHeight,
}: SVGTo3DProps) {
  const group = useMemo(() => {
    const loader = new SVGLoader();
    const svgData = loader.parse(svgString);
    const g = new THREE.Group();

    // Auto-detect viewBox for centering
    let vbW = viewBoxWidth;
    let vbH = viewBoxHeight;
    if (!vbW || !vbH) {
      const match = svgString.match(/viewBox=["']([^"']+)["']/);
      if (match) {
        const parts = match[1].split(/\s+/).map(Number);
        vbW = vbW || parts[2];
        vbH = vbH || parts[3];
      }
    }
    const offsetX = -(vbW || 0) / 2;
    const offsetY = -(vbH || 0) / 2;

    svgData.paths.forEach((path, i) => {
      const color = path.color;
      const shapes = SVGLoader.createShapes(path);
      const pathDepth = Array.isArray(depth) ? (depth[i] ?? depth[0]) : depth;

      shapes.forEach((shape) => {
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: pathDepth,
          bevelEnabled: true,
          bevelThickness,
          bevelSize,
          bevelSegments,
          curveSegments,
        });

        const material = materials?.[i] ?? new THREE.MeshStandardMaterial({
          color,
          roughness: 0.6,
          metalness: 0.05,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.scale.set(s, -s, s);
        mesh.position.set(offsetX * s, -offsetY * s, i * pathZOffset);

        g.add(mesh);
      });
    });

    return g;
  }, [svgString, s, depth, bevelThickness, bevelSize, bevelSegments, curveSegments, pathZOffset, viewBoxWidth, viewBoxHeight]);

  return <primitive object={group} />;
}
