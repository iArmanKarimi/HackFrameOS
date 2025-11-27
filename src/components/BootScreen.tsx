import React, { useEffect, useState, useRef, useMemo } from "react";
import { BOOT_LOG } from "./SafeModeCore";
import { BOOT_SCREEN_CONFIG } from "../constants";

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
	 * - Adds pause after each segment (empty line).
	 */
	useEffect(() => {
		if (index >= lines.length) {
			return;
		}

		const currentLine = lines[index];
		const isSegmentBreak = currentLine.trim() === "";
		const delay = isSegmentBreak
			? BOOT_SCREEN_CONFIG.SEGMENT_BREAK_DELAY_MS
			: BOOT_SCREEN_CONFIG.LINE_INTERVAL_MS;

		const timer = setTimeout(() => {
			setIndex(prev => prev + 1); // reveal next line
		}, delay);

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

		const completionTimer = setTimeout(
			() => onComplete(),
			BOOT_SCREEN_CONFIG.COMPLETION_DELAY_MS
		);
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
			className="hide-scrollbar"
			style={{
				backgroundColor: "#0d0d0d",
				color: "#ffffff",
				fontFamily: "VT323, monospace",
				fontSize: "16px",
				padding: "1rem",
				height: "100vh",
				overflowY: "auto",
				scrollbarWidth: "none",
				msOverflowStyle: "none",
			}}
		>
			{lines.slice(0, index).map((line, idx) => {
				// Check if this is the "Finalizing boot environment" line that should have animated dots
				const isFinalizingLine = line.includes("Finalizing boot environment");

				if (isFinalizingLine) {
					// Extract the timestamp part (everything before "Finalizing boot environment")
					const timestampMatch = line.match(/^(\[.*?\])/);
					const timestamp = timestampMatch ? timestampMatch[1] : "";

					return (
						<pre
							key={idx}
							style={{
								margin: 0,
								lineHeight: "1.4",
								fontFamily: "VT323, monospace",
								fontSize: "16px",
								color: "#ffffff",
							}}
						>
							{timestamp} Finalizing boot environment...
						</pre>
					);
				}

				return (
					<pre
						key={idx}
						style={{
							margin: 0,
							lineHeight: "1.4",
							fontFamily: "VT323, monospace",
							fontSize: "16px",
							color: "#ffffff",
						}}
					>
						{line}
					</pre>
				);
			})}
		</div>
	);
};
