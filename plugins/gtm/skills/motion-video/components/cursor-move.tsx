/**
 * CursorMove Component
 *
 * Animated cursor that moves between positions with a click effect.
 * Use for product demo videos showing user interactions.
 *
 * Usage:
 * ```tsx
 * <CursorMove
 *   path={[
 *     { x: 100, y: 200, frame: 0 },
 *     { x: 400, y: 300, frame: 30, click: true },
 *     { x: 600, y: 150, frame: 60, click: true },
 *   ]}
 * />
 * ```
 */

import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { COLORS } from "../styles/brand";

interface CursorPosition {
  x: number;
  y: number;
  /** Frame at which cursor should arrive at this position */
  frame: number;
  /** Whether to show a click effect at this position */
  click?: boolean;
}

interface CursorMoveProps {
  /** Array of positions the cursor moves through */
  path: CursorPosition[];
  /** Cursor size in pixels */
  size?: number;
  /** Cursor color */
  color?: string;
  /** Duration of click ripple effect in frames */
  clickDuration?: number;
  /** Delay before cursor appears */
  delay?: number;
  /** Additional container styles */
  style?: React.CSSProperties;
}

export const CursorMove: React.FC<CursorMoveProps> = ({
  path,
  size = 20,
  color = COLORS.text,
  clickDuration = 12,
  delay = 0,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const adjustedFrame = frame - delay;

  if (adjustedFrame < 0 || path.length === 0) return null;

  // Find current segment
  let currentX = path[0].x;
  let currentY = path[0].y;

  for (let i = 1; i < path.length; i++) {
    const prev = path[i - 1];
    const curr = path[i];

    if (adjustedFrame >= prev.frame && adjustedFrame <= curr.frame) {
      const progress = interpolate(
        adjustedFrame,
        [prev.frame, curr.frame],
        [0, 1],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.inOut(Easing.cubic),
        }
      );
      currentX = prev.x + (curr.x - prev.x) * progress;
      currentY = prev.y + (curr.y - prev.y) * progress;
      break;
    } else if (adjustedFrame > curr.frame) {
      currentX = curr.x;
      currentY = curr.y;
    }
  }

  // Check for click effect at any position
  const activeClick = path.find(
    (p) =>
      p.click &&
      adjustedFrame >= p.frame &&
      adjustedFrame < p.frame + clickDuration
  );

  const clickProgress = activeClick
    ? interpolate(
        adjustedFrame,
        [activeClick.frame, activeClick.frame + clickDuration],
        [0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      )
    : 0;

  // Entrance fade
  const opacity = interpolate(adjustedFrame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: currentX,
        top: currentY,
        opacity,
        pointerEvents: "none",
        ...style,
      }}
    >
      {/* Click ripple */}
      {activeClick && (
        <div
          style={{
            position: "absolute",
            left: -15,
            top: -15,
            width: 30,
            height: 30,
            borderRadius: "50%",
            border: `2px solid ${COLORS.primary}`,
            opacity: 1 - clickProgress,
            transform: `scale(${1 + clickProgress * 1.5})`,
          }}
        />
      )}

      {/* Cursor SVG */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        style={{
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
          transform: activeClick
            ? `scale(${1 - clickProgress * 0.15 + clickProgress * 0.15})`
            : undefined,
        }}
      >
        <path
          d="M5.65 2.65a1 1 0 0 0-1.3 1.3l7 18a1 1 0 0 0 1.88-.12l2.1-6.5a1 1 0 0 1 .64-.64l6.5-2.1a1 1 0 0 0 .12-1.88l-18-7z"
          fill={color}
          stroke="#ffffff"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
};

export default CursorMove;
