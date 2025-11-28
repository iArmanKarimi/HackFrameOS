import React from "react";

import { DESKTOP_SHELL_STYLES } from "../styles/terminalStyles";

/**
 * DesktopShell Component
 * ----------------------
 * Main GUI that appears after SafeMode rehabilitation is complete.
 * Shows panels for logs, modules, and a terminal window.
 */
const DesktopShell: React.FC = () => {
	return (
		<div style={DESKTOP_SHELL_STYLES.CONTAINER}>
			<div style={DESKTOP_SHELL_STYLES.PANEL}>
				<h2 style={{ margin: 0, marginBottom: "0.5rem" }}>
					HackFrameOS Desktop v0.1.3-alpha - Recovery Complete
				</h2>
				<p style={{ margin: 0, opacity: 0.8 }}>
					System rehabilitation complete. Desktop environment ready. All
					critical subsystems online. Network: Operational.
				</p>
			</div>

			<div style={{ flex: 1, display: "flex", gap: "1rem" }}>
				<div
					style={{
						...DESKTOP_SHELL_STYLES.PANEL,
						flex: 1,
						overflowY: "auto" as const,
					}}
				>
					<h3 style={{ margin: 0, marginBottom: "0.5rem" }}>System Status</h3>
					<p style={{ margin: 0, opacity: 0.8 }}>
						Module status, network connectivity, and system logs will appear
						here.
					</p>
					<p style={{ margin: "0.5rem 0 0 0", opacity: 0.6, fontSize: "14px" }}>
						Status: All systems operational | Network: Connected | Boot
						fragments: Resolved
					</p>
				</div>

				<div
					style={{
						...DESKTOP_SHELL_STYLES.PANEL,
						flex: 1,
						overflowY: "auto" as const,
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
