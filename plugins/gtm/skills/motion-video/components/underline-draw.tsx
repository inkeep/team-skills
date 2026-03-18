/**
 * Underline Draw Component
 *
 * Animates a blue underline with scaleX effect matching Inkeep website headlines.
 * The underline draws from left to right with the Inkeep easing curve.
 *
 * Usage:
 * ```tsx
 * <div style={{ position: "relative", display: "inline-block" }}>
 *   <span>Customer Operations</span>
 *   <UnderlineDraw delay={15} />
 * </div>
 * ```
 */

import React from "react";
import { useCurrentFrame, interpolate, Easing, Img, staticFile } from "remotion";

// Inkeep brand colors
const COLORS = {
  primary: "#3784ff",
};

interface UnderlineDrawProps {
  /** Delay in frames before animation starts (at 30fps) */
  delay?: number;
  /** Duration in frames (default: 18 frames = 0.6s) */
  duration?: number;
  /** Underline color */
  color?: string;
  /** Underline height in pixels */
  height?: number;
  /** Use image underline (curved) instead of solid line */
  useImage?: boolean;
  /** Bottom offset in pixels */
  bottom?: number;
  /** Additional styles for the container */
  style?: React.CSSProperties;
}

export const UnderlineDraw: React.FC<UnderlineDrawProps> = ({
  delay = 15,
  duration = 18,
  color = COLORS.primary,
  height = 8,
  useImage = false,
  bottom = -4,
  style = {},
}) => {
  const frame = useCurrentFrame();

  // Scale X animation (0 → 1)
  const scaleX = interpolate(
    frame,
    [delay, delay + duration],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }
  );

  // Opacity fade in
  const opacity = interpolate(
    frame,
    [delay, delay + 3],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const baseStyle: React.CSSProperties = {
    position: "absolute",
    bottom,
    left: 0,
    right: 0,
    width: "100%",
    transform: `scaleX(${scaleX})`,
    transformOrigin: "left",
    opacity,
    ...style,
  };

  if (useImage) {
    return (
      <Img
        src={staticFile("icons/line-curve-blue.png")}
        style={{
          ...baseStyle,
          height: "auto",
          transform: `scaleX(${scaleX}) scaleY(0.5)`,
        }}
      />
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 160 8"
      fill="none"
      preserveAspectRatio="none"
      style={{
        ...baseStyle,
        height,
      }}
      aria-hidden="true"
    >
      <path
        d="M2 5 C 38 4.85, 74 5.35, 110 5.1 C 132 4.95, 146 4.9, 158 4.95 L 158 6.9 C 146 7.0, 132 7.05, 110 6.95 C 74 7.1, 38 6.7, 2 6.6 Z"
        fill={color}
      />
    </svg>
  );
};

/**
 * Headline with Underline Component
 *
 * Combines text with an animated underline for the signature Inkeep headline effect.
 *
 * Usage:
 * ```tsx
 * <HeadlineWithUnderline underlineText="Customer Operations">
 *   The Agent Platform for{" "}
 * </HeadlineWithUnderline>
 * ```
 */
interface HeadlineWithUnderlineProps {
  children: React.ReactNode;
  /** The text that gets the underline */
  underlineText: string;
  /** Delay in frames for the headline reveal */
  headlineDelay?: number;
  /** Additional delay for the underline (added to headline delay) */
  underlineExtraDelay?: number;
  /** Font size */
  fontSize?: number;
  /** Text color */
  color?: string;
}

export const HeadlineWithUnderline: React.FC<HeadlineWithUnderlineProps> = ({
  children,
  underlineText,
  headlineDelay = 0,
  underlineExtraDelay = 15,
  fontSize = 72,
  color = "#231f20",
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [headlineDelay, headlineDelay + 15],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }
  );

  const translateY = interpolate(
    frame,
    [headlineDelay, headlineDelay + 15],
    [30, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }
  );

  return (
    <div
      style={{
        fontFamily: "Neue Haas Grotesk Display Pro, Arial, Helvetica, sans-serif",
        fontSize,
        fontWeight: 400,
        lineHeight: 1.1,
        letterSpacing: "-0.02em",
        color,
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      {children}
      <span style={{ position: "relative", display: "inline-block" }}>
        <span style={{ position: "relative", zIndex: 10 }}>{underlineText}</span>
        <UnderlineDraw delay={headlineDelay + underlineExtraDelay} />
      </span>
    </div>
  );
};

export default UnderlineDraw;
