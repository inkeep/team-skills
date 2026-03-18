/**
 * TypingCode Component
 *
 * Animated code editor with character-by-character typing reveal.
 * Adapted from chuk-motion (IBM) for Inkeep brand.
 *
 * Usage:
 * ```tsx
 * <TypingCode
 *   code={`import { InkeepAgent } from "@inkeep/agent-sdk";\n\nconst agent = new InkeepAgent({ apiKey: "..." });`}
 *   title="agent.ts"
 *   delay={0}
 * />
 * ```
 */

import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { COLORS, FONTS, SPACING, RADIUS } from "../styles/brand";

interface TypingCodeProps {
  /** Code string to type out */
  code: string;
  /** Filename shown in the editor tab */
  title?: string;
  /** Delay in frames before entrance animation */
  delay?: number;
  /** Characters revealed per frame */
  typeSpeed?: number;
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Width of the editor */
  width?: number;
  /** Height of the editor */
  height?: number;
  /** Show blinking cursor */
  showCursor?: boolean;
  /** Additional container styles */
  style?: React.CSSProperties;
}

export const TypingCode: React.FC<TypingCodeProps> = ({
  code,
  title = "index.ts",
  delay = 0,
  typeSpeed = 1.5,
  showLineNumbers = true,
  width = 800,
  height = 500,
  showCursor = true,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

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

  // Typing progress
  const adjustedFrame = frame - delay - 15; // Start typing after entrance
  const charsToShow = Math.max(
    0,
    Math.min(code.length, Math.floor(adjustedFrame * typeSpeed))
  );
  const visibleCode = code.slice(0, charsToShow);
  const lines = visibleCode.split("\n");
  const totalLines = code.split("\n").length;

  // Cursor blink
  const cursorVisible =
    showCursor && Math.floor(adjustedFrame / 15) % 2 === 0;
  const isTyping = charsToShow < code.length;

  const dotColors = ["#ff5f57", "#ffbd2e", "#28c840"];

  return (
    <div
      style={{
        width,
        height,
        borderRadius: RADIUS.lg,
        overflow: "hidden",
        backgroundColor: "#1e1e2e",
        transform: `scale(${scale})`,
        opacity,
        boxShadow:
          "0 24px 48px rgba(0, 0, 0, 0.2), 0 8px 16px rgba(0, 0, 0, 0.1)",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      {/* Editor tab bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          backgroundColor: "#181825",
          borderBottom: "1px solid #313244",
          padding: `${SPACING.xs}px ${SPACING.md}px`,
          gap: SPACING.sm,
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          {dotColors.map((color, i) => (
            <div
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: color,
              }}
            />
          ))}
        </div>
        <div
          style={{
            padding: `${SPACING.xs}px ${SPACING.sm}px`,
            fontSize: 12,
            fontFamily: FONTS.mono,
            color: "#cdd6f4",
            backgroundColor: "#1e1e2e",
            borderRadius: `${RADIUS.sm}px ${RADIUS.sm}px 0 0`,
            borderBottom: `2px solid ${COLORS.primary}`,
          }}
        >
          {title}
        </div>
      </div>

      {/* Code area */}
      <div
        style={{
          flex: 1,
          padding: SPACING.md,
          fontFamily: FONTS.mono,
          fontSize: 14,
          lineHeight: 1.7,
          display: "flex",
          overflow: "hidden",
        }}
      >
        {/* Line numbers */}
        {showLineNumbers && (
          <div
            style={{
              paddingRight: SPACING.md,
              marginRight: SPACING.md,
              borderRight: "1px solid #313244",
              color: "#585b70",
              textAlign: "right",
              userSelect: "none",
              minWidth: 32,
            }}
          >
            {Array.from({ length: totalLines }, (_, i) => (
              <div key={i} style={{ opacity: i < lines.length ? 1 : 0.3 }}>
                {i + 1}
              </div>
            ))}
          </div>
        )}

        {/* Code content */}
        <div style={{ flex: 1 }}>
          <pre
            style={{
              margin: 0,
              color: "#cdd6f4",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {visibleCode}
            {isTyping && cursorVisible && (
              <span
                style={{
                  backgroundColor: "#cdd6f4",
                  width: 8,
                  height: 16,
                  display: "inline-block",
                }}
              />
            )}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default TypingCode;
