/**
 * Section Fade Component
 *
 * Animates section transitions with opacity and subtle scale.
 * Matches the viewport-triggered animations on the Inkeep website.
 *
 * Usage:
 * ```tsx
 * <SectionFade delay={30}>
 *   <YourSectionContent />
 * </SectionFade>
 * ```
 */

import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";

// Inkeep brand colors
const COLORS = {
  background: "#fbf9f4",
};

interface SectionFadeProps {
  children: React.ReactNode;
  /** Delay in frames before animation starts */
  delay?: number;
  /** Duration of fade in frames (default: 15 = 0.5s) */
  duration?: number;
  /** Include subtle scale animation */
  includeScale?: boolean;
  /** Background color */
  backgroundColor?: string;
  /** Padding in pixels */
  padding?: number | string;
  /** Additional styles */
  style?: React.CSSProperties;
}

export const SectionFade: React.FC<SectionFadeProps> = ({
  children,
  delay = 0,
  duration = 15,
  includeScale = true,
  backgroundColor = "transparent",
  padding = 0,
  style = {},
}) => {
  const frame = useCurrentFrame();

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

  const scale = includeScale
    ? interpolate(
        frame,
        [delay, delay + duration],
        [0.995, 1],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        }
      )
    : 1;

  return (
    <div
      style={{
        backgroundColor,
        padding,
        opacity,
        transform: `scale(${scale})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Section Container Component
 *
 * Full-width section with Inkeep styling and fade animation.
 */
interface SectionContainerProps extends Omit<SectionFadeProps, "padding"> {
  /** Max width for content */
  maxWidth?: number;
  /** Vertical padding */
  paddingY?: number;
  /** Horizontal padding */
  paddingX?: number;
}

export const SectionContainer: React.FC<SectionContainerProps> = ({
  children,
  maxWidth = 1440,
  paddingY = 64,
  paddingX = 44,
  backgroundColor = COLORS.background,
  ...fadeProps
}) => {
  return (
    <SectionFade
      backgroundColor={backgroundColor}
      style={{
        width: "100%",
        padding: `${paddingY}px ${paddingX}px`,
      }}
      {...fadeProps}
    >
      <div
        style={{
          maxWidth,
          margin: "0 auto",
        }}
      >
        {children}
      </div>
    </SectionFade>
  );
};

/**
 * Staggered Children Component
 *
 * Animates children with staggered delays.
 */
interface StaggeredChildrenProps {
  children: React.ReactNode[];
  /** Base delay in frames */
  delay?: number;
  /** Stagger delay between children in frames */
  staggerDelay?: number;
  /** Direction of stagger */
  direction?: "down" | "up" | "left" | "right";
}

export const StaggeredChildren: React.FC<StaggeredChildrenProps> = ({
  children,
  delay = 0,
  staggerDelay = 6,
  direction = "down",
}) => {
  const frame = useCurrentFrame();

  const getTransform = (translateValue: number) => {
    switch (direction) {
      case "down":
        return `translateY(${translateValue}px)`;
      case "up":
        return `translateY(${-translateValue}px)`;
      case "left":
        return `translateX(${-translateValue}px)`;
      case "right":
        return `translateX(${translateValue}px)`;
    }
  };

  return (
    <>
      {React.Children.map(children, (child, index) => {
        const itemDelay = delay + index * staggerDelay;

        const opacity = interpolate(
          frame,
          [itemDelay, itemDelay + 15],
          [0, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }
        );

        const translate = interpolate(
          frame,
          [itemDelay, itemDelay + 15],
          [20, 0],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          }
        );

        return (
          <div
            style={{
              opacity,
              transform: getTransform(translate),
            }}
          >
            {child}
          </div>
        );
      })}
    </>
  );
};

/**
 * Crossfade Component
 *
 * Crossfades between two elements.
 */
interface CrossfadeProps {
  /** Element to fade out */
  from: React.ReactNode;
  /** Element to fade in */
  to: React.ReactNode;
  /** Frame at which crossfade begins */
  startFrame: number;
  /** Duration of crossfade in frames */
  duration?: number;
}

export const Crossfade: React.FC<CrossfadeProps> = ({
  from,
  to,
  startFrame,
  duration = 15,
}) => {
  const frame = useCurrentFrame();

  const fromOpacity = interpolate(
    frame,
    [startFrame, startFrame + duration],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const toOpacity = interpolate(
    frame,
    [startFrame, startFrame + duration],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (
    <div style={{ position: "relative" }}>
      <div style={{ opacity: fromOpacity }}>{from}</div>
      <div style={{ position: "absolute", top: 0, left: 0, opacity: toOpacity }}>
        {to}
      </div>
    </div>
  );
};

export default SectionFade;
