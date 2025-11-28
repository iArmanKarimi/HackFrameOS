/**
 * MemtestProgressBar Component
 * Displays progress bar and current step for memtest diagnostics
 */

import React from "react";

interface MemtestProgressBarProps {
	progress: number;
	currentStep: string;
}

const PROGRESS_CONTAINER_STYLE: React.CSSProperties = {
	border: "1px solid #202020",
	padding: "1rem",
	backgroundColor: "#0b0b0b",
	boxShadow: "0 0 25px rgba(0,0,0,0.45)",
};

const STEP_STYLE: React.CSSProperties = {
	marginBottom: "0.5rem",
	fontSize: "13px",
	color: "#9cd7ff",
};

const PROGRESS_BAR_CONTAINER_STYLE: React.CSSProperties = {
	height: "10px",
	width: "100%",
	backgroundColor: "#1a1a1a",
	border: "1px solid #333333",
	marginBottom: "0.5rem",
};

const PROGRESS_BAR_FILL_STYLE: React.CSSProperties = {
	height: "100%",
	backgroundColor: "#1e90ff",
	transition: "width 0.4s ease",
};

const PROGRESS_TEXT_STYLE: React.CSSProperties = {
	fontSize: "11px",
	color: "#b0b0b0",
};

/**
 * Component for displaying memtest progress bar and status
 */
export const MemtestProgressBar: React.FC<MemtestProgressBarProps> = ({
	progress,
	currentStep,
}) => {
	return (
		<div style={PROGRESS_CONTAINER_STYLE}>
			<div style={STEP_STYLE}>Current step: {currentStep}</div>
			<div style={PROGRESS_BAR_CONTAINER_STYLE}>
				<div style={{ ...PROGRESS_BAR_FILL_STYLE, width: `${progress}%` }} />
			</div>
			<div style={PROGRESS_TEXT_STYLE}>
				{progress}% complete • system will reboot automatically when testing
				finishes.
			</div>
		</div>
	);
};
