import React, { useState, useRef, useEffect } from "react";
import ansiEscapes from "ansi-escapes";

// --- Bring in your simulation logic ---
import { runCommand, HELP_TEXT, BOOT_BANNER } from "./SafeModeCore";

// TTY-authentic ANSI color mapping: only green (32) and white (default)
// Classic Linux TTY terminals are monochrome - white text with green for success
const ANSI_COLORS: Record<number, string> = {
	32: "#00ff00", // green (for OK messages - authentic Linux TTY)
	// All other codes default to white (#ffffff)
};

/**
 * Convert ANSI escape codes to React elements with colors
 * Handles both \x1b[ and \u001b[ escape sequences
 */
function ansiToReact(text: string): React.ReactNode[] {
	const parts: React.ReactNode[] = [];
	let currentColor = "#ffffff";
	let buffer = "";
	let i = 0;

	while (i < text.length) {
		// Check for ANSI escape sequence
		const isEscape = text[i] === "\x1b" || text[i] === "\u001b";

		if (isEscape && i + 1 < text.length && text[i + 1] === "[") {
			// Save any buffered text
			if (buffer) {
				parts.push(
					<span key={`text-${parts.length}`} style={{ color: currentColor }}>
						{buffer}
					</span>
				);
				buffer = "";
			}

			// Find the end of the ANSI sequence (should end with 'm')
			let j = i + 2;
			while (j < text.length && text[j] !== "m" && /[\d;]/.test(text[j])) {
				j++;
			}

			if (j < text.length && text[j] === "m") {
				// Extract the code sequence
				const codeStr = text.slice(i + 2, j);
				const codes = codeStr
					.split(";")
					.map(c => parseInt(c, 10))
					.filter(n => !isNaN(n));

				// Process codes - TTY authentic: only green (32) for OK, everything else white
				for (const code of codes) {
					if (code === 0 || code === 39) {
						currentColor = "#ffffff"; // Reset to white
					} else if (code === 32) {
						currentColor = ANSI_COLORS[32]; // Green for OK
					} else {
						currentColor = "#ffffff"; // All other codes = white (monochrome TTY)
					}
				}

				// Skip the entire escape sequence including the 'm'
				i = j + 1;
				continue;
			}
		}

		// Also handle cases where escape char might be missing (just [XXm)
		if (text[i] === "[" && i + 1 < text.length) {
			const match = text.slice(i).match(/^\[(\d+)m/);
			if (match) {
				if (buffer) {
					parts.push(
						<span key={`text-${parts.length}`} style={{ color: currentColor }}>
							{buffer}
						</span>
					);
					buffer = "";
				}

				const code = parseInt(match[1], 10);
				if (code === 0 || code === 39) {
					currentColor = "#ffffff"; // Reset to white
				} else if (code === 32) {
					currentColor = ANSI_COLORS[32]; // Green for OK
				} else {
					currentColor = "#ffffff"; // All other codes = white (monochrome TTY)
				}

				i += match[0].length;
				continue;
			}
		}

		buffer += text[i];
		i++;
	}

	// Add remaining buffer
	if (buffer) {
		parts.push(
			<span key={`text-${parts.length}`} style={{ color: currentColor }}>
				{buffer}
			</span>
		);
	}

	return parts.length > 0 ? parts : [text];
}

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
			{text}
			{".".repeat(dotCount)}
		</span>
	);
};

