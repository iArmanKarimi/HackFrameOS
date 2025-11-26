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
    setInput("");
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0"
      style={{
        backgroundColor: "#0d0d0d",
        color: "#FFFFFF",
        fontFamily: "VT323, monospace",
        padding: "1rem",
        scrollbarWidth: "none",
      }}
    >
      {history.map((line, idx) => (
        <pre key={idx} style={{ margin: 0, whiteSpace: "pre-wrap" }}>
          {line}
        </pre>
      ))}

      <form onSubmit={handleCommand} style={{ marginTop: "0.5rem" }}>
        <span style={{ color: "#00ff66" }}>safemode@root:~$ </span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#00ff66",
            fontFamily: "inherit",
            width: "80%",
          }}
          autoFocus
        />
      </form>
    </div>
  );
};

export default SafeModeTerminal;
