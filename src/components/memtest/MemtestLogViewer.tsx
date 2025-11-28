/**
 * MemtestLogViewer Component
 * Displays the event log for memtest diagnostics
 */

import React from "react";

import type { LogEntry } from "../../types";

interface MemtestLogViewerProps {
	logs: LogEntry[];
}

const LOG_SECTION_STYLE: React.CSSProperties = {
	flex: 1,
	marginTop: "1rem",
	border: "1px solid #1a1a1a",
	backgroundColor: "#000000",
	padding: "0.75rem",
	overflow: "hidden",
	display: "flex",
	flexDirection: "column",
};

const LOG_HEADER_STYLE: React.CSSProperties = {
	fontSize: "11px",
	color: "#6b6b6b",
	marginBottom: "0.5rem",
};

const LOG_CONTENT_STYLE: React.CSSProperties = {
	flex: 1,
	overflowY: "auto",
	fontSize: "12px",
	lineHeight: "1.4",
};

/**
 * Component for displaying memtest event logs
 */
export const MemtestLogViewer: React.FC<MemtestLogViewerProps> = ({ logs }) => {
	return (
		<section style={LOG_SECTION_STYLE}>
			<div style={LOG_HEADER_STYLE}>Event log</div>
			<div style={LOG_CONTENT_STYLE}>
				{logs.map(entry => (
					<div key={entry.id}>{entry.line}</div>
				))}
			</div>
		</section>
	);
};
