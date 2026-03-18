/**
 * ZoomInto Component
 *
 * Animated zoom into a specific region of an image/screenshot.
 * Shows the full image first, then smoothly zooms into the target region.
 *
 * Usage:
 * ```tsx
 * <ZoomInto
 *   src={staticFile("images/product-screenshot.png")}
 *   region={{ x: 200, y: 150, width: 400, height: 300 }}
 *   zoomLevel={2.5}
 *   delay={30}
 *   duration={45}
 * />
 * ```
 */

import React from "react";
import {
  useCurrentFrame,
  interpolate,
  Easing,
  Img,
} from "remotion";

interface ZoomRegion {
  /** X position of the zoom target (from left, in pixels of the source image) */
  x: number;
  /** Y position of the zoom target (from top, in pixels of the source image) */
  y: number;
  /** Width of the zoom target region */
  width: number;
  /** Height of the zoom target region */
  height: number;
}

interface ZoomIntoProps {
  /** Image source (use staticFile() for local images) */
  src: string;
  /** Target region to zoom into */
  region: ZoomRegion;
  /** How far to zoom in (default: 2.5x) */
  zoomLevel?: number;
  /** Delay in frames before zoom starts */
  delay?: number;
  /** Duration of the zoom animation in frames */
  duration?: number;
  /** Hold at zoomed position for this many frames before zooming back out (0 = stay zoomed) */
  holdDuration?: number;
  /** Width of the viewport */
  width?: number;
  /** Height of the viewport */
  height?: number;
  /** Additional container styles */
  style?: React.CSSProperties;
}

export const ZoomInto: React.FC<ZoomIntoProps> = ({
  src,
  region,
  zoomLevel = 2.5,
  delay = 0,
  duration = 45,
  holdDuration = 0,
  width = 1920,
  height = 1080,
  style = {},
}) => {
  const frame = useCurrentFrame();

  // Zoom in progress
  const zoomIn = interpolate(
    frame,
    [delay, delay + duration],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    }
  );

  // Zoom out progress (if holdDuration > 0)
  const zoomOut =
    holdDuration > 0
      ? interpolate(
          frame,
          [
            delay + duration + holdDuration,
            delay + duration + holdDuration + duration,
          ],
          [0, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.cubic),
          }
        )
      : 0;

  // Combined progress: 0 = full view, 1 = zoomed in
  const progress = zoomIn - zoomOut;

  // Calculate transform values
  const scale = interpolate(progress, [0, 1], [1, zoomLevel]);

  // Center of the region as percentage of viewport
  const centerX = region.x + region.width / 2;
  const centerY = region.y + region.height / 2;

  // Translate to center the region (in percentage of image dimensions)
  const translateX = interpolate(
    progress,
    [0, 1],
    [0, -(centerX - width / 2) * (zoomLevel - 1)]
  );
  const translateY = interpolate(
    progress,
    [0, 1],
    [0, -(centerY - height / 2) * (zoomLevel - 1)]
  );

  return (
    <div
      style={{
        width,
        height,
        overflow: "hidden",
        position: "relative",
        ...style,
      }}
    >
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`,
          transformOrigin: "center center",
        }}
      />
    </div>
  );
};

export default ZoomInto;
