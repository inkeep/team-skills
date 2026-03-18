/**
 * ScrollableContent Component
 *
 * Simulates scrolling through content inside a clipped container.
 * Use with a tall screenshot to show a product page scrolling.
 *
 * Usage:
 * ```tsx
 * <ScrollableContent
 *   src={staticFile("images/product-full-page.png")}
 *   scrollDistance={800}
 *   delay={30}
 *   duration={120}
 *   width={1000}
 *   height={600}
 * />
 * ```
 */

import React from "react";
import { useCurrentFrame, interpolate, Easing, Img } from "remotion";

interface ScrollableContentProps {
  /** Image source — should be taller than the viewport height */
  src: string;
  /** How far to scroll in pixels */
  scrollDistance: number;
  /** Delay in frames before scrolling starts */
  delay?: number;
  /** Duration of the scroll animation in frames */
  duration?: number;
  /** Viewport width */
  width?: number;
  /** Viewport height */
  height?: number;
  /** Additional container styles */
  style?: React.CSSProperties;
}

export const ScrollableContent: React.FC<ScrollableContentProps> = ({
  src,
  scrollDistance,
  delay = 0,
  duration = 120,
  width = 1000,
  height = 600,
  style = {},
}) => {
  const frame = useCurrentFrame();

  const scrollY = interpolate(
    frame,
    [delay, delay + duration],
    [0, -scrollDistance],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    }
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
          position: "absolute",
          top: 0,
          left: 0,
          transform: `translateY(${scrollY}px)`,
        }}
      />
    </div>
  );
};

export default ScrollableContent;
