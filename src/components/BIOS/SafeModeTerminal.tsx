import React, { useState, useRef, useEffect } from "react";
import ansiEscapes from "ansi-escapes";

// --- Bring in your simulation logic ---
import {
  runCommand,
  HELP_TEXT,
  BOOT_BANNER,
} from "./SafeModeCore";

const SafeModeTerminal: React.FC<{
  onComplete?: () => void;
}> = ({ onComplete }) => {
  const [history, setHistory] = useState<string[]>([BOOT_BANNER]);
  const [input, setInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);

  // Ref for the scrollable container
  const containerRef = useRef<HTMLDivElement>(null);
  // Ref for the input to maintain focus
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when history updates
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history]);

  // Keep input focused at all times
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [history]); // Re-focus after each command

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const output = runCommand(input);
    const trimmedInput = input.trim();
    
    // Handle clear command - reset history instead of appending
    if (output === ansiEscapes.clearScreen) {
      setHistory([]);
      setCommandHistory((prev) => [...prev, trimmedInput]);
      setHistoryIndex(null);
      setInput("");
      return;
    }

    setHistory((prev) => [...prev, `> ${trimmedInput}`, output]);
    setCommandHistory((prev) => [...prev, trimmedInput]);
    setHistoryIndex(null);
    setInput("");

    // Check if startx was called and system is ready
    if (
      trimmedInput === "startx" &&
      output.includes("Transitioning to desktop")
    ) {
      // Small delay for cinematic effect before transitioning
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 1000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      setHistoryIndex((current) => {
        const nextIndex =
          current === null
            ? commandHistory.length - 1
            : Math.max(0, current - 1);
        setInput(commandHistory[nextIndex] ?? "");
        return nextIndex;
      });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      setHistoryIndex((current) => {
        if (current === null) return null;
        const nextIndex = current + 1;
        if (nextIndex >= commandHistory.length) {
          setInput("");
          return null;
        }
        setInput(commandHistory[nextIndex] ?? "");
        return nextIndex;
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 hide-scrollbar"
      style={{
        backgroundColor: "#0d0d0d",
        color: "#FFFFFF",
        fontFamily: "VT323, monospace",
        fontSize: "16px",
        padding: "1rem",
        overflowY: "auto",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {history.map((line, idx) => {
        return (
          <pre
            key={idx}
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              overflowWrap: "break-word",
              color: "#ffffff",
              lineHeight: "1.4",
              fontFamily: "VT323, monospace",
              fontSize: "16px",
            }}
          >
            {line}
          </pre>
        );
      })}

      <form onSubmit={handleCommand} style={{ marginTop: "0.5rem" }}>
        <span
          style={{
            color: "#ffffff",
            fontFamily: "VT323, monospace",
            fontSize: "16px",
          }}
        >
          safemode@root:~${" "}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={(e) => {
            // Immediately refocus if input loses focus
            e.target.focus();
          }}
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#ffffff",
            fontFamily: "VT323, monospace",
            fontSize: "16px",
            width: "80%",
          }}
          autoFocus
        />
      </form>
    </div>
  );
};

export default SafeModeTerminal;
