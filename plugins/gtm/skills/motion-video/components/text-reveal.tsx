/**
 * Text Reveal Component
 *
 * Animates text with a fade-up effect matching Inkeep website headlines.
 * Uses the standard Inkeep easing curve and 20-30px Y-offset.
 *
 * Usage:
 * ```tsx
 * <TextReveal delay={0}>
 *   The Agent Platform for Customer Operations
 * </TextReveal>
 * ```
 */

import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";

import { COLORS, FONTS } from "../styles/brand";

interface TextRevealProps {
  children: React.ReactNode;
  /** Delay in frames before animation starts (at 30fps) */
  delay?: number;
  /** Duration in frames (default: 15 frames = 0.5s) */
  duration?: number;
  /** Y-offset in pixels (default: 20) */
  yOffset?: number;
  /** Font size in pixels */
  fontSize?: number;
  /** Font weight */
  fontWeight?: number;
  /** Use serif font (for subtext) */
  serif?: boolean;
  /** Text color */
  color?: string;
  /** Letter spacing */
  letterSpacing?: string;
  /** Line height */
  lineHeight?: number;
  /** Additional styles */
  style?: React.CSSProperties;
}

export const TextReveal: React.FC<TextRevealProps> = ({
  children,
  delay = 0,
  duration = 15,
  yOffset = 20,
  fontSize = 72,
  fontWeight = 400,
  serif = false,
  color = COLORS.text,
  letterSpacing = "-0.02em",
  lineHeight = 1.1,
  style = {},
}) => {
  const frame = useCurrentFrame();

  // Calculate animation progress
  const opacity = interpolate(
    frame,
    [delay, delay + duration],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }
  );

  const translateY = interpolate(
    frame,
    [delay, delay + duration],
    [yOffset, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }
  );

  return (
    <div
      style={{
        fontFamily: serif ? FONTS.serif : FONTS.primary,
        fontSize,
        fontWeight,
        color,
        letterSpacing,
        lineHeight,
        opacity,
        transform: `translateY(${translateY}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Hero Headline Component
 *
 * Pre-configured for Inkeep hero headlines (72px desktop).
 */
export const HeroHeadline: React.FC<Omit<TextRevealProps, "fontSize" | "fontWeight">> = (props) => (
  <TextReveal
    fontSize={72}
    fontWeight={400}
    letterSpacing="-1.5px"
    lineHeight={1.1}
    {...props}
  />
);

/**
 * Subtext Component
 *
 * Pre-configured for Inkeep subtext (serif, 24px, light weight).
 */
export const Subtext: React.FC<Omit<TextRevealProps, "fontSize" | "fontWeight" | "serif">> = (props) => (
  <TextReveal
    fontSize={24}
    fontWeight={300}
    serif
    letterSpacing="-0.4px"
    lineHeight={1.25}
    {...props}
  />
);

export default TextReveal;
