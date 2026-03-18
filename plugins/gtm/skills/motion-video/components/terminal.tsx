/**
 * Terminal Component
 *
 * Terminal window mockup with animated command typing and output reveal.
 * Adapted from chuk-motion (IBM) for Inkeep brand.
 *
 * Usage:
 * ```tsx
 * <Terminal
 *   commands={[
 *     { command: "pnpm install @inkeep/agent-sdk", output: "added 42 packages" },
 *     { command: "pnpm dev", output: "Server running on localhost:3000" },
 *   ]}
 *   delay={0}
 * />
 * ```
 */

import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { COLORS, FONTS, SPACING, RADIUS } from "../styles/brand";

interface CommandBlock {
  command: string;
  output?: string;
}

interface TerminalProps {
  /** Array of commands to type and execute sequentially */
  commands: CommandBlock[];
  /** Delay in frames before entrance animation */
  delay?: number;
  /** Terminal title */
  title?: string;
  /** Prompt character */
  prompt?: string;
  /** Typing speed in characters per frame */
  typeSpeed?: number;
  /** Frames to pause between command and output */
  outputDelay?: number;
  /** Frames to pause between commands */
  commandGap?: number;
  /** Width of the terminal */
  width?: number;
  /** Height of the terminal */
  height?: number;
  /** Show blinking cursor */
  showCursor?: boolean;
  /** Additional container styles */
  style?: React.CSSProperties;
}

export const Terminal: React.FC<TerminalProps> = ({
  commands,
  delay = 0,
  title = "Terminal",
  prompt = "$ ",
  typeSpeed = 1.5,
  outputDelay = 5,
  commandGap = 30,
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

  // Calculate timing for sequential commands
  const adjustedFrame = frame - delay - 20; // 20 frames after entrance
  const dotColors = ["#ff5f57", "#ffbd2e", "#28c840"];

  // Build command timeline
  let currentFrame = 0;
  const commandStates: Array<{
    typedChars: number;
    showOutput: boolean;
    commandText: string;
    outputText: string;
  }> = [];

  for (const cmd of commands) {
    const typeFrames = Math.ceil(cmd.command.length / typeSpeed);
    const totalCommandFrames = typeFrames + outputDelay + commandGap;

    const typedChars =
      adjustedFrame >= currentFrame
        ? Math.min(
            cmd.command.length,
            Math.floor((adjustedFrame - currentFrame) * typeSpeed)
          )
        : 0;

    const showOutput =
      adjustedFrame >= currentFrame + typeFrames + outputDelay;

    commandStates.push({
      typedChars,
      showOutput,
      commandText: cmd.command,
      outputText: cmd.output || "",
    });

    currentFrame += totalCommandFrames;
  }

  // Cursor blink
  const cursorVisible =
    showCursor && Math.floor(adjustedFrame / 15) % 2 === 0;

  // Find which command is currently being typed
  let cursorCommandIndex = commandStates.length - 1;
  for (let i = 0; i < commandStates.length; i++) {
    if (commandStates[i].typedChars < commandStates[i].commandText.length) {
      cursorCommandIndex = i;
      break;
    }
  }

  return (
    <div
      style={{
        width,
        height,
        borderRadius: RADIUS.lg,
        overflow: "hidden",
        backgroundColor: "#1a1a1a",
        transform: `scale(${scale})`,
        opacity,
        boxShadow:
          "0 24px 48px rgba(0, 0, 0, 0.2), 0 8px 16px rgba(0, 0, 0, 0.1)",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      {/* Title bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: `${SPACING.sm}px ${SPACING.md}px`,
          backgroundColor: "#2a2a2a",
          borderBottom: "1px solid #333",
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
            flex: 1,
            textAlign: "center",
            fontFamily: FONTS.primary,
            fontSize: 12,
            color: "#999",
          }}
        >
          {title}
        </div>
      </div>

      {/* Terminal content */}
      <div
        style={{
          flex: 1,
          padding: SPACING.md,
          fontFamily: FONTS.mono,
          fontSize: 14,
          lineHeight: 1.6,
          color: "#e0e0e0",
          overflow: "hidden",
        }}
      >
        {commandStates.map((cmd, i) => {
          if (cmd.typedChars === 0 && i > 0) return null;
          const isCurrentCommand = i === cursorCommandIndex;
          const typed = cmd.commandText.slice(0, cmd.typedChars);

          return (
            <React.Fragment key={i}>
              {/* Command line */}
              <div>
                <span style={{ color: COLORS.primary }}>{prompt}</span>
                <span>{typed}</span>
                {isCurrentCommand &&
                  cursorVisible &&
                  cmd.typedChars < cmd.commandText.length && (
                    <span
                      style={{
                        backgroundColor: "#e0e0e0",
                        width: 8,
                        height: 16,
                        display: "inline-block",
                      }}
                    />
                  )}
              </div>

              {/* Output */}
              {cmd.showOutput && cmd.outputText && (
                <div style={{ color: "#999", marginBottom: SPACING.sm }}>
                  {cmd.outputText}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default Terminal;