const SafeModeTerminal: React.FC<{
	onComplete?: () => void;
}> = ({ onComplete }) => {
	const [history, setHistory] = useState<string[]>([BOOT_BANNER]);
	const [input, setInput] = useState("");
	const [commandHistory, setCommandHistory] = useState<string[]>([]);
	const [historyIndex, setHistoryIndex] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [loadingText, setLoadingText] = useState("");

	// Ref for the scrollable container
	const containerRef = useRef<HTMLDivElement>(null);
	// Ref for the input to maintain focus
	const inputRef = useRef<HTMLInputElement>(null);

	// Auto-scroll to bottom when history updates
	useEffect(() => {
		if (containerRef.current) {
			containerRef.current.scrollTop = containerRef.current.scrollHeight;
		}
	}, [history]);

	// Keep input focused at all times
	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus();
		}
	}, [history]); // Re-focus after each command

	// Commands that should show loading animation with their loading messages
	const getLoadingText = (
		command: string,
		fullInput: string
	): string | null => {
		if (command === "load") {
			const module = fullInput.split(/\s+/)[1];
			return module ? `Loading ${module}` : "Loading modules";
		}
		if (command === "fragment") {
			const fragmentId = fullInput.split(/\s+/)[1];
			return fragmentId
				? `Resolving fragment ${fragmentId}`
				: "Listing fragments";
		}
		if (command.startsWith("wifi")) {
			return "Scanning network";
		}
		if (command === "ping") {
			return "Pinging";
		}
		if (command === "netcheck") {
			return "Checking network";
		}
		if (command === "startx") {
			return "Initializing display";
		}
		return null;
	};

	const handleCommand = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim() || isLoading) return;

		const trimmedInput = input.trim();
		const command = trimmedInput.split(/\s+/)[0];
		const loadingMessage = getLoadingText(command, trimmedInput);

		// Add command to history immediately
		setHistory(prev => [...prev, `> ${trimmedInput}`]);
		setCommandHistory(prev => [...prev, trimmedInput]);
		setHistoryIndex(null);
		setInput("");

		// Show loading animation for commands that need it
		let loadingHistoryIndex = -1;
		if (loadingMessage) {
			setLoadingText(loadingMessage);
			setIsLoading(true);
			// Add loading message to history (TTY-authentic: text stays on screen)
			setHistory(prev => {
				loadingHistoryIndex = prev.length;
				return [...prev, loadingMessage]; // Will show animated dots on this line
			});
			// Simulate processing time (200-600ms depending on command)
			const delay = command === "load" || command === "fragment" ? 400 : 200;
			await new Promise(resolve => setTimeout(resolve, delay));
		}

		const output = runCommand(trimmedInput);
		setIsLoading(false);
		setLoadingText(""); // Clear loading text

		// Handle clear command - reset history instead of appending
		if (output === ansiEscapes.clearScreen) {
			setHistory([]);
			return;
		}

		// Add output to history (TTY-authentic: all text stays on screen)
		// Keep the loading message and add output below it
		setHistory(prev => [...prev, output]);

		// Check if startx was called and system is ready
		if (
			trimmedInput === "startx" &&
			output.includes("Transitioning to desktop")
		) {
			// Small delay for cinematic effect before transitioning
			setTimeout(() => {
				if (onComplete) onComplete();
			}, 1000);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "ArrowUp") {
			e.preventDefault();
			if (commandHistory.length === 0) return;
			setHistoryIndex(current => {
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
			setHistoryIndex(current => {
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
				fontSize: "16px",
				padding: "1rem",
				overflowY: "auto",
				scrollbarWidth: "none",
				msOverflowStyle: "none",
			}}
		>
			{history.map((line, idx) => {
				// Check if this is the loading line that should show animated dots
				const isLoadingLine = isLoading && loadingText && line === loadingText;
				
				// Check if line contains ANSI codes
				const hasAnsi = line.includes("\x1b") || line.includes("\u001b");
				const content = hasAnsi ? ansiToReact(line) : line;

				return (
					<pre
						key={idx}
						style={{
							margin: 0,
							whiteSpace: "pre-wrap",
							wordWrap: "break-word",
							overflowWrap: "break-word",
							color: "#ffffff",
							lineHeight: "1.4",
							fontFamily: "VT323, monospace",
							fontSize: "16px",
						}}
					>
						{isLoadingLine ? (
							<AnimatedDots text={loadingText} />
						) : (
							content
						)}
					</pre>
				);
			})}

			<form onSubmit={handleCommand} style={{ marginTop: "0.5rem" }}>
				<span
					style={{
						color: "#ffffff",
						fontFamily: "VT323, monospace",
						fontSize: "16px",
					}}
				>
					safemode@root:~${" "}
				</span>
				<input
					ref={inputRef}
					type="text"
					value={input}
					onChange={e => setInput(e.target.value)}
					onKeyDown={handleKeyDown}
					onBlur={e => {
						// Immediately refocus if input loses focus
						e.target.focus();
					}}
					style={{
						background: "transparent",
						border: "none",
						outline: "none",
						color: "#ffffff",
						fontFamily: "VT323, monospace",
						fontSize: "16px",
						width: "80%",
					}}
					autoFocus
				/>
			</form>
		</div>
	);
};

export default SafeModeTerminal;
