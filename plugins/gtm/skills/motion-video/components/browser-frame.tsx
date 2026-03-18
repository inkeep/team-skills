/**
 * BrowserFrame Component
 *
 * Renders a browser window mockup with URL bar, tabs, and navigation controls.
 * Content is rendered inside the browser viewport area.
 * Adapted from chuk-motion (IBM) for Inkeep brand.
 *
 * Usage:
 * ```tsx
 * <BrowserFrame url="https://inkeep.com" delay={0}>
 *   <Img src={staticFile("images/product-screenshot.png")} style={{ width: "100%", height: "100%" }} />
 * </BrowserFrame>
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
import { COLORS, FONTS, SPACING, RADIUS } from "../styles/brand";

interface TabConfig {
  title: string;
  active?: boolean;
}

interface BrowserFrameProps {
  children?: React.ReactNode;
  /** Delay in frames before entrance animation */
  delay?: number;
  /** URL displayed in the address bar */
  url?: string;
  /** Browser theme */
  theme?: "light" | "dark";
  /** Tab configurations */
  tabs?: TabConfig[];
  /** Width of the browser frame */
  width?: number;
  /** Height of the browser frame */
  height?: number;
  /** Show drop shadow */
  shadow?: boolean;
  /** Additional container styles */
  style?: React.CSSProperties;
}

export const BrowserFrame: React.FC<BrowserFrameProps> = ({
  children,
  delay = 0,
  url = "https://inkeep.com",
  theme = "light",
  tabs,
  width = 1000,
  height = 650,
  shadow = true,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isLight = theme === "light";
  const bgColor = isLight ? "#ffffff" : COLORS.text;
  const borderColor = isLight ? COLORS.grayMedium : "#444";
  const textColor = isLight ? COLORS.text : "#e0e0e0";
  const mutedColor = isLight ? COLORS.muted : "#999";
  const barBg = isLight ? COLORS.surface : "#2a2a2a";

  // Entrance animation
  const entranceProgress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20, stiffness: 200 },
  });

  const scale = interpolate(entranceProgress, [0, 1], [0.92, 1]);
  const opacity = interpolate(entranceProgress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const DOT_SIZE = 10;
  const dotColors = ["#ff5f57", "#ffbd2e", "#28c840"];

  return (
    <div
      style={{
        width,
        height,
        borderRadius: RADIUS.lg,
        overflow: "hidden",
        border: `1px solid ${borderColor}`,
        backgroundColor: bgColor,
        transform: `scale(${scale})`,
        opacity,
        boxShadow: shadow
          ? "0 24px 48px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.08)"
          : "none",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      {/* Title bar with dots */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: `${SPACING.sm}px ${SPACING.md}px`,
          backgroundColor: barBg,
          borderBottom: `1px solid ${borderColor}`,
          gap: SPACING.sm,
        }}
      >
        {/* Window controls */}
        <div style={{ display: "flex", gap: 6 }}>
          {dotColors.map((color, i) => (
            <div
              key={i}
              style={{
                width: DOT_SIZE,
                height: DOT_SIZE,
                borderRadius: "50%",
                backgroundColor: color,
              }}
            />
          ))}
        </div>

        {/* Tabs (if provided) */}
        {tabs && tabs.length > 0 && (
          <div style={{ display: "flex", gap: 2, marginLeft: SPACING.md }}>
            {tabs.map((tab, i) => (
              <div
                key={i}
                style={{
                  padding: `${SPACING.xs}px ${SPACING.md}px`,
                  fontSize: 12,
                  fontFamily: FONTS.primary,
                  color: tab.active ? textColor : mutedColor,
                  backgroundColor: tab.active ? bgColor : "transparent",
                  borderRadius: `${RADIUS.sm}px ${RADIUS.sm}px 0 0`,
                }}
              >
                {tab.title}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* URL bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: `${SPACING.xs}px ${SPACING.md}px`,
          backgroundColor: barBg,
          borderBottom: `1px solid ${borderColor}`,
          gap: SPACING.sm,
        }}
      >
        {/* Navigation buttons */}
        <div style={{ display: "flex", gap: SPACING.sm, opacity: 0.4 }}>
          <span style={{ fontSize: 14, color: textColor }}>{"‹"}</span>
          <span style={{ fontSize: 14, color: textColor }}>{"›"}</span>
        </div>

        {/* Address bar */}
        <div
          style={{
            flex: 1,
            padding: `${SPACING.xs}px ${SPACING.sm}px`,
            backgroundColor: isLight ? "#f0f0f0" : "#1a1a1a",
            borderRadius: RADIUS.sm,
            display: "flex",
            alignItems: "center",
            gap: SPACING.xs,
          }}
        >
          {/* Lock icon */}
          <span style={{ fontSize: 10, color: mutedColor }}>🔒</span>
          <span
            style={{
              fontSize: 12,
              fontFamily: FONTS.primary,
              color: mutedColor,
            }}
          >
            {url}
          </span>
        </div>
      </div>

      {/* Content viewport */}
      <div
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          backgroundColor: isLight ? "#ffffff" : "#1a1a1a",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default BrowserFrame;
