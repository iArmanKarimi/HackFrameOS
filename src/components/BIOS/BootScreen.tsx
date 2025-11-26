import React, { useEffect, useState, useRef, useMemo } from "react";
import { BOOT_LOG } from "./SafeModeCore";

// Interval (in ms) between revealing each boot log line.
const BOOT_LINE_INTERVAL_MS = 60;

/**
 * BootScreen Component
 * --------------------
 * Displays a cinematic boot sequence by scrolling through BOOT_LOG line by line.
 * Once all lines are displayed, it optionally calls `onComplete` to signal that
 * the boot process has finished (so the parent can transition to SafeModeTerminal or main UI).
 */
export const BootScreen: React.FC<{
  onComplete: () => void;
}> = ({ onComplete }) => {
  const lines = useMemo(() => BOOT_LOG.split("\n"), []);
  /**
   * `index` tracks how many lines should currently be visible.
   * We slice the array up to this index to render progressively.
   */
  const [index, setIndex] = useState(0);

  /**
   * Ref to the container div so we can auto-scroll as new lines appear.
   */
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Effect: reveal one new line at a time.
   * - Stops once all lines are shown.
   */
  useEffect(() => {
    if (index >= lines.length) {
      return;
    }

    const timer = setTimeout(() => {
      setIndex((prev) => prev + 1); // reveal next line
    }, BOOT_LINE_INTERVAL_MS);

    return () => clearTimeout(timer); // cleanup on unmount or re-render
  }, [index, lines.length]);

  /**
   * Effect: once all lines are visible, wait briefly then notify the parent
   * via `onComplete` so it can transition to the SafeMode terminal.
   * - `onComplete` is a dependency here so the latest callback is always used.
   */
  useEffect(() => {
    if (index < lines.length) {
      return;
    }

    const completionTimer = setTimeout(() => onComplete(), 800); // cinematic pause before handoff
    return () => clearTimeout(completionTimer);
  }, [index, lines.length, onComplete]);

  /**
   * Effect: auto-scroll to bottom whenever a new line is added.
   * This ensures the latest boot log entry is always visible.
   */
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [index]);

  /**
   * Render:
   * - A styled container with retro terminal aesthetics.
   * - Only render lines up to the current index.
   */
  return (
    <div
      ref={containerRef}
      style={{
        backgroundColor: "#0d0d0d", // black background
        color: "#00ff66", // green text
        fontFamily: "JetBrains Mono, monospace", // retro monospace font
        padding: "1rem",
        height: "100vh",
        overflowY: "auto", // scroll if log exceeds viewport
      }}
    >
      {lines.slice(0, index).map((line, idx) => (
        <pre key={idx} style={{ margin: 0 }}>
          {line}
        </pre>
      ))}
    </div>
  );
};
