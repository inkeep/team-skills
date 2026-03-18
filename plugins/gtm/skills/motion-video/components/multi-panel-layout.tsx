/**
 * MultiPanelLayout Component
 *
 * Split-screen layout with staggered entrance animations.
 * Use for before/after comparisons, side-by-side features, or multi-step flows.
 *
 * Usage:
 * ```tsx
 * <MultiPanelLayout direction="horizontal" gap={24} staggerDelay={10} delay={0}>
 *   <Img src={staticFile("images/before.png")} style={{ width: "100%", height: "100%" }} />
 *   <Img src={staticFile("images/after.png")} style={{ width: "100%", height: "100%" }} />
 * </MultiPanelLayout>
 * ```
 */

import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { SPACING } from "../styles/brand";

interface MultiPanelLayoutProps {
  children: React.ReactNode;
  /** Layout direction */
  direction?: "horizontal" | "vertical";
  /** Gap between panels in pixels */
  gap?: number;
  /** Delay between each panel's entrance in frames */
  staggerDelay?: number;
  /** Initial delay before first panel appears */
  delay?: number;
  /** Width of the layout container */
  width?: number;
  /** Height of the layout container */
  height?: number;
  /** Additional container styles */
  style?: React.CSSProperties;
}

export const MultiPanelLayout: React.FC<MultiPanelLayoutProps> = ({
  children,
  direction = "horizontal",
  gap = SPACING.lg,
  staggerDelay = 10,
  delay = 0,
  width,
  height,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const panels = React.Children.toArray(children);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: direction === "horizontal" ? "row" : "column",
        gap,
        width,
        height,
        ...style,
      }}
    >
      {panels.map((panel, index) => {
        const panelDelay = delay + index * staggerDelay;

        const entrance = spring({
          frame: frame - panelDelay,
          fps,
          config: { damping: 20, stiffness: 200 },
        });

        const opacity = interpolate(entrance, [0, 1], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const translateY = interpolate(entrance, [0, 1], [30, 0]);
        const scale = interpolate(entrance, [0, 1], [0.95, 1]);

        return (
          <div
            key={index}
            style={{
              flex: 1,
              opacity,
              transform: `translateY(${translateY}px) scale(${scale})`,
              overflow: "hidden",
            }}
          >
            {panel}
          </div>
        );
      })}
    </div>
  );
};

export default MultiPanelLayout;
