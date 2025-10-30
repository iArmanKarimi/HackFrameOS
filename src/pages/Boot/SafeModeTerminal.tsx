import React, { useState } from "react";

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

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const output = runCommand(input);
    setHistory((prev) => [...prev, `> ${input}`, output]);
    setInput("");
  };

  return (
    <div
      style={{
        backgroundColor: "#0d0d0d",
        color: "#00ff66",
        fontFamily: "JetBrains Mono, monospace",
        padding: "1rem",
        height: "100vh",
        overflowY: "auto",
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
