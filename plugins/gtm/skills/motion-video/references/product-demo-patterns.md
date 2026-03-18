# Product demo video patterns

How to compose product demo components into a complete product walkthrough scene.

## Basic product walkthrough structure

```tsx
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { COLORS } from "../styles/brand";
import { BrowserFrame } from "../components/browser-frame";
import { CursorMove } from "../components/cursor-move";
import { ZoomInto } from "../components/zoom-into";
import { UIHighlight } from "../components/ui-highlight";
import { NotificationPopup } from "../components/notification-popup";
import { Img } from "remotion";

export const ProductWalkthrough: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.background }}>
      {/* Scene 1: Show the product in a browser (0-90 frames) */}
      <Sequence from={0} durationInFrames={90}>
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <BrowserFrame url="https://app.inkeep.com" delay={0} width={1000} height={650}>
            <Img src={staticFile("images/product/dashboard.png")} style={{ width: "100%", height: "100%" }} />
          </BrowserFrame>

          {/* Cursor clicks on a feature */}
          <CursorMove
            path={[
              { x: 500, y: 400, frame: 30 },
              { x: 750, y: 350, frame: 60, click: true },
            ]}
            delay={0}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Scene 2: Zoom into the feature (90-180 frames) */}
      <Sequence from={90} durationInFrames={90}>
        <ZoomInto
          src={staticFile("images/product/dashboard.png")}
          region={{ x: 600, y: 250, width: 400, height: 300 }}
          zoomLevel={2.5}
          delay={0}
          duration={30}
          holdDuration={60}
        />

        {/* Highlight the key UI element */}
        <UIHighlight x={700} y={300} width={200} height={40} delay={30} pulseCount={2} />
      </Sequence>

      {/* Scene 3: Show success notification (180-240 frames) */}
      <Sequence from={180} durationInFrames={60}>
        <NotificationPopup
          title="Agent deployed"
          message="Your support Agent is now live"
          position="top-right"
          delay={10}
          duration={50}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
```

## Component composition patterns

### Browser with cursor interaction
Layer `CursorMove` on top of `BrowserFrame` in the same `AbsoluteFill`. The cursor coordinates are relative to the composition, not the browser frame.

### Zoom with highlight
Use `ZoomInto` first to focus on a region, then layer `UIHighlight` on top with a delay matching the zoom duration. The highlight coordinates should be relative to the zoomed view.

### Terminal then code editor
Show `Terminal` running an install command, then transition to `TypingCode` showing the integration code. Use `<Sequence>` to control timing.

### Multi-panel comparison
Use `MultiPanelLayout` with screenshots inside each panel. Add stagger delay for a polished entrance.

## Recommended packages for polish

See the **Recommended packages** table in SKILL.md for the full list of optional packages (`@remotion/sfx`, `@remotion/light-leaks`, `@remotion/motion-blur`, `remotion-bits`, etc.).
