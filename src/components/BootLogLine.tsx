/**
 * BootLogLine Component
 * Renders a single line from the boot log
 */

import React from "react";

import { TERMINAL_STYLES } from "../styles/terminalStyles";

interface BootLogLineProps {
	line: string;
	index: number;
}

/**
 * Component for rendering individual boot log lines
 */
export const BootLogLine: React.FC<BootLogLineProps> = ({ line, index }) => {
	const isFinalizingLine = line.includes("Finalizing boot environment");

	if (isFinalizingLine) {
		const timestampMatch = line.match(/^(\[.*?\])/);
		const timestamp = timestampMatch ? timestampMatch[1] : "";

		return (
			<pre key={index} style={TERMINAL_STYLES.BOOT_LOG_LINE}>
				{timestamp} Finalizing boot environment...
			</pre>
		);
	}

	return (
		<pre key={index} style={TERMINAL_STYLES.BOOT_LOG_LINE}>
			{line}
		</pre>
	);
};
