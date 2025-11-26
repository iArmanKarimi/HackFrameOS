import React, { useEffect, useState, useRef, useMemo } from "react";
import { BOOT_LOG } from "./SafeModeCore";

// TTY-authentic loading indicator - cycles through text. text.. text... (classic terminal pattern)
const AnimatedDots: React.FC<{ text: string }> = ({ text }) => {
	const [dotCount, setDotCount] = useState(1);

	useEffect(() => {
		// Start with 1 dot, then change every 1200ms
		// First change happens after 1200ms (to show 1 dot for full duration)
		const timeout1 = setTimeout(() => setDotCount(2), 1200);
		const timeout2 = setTimeout(() => setDotCount(3), 2400);
		
		// Then use interval to cycle continuously
		const interval = setInterval(() => {
			setDotCount(prev => {
				if (prev >= 3) return 1;
				return prev + 1;
			});
		}, 1200);

		return () => {
			clearTimeout(timeout1);
			clearTimeout(timeout2);
			clearInterval(interval);
		};
	}, []);

	return (
		<span
			style={{
				fontFamily: "VT323, monospace",
				fontSize: "16px",
				color: "#ffffff",
			}}
		>
			{text}{".".repeat(dotCount)}
		</span>
	);
};

// Interval (in ms) between revealing each boot log line.
// TTY-authentic: lines appear instantly, no smooth animations
const BOOT_LINE_INTERVAL_MS = 50; // Slightly faster, more authentic to real boot logs

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
	 */
	useEffect(() => {
		if (index >= lines.length) {
			return;
		}

		const timer = setTimeout(() => {
			setIndex(prev => prev + 1); // reveal next line
		}, BOOT_LINE_INTERVAL_MS);

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

		const completionTimer = setTimeout(() => onComplete(), 800); // cinematic pause before handoff
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
							{timestamp} <AnimatedDots text="Finalizing boot environment" />
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
