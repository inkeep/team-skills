/**
 * Badge Pill Component
 *
 * Animated pill badge with rotating logo, matching Inkeep website hero badges.
 * Features scale entrance, logo spin, and optional text rotation.
 *
 * Usage:
 * ```tsx
 * <BadgePill text="State of AI for CX: Agents, MCPs, and RAG" />
 * ```
 */

import React from "react";
import { useCurrentFrame, interpolate, Easing, Img, staticFile } from "remotion";

// Inkeep brand colors
const COLORS = {
  text: "#231f20",
  background: "rgba(255, 255, 255, 0.7)",
};

// Inkeep fonts
const FONTS = {
  serif: "Noto Serif, Georgia, serif",
};

interface BadgePillProps {
  /** Badge text */
  text: string;
  /** Delay in frames before animation starts */
  delay?: number;
  /** Logo image path (default: Inkeep blue logo) */
  logoSrc?: string;
  /** Show logo spin animation */
  showLogoSpin?: boolean;
  /** Additional styles */
  style?: React.CSSProperties;
}

export const BadgePill: React.FC<BadgePillProps> = ({
  text,
  delay = 0,
  logoSrc = "images/logos/inkeep-logo-blue.svg",
  showLogoSpin = true,
  style = {},
}) => {
  const frame = useCurrentFrame();

  // Scale entrance (0.8 → 1)
  const scale = interpolate(
    frame,
    [delay, delay + 15],
    [0.8, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }
  );

  // Opacity fade in
  const opacity = interpolate(
    frame,
    [delay, delay + 15],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Y translate
  const translateY = interpolate(
    frame,
    [delay, delay + 15],
    [20, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }
  );

  // Logo spin (360° over 1s = 30 frames)
  const logoRotation = showLogoSpin
    ? interpolate(
        frame,
        [delay + 15, delay + 45],
        [0, 360],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }
      )
    : 0;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 12px 4px 8px",
        backgroundColor: COLORS.background,
        borderRadius: 60,
        opacity,
        transform: `scale(${scale}) translateY(${translateY}px)`,
        ...style,
      }}
    >
      {/* Logo */}
      <Img
        src={staticFile(logoSrc)}
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          transform: `rotate(${logoRotation}deg)`,
        }}
      />

      {/* Text */}
      <span
        style={{
          fontFamily: FONTS.serif,
          fontSize: 20,
          fontWeight: 300,
          color: COLORS.text,
          lineHeight: 1.25,
          letterSpacing: "-0.4px",
        }}
      >
        {text}
      </span>

      {/* Arrow icon */}
      <svg
        style={{
          height: 12,
          width: 9,
          color: COLORS.text,
          opacity: 0.8,
          marginLeft: 3,
        }}
        viewBox="0 0 13 13"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M5.81003 6.51627C5.93493 6.46523 5.9774 6.34525 6.00241 6.20428L5.97981 6.22744C5.99531 6.01591 5.94673 5.7629 6.12455 5.62332C6.41628 5.39002 6.69821 5.52899 6.91743 5.12614C7.11331 4.76476 7.50955 4.53532 7.63883 4.32271C7.65571 4.29457 7.66797 4.26651 7.67464 4.23798C7.73584 3.98932 8.026 4.24511 8.18182 3.9801C8.34166 3.71497 8.5102 3.63691 8.78219 3.56849C9.05412 3.50054 9.70466 3.08888 9.81145 2.78978C9.91725 2.4933 10.3313 2.48578 10.5155 2.40658C10.5721 2.38259 10.6251 2.37156 10.6709 2.36841C10.6904 2.36709 10.7124 2.38095 10.7289 2.39935C10.7289 2.39936 10.7289 2.39937 10.7289 2.39939C10.7495 2.42229 10.7614 2.45222 10.7494 2.46829C10.6908 2.54611 10.6197 2.67643 10.5672 2.87173C10.4701 3.23457 10.2934 3.08423 10.0436 3.44134C9.79376 3.79788 9.7361 4.12466 9.27672 4.33826C8.85345 4.54061 9.08162 4.9755 8.60159 5.20979C8.56275 5.22977 8.51893 5.24939 8.46922 5.26886C7.79032 5.55822 8.23841 5.99618 7.86905 6.60685C7.71061 6.86711 7.45721 7.12208 7.1763 7.34313L7.14667 7.37348C6.78993 7.61641 6.43278 7.82096 6.27199 8.00388C5.99565 8.31807 5.65059 8.76449 5.17707 9.13074C4.70399 9.49626 4.33419 10.1617 3.77266 10.5308C3.21161 10.9 2.42849 11.4378 2.03914 11.6547C1.64831 11.8734 1.55657 11.9262 1.30937 12.2685C1.16802 12.4641 0.899115 12.6647 0.588701 12.7361C0.433732 12.7705 0.383963 12.6687 0.451316 12.5369C0.549057 12.3443 0.705644 12.2666 0.68752 12.0958C0.651629 11.7538 0.639883 11.6201 0.939454 11.5498C1.23795 11.4799 1.07426 11.1343 1.21152 11.0565C1.34965 10.9771 1.49883 11.1316 1.93542 10.4582C2.37052 9.78475 2.64199 9.44673 2.82275 9.20651C3.00336 8.96616 3.57179 8.64982 3.86609 8.25613C4.16055 7.86138 4.90254 7.20051 5.1103 6.84071C5.31775 6.48055 5.48632 6.6488 5.81003 6.51627Z"
          fill="currentColor"
        />
        <path
          d="M11.913 2.72774C11.8184 3.15631 12.4227 3.46676 12.3388 4.00147C12.2485 4.52792 11.9349 4.58807 11.9639 5.17466C11.9891 5.76555 11.6984 6.3143 11.7873 6.58572C11.8753 6.86009 11.4892 6.82696 11.5132 7.19682C11.5357 7.5672 11.4434 7.77722 11.2593 8.05771C11.2178 8.12203 11.171 8.21701 11.1245 8.32784L11.1282 8.30541C10.9924 8.69183 10.9273 9.32555 11.0429 9.59432C11.1892 9.9391 10.9203 10.3305 10.8565 10.5695C10.8366 10.6437 10.8095 10.7021 10.7812 10.7469C10.7693 10.7659 10.7442 10.7747 10.7195 10.7747C10.7195 10.7747 10.7195 10.7747 10.7195 10.7747C10.6887 10.7747 10.6584 10.7611 10.6545 10.7367C10.6357 10.6182 10.5857 10.4415 10.4751 10.231C10.2703 9.83682 10.4972 9.7976 10.4083 9.26043C10.3469 8.86891 10.2321 8.57649 10.2643 8.19558L10.271 8.15496C10.292 8.02326 10.3322 7.88233 10.4019 7.72419C10.6522 7.14752 10.114 6.91538 10.5576 6.12656C10.9882 5.32187 10.3973 5.16109 10.3528 4.34937C10.3087 3.54141 10.5504 2.5109 10.4224 2.03627C10.3977 1.93753 10.368 1.83262 10.3346 1.72349L11.354 2.28596C10.7519 2.50364 10.2315 2.59274 9.61242 2.61773C8.84776 2.6391 7.93858 2.93163 7.09702 2.85548C6.25621 2.78182 5.07769 2.66771 4.53381 2.56816C3.98977 2.46955 3.85914 2.44663 3.34204 2.53321C3.04469 2.58259 2.63221 2.5488 2.28483 2.39368C2.11114 2.31551 2.15074 2.20646 2.32461 2.15382C2.58042 2.0766 2.78926 2.12483 2.91862 1.98644C3.17621 1.70956 3.28273 1.60297 3.61681 1.75263C3.95176 1.90173 4.09494 1.53542 4.28785 1.56954C4.48091 1.6022 4.48799 1.82033 5.45675 1.60376C6.42341 1.38374 6.95066 1.29641 7.3148 1.22659C7.67787 1.15681 8.4634 1.26836 9.04773 1.12935C9.49726 1.02153 10.4722 0.919531 10.8235 0.755562L11.576 0.398889L11.9121 1.35624C11.9569 1.50222 11.9975 1.62984 12.0371 1.7281C12.24 2.25012 12.0001 2.29111 11.913 2.72774Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
};

/**
 * Rotating Badge Component
 *
 * Badge with multiple text items that rotate on an interval.
 * For Remotion, you control the rotation via frame-based logic.
 */
interface RotatingBadgeProps {
  /** Array of text items to rotate through */
  items: string[];
  /** Frames between each rotation (default: 240 = 8 seconds at 30fps) */
  intervalFrames?: number;
  /** Animation delay in frames */
  delay?: number;
}

export const RotatingBadge: React.FC<RotatingBadgeProps> = ({
  items,
  intervalFrames = 240,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const adjustedFrame = Math.max(0, frame - delay);

  // Calculate which item to show
  const currentIndex = Math.floor(adjustedFrame / intervalFrames) % items.length;
  const frameInCycle = adjustedFrame % intervalFrames;

  // Fade in/out for text transitions
  const textOpacity = interpolate(
    frameInCycle,
    [0, 15, intervalFrames - 15, intervalFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const textY = interpolate(
    frameInCycle,
    [0, 15, intervalFrames - 15, intervalFrames],
    [8, 0, 0, -8],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <BadgePill
      text={items[currentIndex]}
      delay={delay}
      style={{
        // Override text opacity for rotation effect
      }}
    />
  );
};

export default BadgePill;
