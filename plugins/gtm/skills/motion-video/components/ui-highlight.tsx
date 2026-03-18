/**
 * UIHighlight Component
 *
 * Animated glow/pulse effect that highlights a UI element at specified coordinates.
 * Use to draw attention to specific parts of a product screenshot.
 *
 * Usage:
 * ```tsx
 * <UIHighlight x={200} y={150} width={300} height={40} delay={30} />
 * ```
 */

import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { COLORS, RADIUS } from "../styles/brand";

interface UIHighlightProps {
  /** X position of the highlight area */
  x: number;
  /** Y position of the highlight area */
  y: number;
  /** Width of the highlight area */
  width: number;
  /** Height of the highlight area */
  height: number;
  /** Highlight color */
  color?: string;
  /** Number of pulse cycles (0 = single pulse) */
  pulseCount?: number;
  /** Delay in frames before highlight appears */
  delay?: number;
  /** Border radius of the highlight */
  borderRadius?: number;
  /** Additional container styles */
  style?: React.CSSProperties;
}

export const UIHighlight: React.FC<UIHighlightProps> = ({
  x,
  y,
  width,
  height,
  color = COLORS.primary,
  pulseCount = 2,
  delay = 0,
  borderRadius = RADIUS.md,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const adjustedFrame = frame - delay;
  if (adjustedFrame < 0) return null;

  // Entrance animation
  const entrance = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 20, stiffness: 200 },
  });

  const entranceOpacity = interpolate(entrance, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const entranceScale = interpolate(entrance, [0, 1], [0.9, 1]);

  // Pulse animation (after entrance completes)
  const PULSE_PERIOD = 20; // frames per pulse cycle
  const pulseFrame = Math.max(0, adjustedFrame - 15); // Start pulsing after entrance
  const pulseProgress =
    pulseCount > 0
      ? Math.sin((pulseFrame / PULSE_PERIOD) * Math.PI * 2) * 0.5 + 0.5
      : 0;

  // Stop pulsing after pulseCount cycles
  const pulsesCompleted = Math.floor(pulseFrame / PULSE_PERIOD);
  const isPulsing = pulseCount > 0 && pulsesCompleted < pulseCount;

  const glowOpacity = isPulsing
    ? interpolate(pulseProgress, [0, 1], [0.3, 0.7])
    : 0.4;

  const glowSpread = isPulsing
    ? interpolate(pulseProgress, [0, 1], [4, 12])
    : 6;

  return (
    <div
      style={{
        position: "absolute",
        left: x - 4,
        top: y - 4,
        width: width + 8,
        height: height + 8,
        borderRadius,
        border: `2px solid ${color}`,
        boxShadow: `0 0 ${glowSpread}px ${glowSpread / 2}px ${color}`,
        opacity: entranceOpacity * glowOpacity * 2,
        transform: `scale(${entranceScale})`,
        pointerEvents: "none",
        ...style,
      }}
    />
  );
};

export default UIHighlight;
