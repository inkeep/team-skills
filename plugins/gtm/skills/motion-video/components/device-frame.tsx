/**
 * DeviceFrame Component
 *
 * Renders a phone, tablet, or laptop device mockup with content inside.
 * Adapted from chuk-motion (IBM) for Inkeep brand.
 *
 * Usage:
 * ```tsx
 * <DeviceFrame device="phone" delay={0}>
 *   <Img src={staticFile("images/app-screenshot.png")} style={{ width: "100%", height: "100%" }} />
 * </DeviceFrame>
 * ```
 */

import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { COLORS, RADIUS } from "../styles/brand";

type DeviceType = "phone" | "tablet" | "laptop";

const DEVICE_DIMENSIONS: Record<
  DeviceType,
  { width: number; height: number; bezel: number; radius: number }
> = {
  phone: { width: 375, height: 812, bezel: 12, radius: 40 },
  tablet: { width: 768, height: 1024, bezel: 16, radius: 24 },
  laptop: { width: 900, height: 560, bezel: 8, radius: 12 },
};

interface DeviceFrameProps {
  children?: React.ReactNode;
  /** Device type */
  device?: DeviceType;
  /** Delay in frames before entrance animation */
  delay?: number;
  /** Scale factor */
  scale?: number;
  /** Show drop shadow */
  shadow?: boolean;
  /** Show screen glare overlay */
  glare?: boolean;
  /** Additional container styles */
  style?: React.CSSProperties;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  children,
  device = "phone",
  delay = 0,
  scale: userScale = 1,
  shadow = true,
  glare = true,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const dims = DEVICE_DIMENSIONS[device];

  // Entrance animation
  const entranceProgress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20, stiffness: 200 },
  });

  const animScale = interpolate(entranceProgress, [0, 1], [0.9, 1]);
  const opacity = interpolate(entranceProgress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const totalWidth = dims.width + dims.bezel * 2;
  const totalHeight = dims.height + dims.bezel * 2 + (device === "laptop" ? 24 : 0);

  return (
    <div
      style={{
        width: totalWidth * userScale,
        height: totalHeight * userScale,
        transform: `scale(${animScale})`,
        opacity,
        position: "relative",
        ...style,
      }}
    >
      {/* Device body */}
      <div
        style={{
          width: totalWidth * userScale,
          height: (dims.height + dims.bezel * 2) * userScale,
          borderRadius: dims.radius * userScale,
          background: "linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%)",
          padding: dims.bezel * userScale,
          boxShadow: shadow
            ? "0 24px 48px rgba(0, 0, 0, 0.2), 0 8px 16px rgba(0, 0, 0, 0.1)"
            : "none",
          position: "relative",
        }}
      >
        {/* Notch (phone only) */}
        {device === "phone" && (
          <div
            style={{
              position: "absolute",
              top: dims.bezel * userScale * 0.4,
              left: "50%",
              transform: "translateX(-50%)",
              width: 100 * userScale,
              height: 24 * userScale,
              backgroundColor: "#1a1a1a",
              borderRadius: 12 * userScale,
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8 * userScale,
            }}
          >
            <div
              style={{
                width: 8 * userScale,
                height: 8 * userScale,
                borderRadius: "50%",
                backgroundColor: "#333",
              }}
            />
          </div>
        )}

        {/* Camera dot (laptop/tablet) */}
        {device !== "phone" && (
          <div
            style={{
              position: "absolute",
              top: (dims.bezel * userScale) / 2 - 3 * userScale,
              left: "50%",
              transform: "translateX(-50%)",
              width: 6 * userScale,
              height: 6 * userScale,
              borderRadius: "50%",
              backgroundColor: "#444",
              zIndex: 2,
            }}
          />
        )}

        {/* Screen */}
        <div
          style={{
            width: dims.width * userScale,
            height: dims.height * userScale,
            borderRadius: (dims.radius - dims.bezel) * userScale,
            overflow: "hidden",
            position: "relative",
            backgroundColor: "#000",
          }}
        >
          {children}

          {/* Screen glare */}
          {glare && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)",
                pointerEvents: "none",
              }}
            />
          )}
        </div>
      </div>

      {/* Keyboard base (laptop only) */}
      {device === "laptop" && (
        <div
          style={{
            width: totalWidth * userScale * 1.08,
            height: 24 * userScale,
            backgroundColor: "#2a2a2a",
            borderRadius: `0 0 ${4 * userScale}px ${4 * userScale}px`,
            marginLeft: -totalWidth * userScale * 0.04,
            boxShadow: shadow
              ? "0 4px 8px rgba(0, 0, 0, 0.15)"
              : "none",
          }}
        />
      )}
    </div>
  );
};

export default DeviceFrame;
