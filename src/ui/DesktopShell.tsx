import React from "react";

/**
 * DesktopShell Component
 * ----------------------
 * Main GUI that appears after SafeMode rehabilitation is complete.
 * Shows panels for logs, modules, and a terminal window.
 */
const DesktopShell: React.FC = () => {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#0d0d0d",
        color: "#ffffff",
        fontFamily: "VT323, monospace",
        fontSize: "16px",
        display: "flex",
        flexDirection: "column",
        padding: "1rem",
        gap: "1rem",
      }}
    >
      <div
        style={{
          border: "1px solid rgba(255, 255, 255, 0.2)",
          padding: "1rem",
        }}
      >
        <h2 style={{ margin: 0, marginBottom: "0.5rem" }}>
          HackFrameOS Desktop
        </h2>
        <p style={{ margin: 0, opacity: 0.8 }}>
          System rehabilitation complete. Desktop environment ready.
        </p>
      </div>

      <div style={{ flex: 1, display: "flex", gap: "1rem" }}>
        <div
          style={{
            flex: 1,
            border: "1px solid rgba(255, 255, 255, 0.2)",
            padding: "1rem",
            overflowY: "auto",
          }}
        >
          <h3 style={{ margin: 0, marginBottom: "0.5rem" }}>System Status</h3>
          <p style={{ margin: 0, opacity: 0.8 }}>
            Module status, network connectivity, and system logs will appear
            here.
          </p>
        </div>

        <div
          style={{
            flex: 1,
            border: "1px solid rgba(255, 255, 255, 0.2)",
            padding: "1rem",
            overflowY: "auto",
          }}
        >
          <h3 style={{ margin: 0, marginBottom: "0.5rem" }}>Terminal</h3>
          <p style={{ margin: 0, opacity: 0.8 }}>
            Full terminal interface with WiFi, filesystem, and advanced commands
            available.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DesktopShell;
