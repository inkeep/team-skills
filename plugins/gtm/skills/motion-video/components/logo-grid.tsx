/**
 * Logo Grid Component
 *
 * Displays a grid of logos with staggered reveal animation.
 * Matches the "Trusted by" section on the Inkeep website.
 *
 * Usage:
 * ```tsx
 * <LogoGrid
 *   logos={[
 *     { src: "images/logos/anthropic.svg", alt: "Anthropic" },
 *     { src: "images/logos/postman.svg", alt: "Postman" },
 *   ]}
 * />
 * ```
 */

import React from "react";
import { useCurrentFrame, interpolate, Easing, Img, staticFile } from "remotion";

// Inkeep brand colors
const COLORS = {
  text: "#231f20",
  primary: "#3784ff",
};

interface Logo {
  /** Path to logo image (relative to public/) */
  src: string;
  /** Alt text for accessibility */
  alt: string;
}

interface LogoGridProps {
  /** Array of logos to display */
  logos: Logo[];
  /** Delay in frames before animation starts */
  delay?: number;
  /** Stagger delay between each logo in frames (default: 6 = 0.2s) */
  staggerDelay?: number;
  /** Number of columns in the grid */
  columns?: number;
  /** Gap between logos in pixels */
  gap?: number;
  /** Logo height in pixels */
  logoHeight?: number;
  /** Apply grayscale filter to logos */
  grayscale?: boolean;
  /** Show title above grid */
  showTitle?: boolean;
  /** Title text */
  title?: string;
  /** Additional styles */
  style?: React.CSSProperties;
}

export const LogoGrid: React.FC<LogoGridProps> = ({
  logos,
  delay = 0,
  staggerDelay = 6,
  columns = 4,
  gap = 32,
  logoHeight = 28,
  grayscale = true,
  showTitle = false,
  title = "Trusted by leading companies",
  style = {},
}) => {
  const frame = useCurrentFrame();

  // Title animation
  const titleOpacity = interpolate(
    frame,
    [delay, delay + 15],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const titleTranslateY = interpolate(
    frame,
    [delay, delay + 15],
    [10, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }
  );

  // Calculate title delay offset
  const logoStartDelay = showTitle ? delay + 15 : delay;

  return (
    <div style={style}>
      {showTitle && (
        <div
          style={{
            fontFamily: "Neue Haas Grotesk Display Pro, Arial, Helvetica, sans-serif",
            fontSize: 14,
            fontWeight: 500,
            color: COLORS.primary,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 24,
            opacity: titleOpacity,
            transform: `translateY(${titleTranslateY}px)`,
          }}
        >
          {title}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap,
          alignItems: "center",
        }}
      >
        {logos.map((logo, index) => {
          const itemDelay = logoStartDelay + index * staggerDelay;

          const opacity = interpolate(
            frame,
            [itemDelay, itemDelay + 15],
            [0, grayscale ? 0.75 : 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }
          );

          const translateY = interpolate(
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
              key={logo.alt}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity,
                transform: `translateY(${translateY}px)`,
              }}
            >
              <Img
                src={staticFile(logo.src)}
                style={{
                  height: logoHeight,
                  width: "auto",
                  filter: grayscale
                    ? "grayscale(100%) brightness(0.82) contrast(1.1)"
                    : "none",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Trusted Logos Component
 *
 * Pre-configured component with Inkeep's trusted customer logos.
 * Uses the actual logo order and styling from the website.
 */
export const TrustedLogos: React.FC<Omit<LogoGridProps, "logos">> = (props) => {
  // Default Inkeep trusted logos (paths relative to public/)
  const defaultLogos: Logo[] = [
    { src: "images/trusted-logos/anthropic.svg", alt: "Anthropic" },
    { src: "images/trusted-logos/postman.svg", alt: "Postman" },
    { src: "images/trusted-logos/midjourney.svg", alt: "Midjourney" },
    { src: "images/trusted-logos/pinecone.svg", alt: "Pinecone" },
    { src: "images/trusted-logos/posthog.svg", alt: "PostHog" },
    { src: "images/trusted-logos/clay.svg", alt: "Clay" },
    { src: "images/trusted-logos/render.svg", alt: "Render" },
    { src: "images/trusted-logos/solana.svg", alt: "Solana" },
  ];

  return (
    <LogoGrid
      logos={defaultLogos}
      columns={4}
      showTitle
      title="Trusted by leading companies"
      {...props}
    />
  );
};

/**
 * Single Logo Reveal Component
 *
 * Animates a single logo with fade-up effect.
 */
interface SingleLogoProps {
  src: string;
  alt: string;
  delay?: number;
  height?: number;
  grayscale?: boolean;
}

export const SingleLogo: React.FC<SingleLogoProps> = ({
  src,
  alt,
  delay = 0,
  height = 40,
  grayscale = false,
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [delay, delay + 15],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

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

  return (
    <Img
      src={staticFile(src)}
      style={{
        height,
        width: "auto",
        opacity,
        transform: `translateY(${translateY}px)`,
        filter: grayscale
          ? "grayscale(100%) brightness(0.82) contrast(1.1)"
          : "none",
      }}
    />
  );
};

export default LogoGrid;
