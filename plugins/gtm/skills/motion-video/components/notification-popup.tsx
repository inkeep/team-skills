/**
 * NotificationPopup Component
 *
 * Animated toast notification that enters from an edge with spring physics.
 * Use to show product notifications, alerts, or success messages in demos.
 *
 * Usage:
 * ```tsx
 * <NotificationPopup
 *   message="Agent deployed successfully"
 *   position="top-right"
 *   delay={60}
 *   duration={90}
 * />
 * ```
 */

import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { COLORS, FONTS, SPACING, RADIUS } from "../styles/brand";

type PopupPosition =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left"
  | "top-center";

interface NotificationPopupProps {
  /** Notification message text */
  message: string;
  /** Optional title above the message */
  title?: string;
  /** Position on screen */
  position?: PopupPosition;
  /** Delay in frames before popup appears */
  delay?: number;
  /** Total duration the popup is visible (including entrance/exit) */
  duration?: number;
  /** Icon to show (emoji or text) */
  icon?: string;
  /** Additional container styles */
  style?: React.CSSProperties;
}

const POSITION_STYLES: Record<
  PopupPosition,
  { top?: number; bottom?: number; left?: number | string; right?: number; transform?: string }
> = {
  "top-right": { top: 24, right: 24 },
  "top-left": { top: 24, left: 24 },
  "bottom-right": { bottom: 24, right: 24 },
  "bottom-left": { bottom: 24, left: 24 },
  "top-center": { top: 24, left: "50%", transform: "translateX(-50%)" },
};

export const NotificationPopup: React.FC<NotificationPopupProps> = ({
  message,
  title,
  position = "top-right",
  delay = 0,
  duration = 90,
  icon = "✓",
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const adjustedFrame = frame - delay;
  if (adjustedFrame < 0) return null;

  // Entrance spring
  const entrance = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 15, stiffness: 200 },
  });

  // Exit animation
  const exitStart = duration - 15;
  const exitProgress = interpolate(
    adjustedFrame,
    [exitStart, duration],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  if (adjustedFrame > duration) return null;

  const isRight = position.includes("right") || position === "top-center";
  const slideDirection = isRight ? 1 : -1;

  const translateX = interpolate(
    entrance,
    [0, 1],
    [50 * slideDirection, 0]
  );

  const opacity = interpolate(entrance, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }) * (1 - exitProgress);

  const posStyles = POSITION_STYLES[position];

  return (
    <div
      style={{
        position: "absolute",
        ...posStyles,
        transform: `${posStyles.transform || ""} translateX(${translateX}px)`.trim(),
        opacity,
        zIndex: 100,
        ...style,
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: RADIUS.lg,
          padding: `${SPACING.md}px ${SPACING.lg}px`,
          boxShadow:
            "0 12px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)",
          display: "flex",
          alignItems: "center",
          gap: SPACING.sm,
          minWidth: 250,
          border: `1px solid ${COLORS.grayMedium}`,
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            backgroundColor: COLORS.primaryLighter,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>

        {/* Content */}
        <div>
          {title && (
            <div
              style={{
                fontFamily: FONTS.primary,
                fontSize: 14,
                fontWeight: 600,
                color: COLORS.text,
                marginBottom: 2,
              }}
            >
              {title}
            </div>
          )}
          <div
            style={{
              fontFamily: FONTS.primary,
              fontSize: 13,
              color: COLORS.muted,
            }}
          >
            {message}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPopup;
