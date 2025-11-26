import React, { useState, useRef, useEffect } from "react";

// --- Bring in your simulation logic ---
import {
  runCommand,
  HELP_TEXT,
  MODULE_LISTING,
  BOOT_BANNER,
} from "./SafeModeCore";

const SafeModeTerminal: React.FC = () => {
  const [history, setHistory] = useState<string[]>([
    BOOT_BANNER,
    HELP_TEXT,
    MODULE_LISTING,
  ]);
  const [input, setInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);

  // Ref for the scrollable container
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when history updates
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const output = runCommand(input);
    setHistory((prev) => [...prev, `> ${input}`, output]);
    setCommandHistory((prev) => [...prev, input]);
    setHistoryIndex(null);
    setInput("");
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
        fontSize: "12px",
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
              color: "#ffffff",
              lineHeight: "1.4",
            }}
          >
            {line}
          </pre>
        );
      })}

      <form onSubmit={handleCommand} style={{ marginTop: "0.5rem" }}>
        <span style={{ color: "#ffffff" }}>safemode@root:~$ </span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#ffffff",
            fontFamily: "inherit",
            fontSize: "inherit",
            width: "80%",
          }}
          autoFocus
        />
      </form>
    </div>
  );
};

export default SafeModeTerminal;
