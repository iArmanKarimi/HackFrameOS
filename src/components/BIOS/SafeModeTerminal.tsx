import React, { useState, useRef, useEffect } from "react";
import ansiEscapes from "ansi-escapes";

// --- Bring in your simulation logic ---
import {
	runCommand,
	HELP_TEXT,
	BOOT_BANNER,
	AVAILABLE_COMMANDS,
	AVAILABLE_MODULES,
} from "./SafeModeCore";
import {
	getLoadedModuleCount,
	getResolvedFragmentCount,
} from "../../_deprecated/kernel";

// TTY-authentic ANSI color mapping: only green (32) and white (default)
// Classic Linux TTY terminals are monochrome - white text with green for success
const ANSI_COLORS: Record<number, string> = {
	32: "#00ff00", // green (for OK messages - authentic Linux TTY)
};

const DEFAULT_COLOR = "#ffffff";
const ANSI_RESET_CODES = [0, 39];
const ANSI_GREEN_CODE = 32;
const MAX_ANSI_SEQUENCE_LENGTH = 50;
const MAX_ANSI_CODE_VALUE = 255;
const MAX_INPUT_LENGTH = 1000;
const MAX_HISTORY_SIZE = 1000;
const MAX_COMMAND_HISTORY = 100;

/**
 * Process ANSI color code and update current color
 */
function processAnsiCode(code: number): string {
	if (ANSI_RESET_CODES.includes(code)) {
		return DEFAULT_COLOR;
	}
	if (code === ANSI_GREEN_CODE) {
		return ANSI_COLORS[ANSI_GREEN_CODE];
	}
	return DEFAULT_COLOR;
}

/**
 * Add buffered text to parts array
 */
function flushBuffer(
	buffer: string,
	currentColor: string,
	parts: React.ReactNode[]
): void {
	if (buffer) {
		parts.push(
			<span key={`text-${parts.length}`} style={{ color: currentColor }}>
				{buffer}
			</span>
		);
	}
}

/**
 * Converts ANSI escape sequences in text to React elements with inline styles.
 * Handles two formats: standard (\x1b[XXm) and malformed ([XXm without escape char).
 * Only processes green (32) for [OK] messages; all other codes default to white.
 */
function ansiToReact(text: string): React.ReactNode[] {
	const parts: React.ReactNode[] = [];
	let currentColor = DEFAULT_COLOR;
	let buffer = "";
	let i = 0;

	while (i < text.length) {
		// Check for ANSI escape sequence (both hex and unicode escape forms)
		const isEscape = text[i] === "\x1b" || text[i] === "\u001b";

		if (isEscape && i + 1 < text.length && text[i + 1] === "[") {
			flushBuffer(buffer, currentColor, parts);
			buffer = "";

			// Find the end of the ANSI sequence (should end with 'm')
			// Add max iteration limit to prevent infinite loops
			let j = i + 2;
			const maxSearch = Math.min(i + MAX_ANSI_SEQUENCE_LENGTH, text.length);
			while (j < maxSearch && text[j] !== "m" && /[\d;]/.test(text[j])) {
				j++;
			}

			if (j < text.length && text[j] === "m") {
				// Validate sequence length to prevent DoS
				if (j - i > MAX_ANSI_SEQUENCE_LENGTH) {
					// Skip malformed sequence
					i++;
					continue;
				}

				// Extract and process the code sequence (supports multiple codes separated by ';')
				const codeStr = text.slice(i + 2, j);
				const codes = codeStr
					.split(";")
					.map(c => parseInt(c, 10))
					.filter(n => !isNaN(n) && n >= 0 && n <= MAX_ANSI_CODE_VALUE);

				// Process codes - TTY authentic: only green (32) for OK, everything else white
				for (const code of codes) {
					currentColor = processAnsiCode(code);
				}

				// Skip the entire escape sequence including the 'm'
				i = j + 1;
				continue;
			}
		}

		// Also handle cases where escape char might be missing (just [XXm)
		// This handles malformed ANSI sequences that might appear in output
		if (text[i] === "[" && i + 1 < text.length) {
			const match = text.slice(i).match(/^\[(\d+)m/);
			if (match) {
				// Validate sequence length to prevent DoS
				if (match[0].length > MAX_ANSI_SEQUENCE_LENGTH) {
					i++;
					continue;
				}

				flushBuffer(buffer, currentColor, parts);
				buffer = "";

				const code = parseInt(match[1], 10);
				// Validate code range
				if (!isNaN(code) && code >= 0 && code <= MAX_ANSI_CODE_VALUE) {
					currentColor = processAnsiCode(code);
				}

				i += match[0].length;
				continue;
			}
		}

		buffer += text[i];
		i++;
	}

	// Add remaining buffer
	flushBuffer(buffer, currentColor, parts);

	return parts.length > 0 ? parts : [text];
}

const SafeModeTerminal: React.FC<{
	onComplete?: () => void;
}> = ({ onComplete }) => {
	// Display history: all terminal output (commands + responses) for TTY authenticity
	const [history, setHistory] = useState<string[]>([BOOT_BANNER]);
	const [input, setInput] = useState("");
	// Command history: only user-entered commands for arrow key navigation
	const [commandHistory, setCommandHistory] = useState<string[]>([]);
	// Current position in command history when navigating with arrow keys
	const [historyIndex, setHistoryIndex] = useState<number | null>(null);

	// Track progress for visual feedback
	const [loadedModules, setLoadedModules] = useState(0);
	const [resolvedFragments, setResolvedFragments] = useState(0);

	// Ref for the scrollable container
	const containerRef = useRef<HTMLDivElement>(null);
	// Ref for the input to maintain focus
	const inputRef = useRef<HTMLInputElement>(null);
	// Track timeout for startx command cleanup
	const startxTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Auto-scroll to bottom when history updates
	useEffect(() => {
		if (containerRef.current) {
			containerRef.current.scrollTop = containerRef.current.scrollHeight;
		}
	}, [history]);

	// Update visual feedback when commands are executed
	useEffect(() => {
		setLoadedModules(getLoadedModuleCount());
		setResolvedFragments(getResolvedFragmentCount());
	}, [history]);

	// Keep input focused at all times
	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus();
		}
	}, [history]); // Re-focus after each command

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (startxTimeoutRef.current) {
				clearTimeout(startxTimeoutRef.current);
			}
		};
	}, []);

	// Global handler for Ctrl+L to prevent browser address bar focus
	// Note: Some browsers (especially Chrome) intercept Ctrl+L at a very low level
	// and it's difficult to override. We use capture phase and immediate stop.
	useEffect(() => {
		const handleGlobalKeyDown = (e: KeyboardEvent) => {
			// Only handle if the terminal container or input has focus
			if ((e.ctrlKey || e.metaKey) && (e.key === "l" || e.key === "L")) {
				// Check if terminal has focus
				const hasTerminalFocus =
					document.activeElement === inputRef.current ||
					containerRef.current?.contains(document.activeElement) ||
					document.activeElement === containerRef.current;

				if (hasTerminalFocus) {
					e.preventDefault();
					e.stopPropagation();
					e.stopImmediatePropagation();
					setHistory([]);
					setCommandHistory([]);
					setHistoryIndex(null);
					setInput("");
					// Refocus input to keep terminal active
					if (inputRef.current) {
						inputRef.current.focus();
					}
					return false;
				}
			}
		};

		// Use capture phase with high priority
		document.addEventListener("keydown", handleGlobalKeyDown, {
			capture: true,
			passive: false,
		});
		return () => {
			document.removeEventListener("keydown", handleGlobalKeyDown, {
				capture: true,
			});
		};
	}, []);

	const handleCommand = (e: React.FormEvent) => {
		e.preventDefault();
		// Trim first, then validate length
		const trimmedInput = input.trim();
		if (!trimmedInput || trimmedInput.length > MAX_INPUT_LENGTH) return;

		// Add command to display history immediately (before execution) for TTY authenticity
		// Maintain bounded history to prevent memory issues
		setHistory(prev => {
			const newHistory = [...prev, `> ${trimmedInput}`];
			return newHistory.slice(-MAX_HISTORY_SIZE);
		});
		// Add to command history for arrow key navigation (separate from display history)
		setCommandHistory(prev => {
			const newHistory = [...prev, trimmedInput];
			return newHistory.slice(-MAX_COMMAND_HISTORY);
		});
		// Reset navigation index when new command is entered
		setHistoryIndex(null);
		setInput("");

		let output: string;
		try {
			output = runCommand(trimmedInput);
		} catch (error) {
			output = `[ERROR] Command execution failed: ${error instanceof Error ? error.message : String(error)}`;
		}

		// Handle clear command - reset display history but keep command history for arrow key navigation
		if (output === ansiEscapes.clearScreen) {
			setHistory([]);
			// Don't clear commandHistory - users should still be able to navigate through previous commands
			return;
		}

		// Add output to history only if non-empty (TTY-authentic: all text stays on screen) (with size limit)
		if (output) {
			setHistory(prev => {
				const newHistory = [...prev, output];
				return newHistory.slice(-MAX_HISTORY_SIZE);
			});
		}

		// Check if startx was called and system is ready
		// Use constant for state detection to avoid magic strings
		const TRANSITION_MESSAGE = "Transitioning to desktop";
		if (trimmedInput === "startx" && output.includes(TRANSITION_MESSAGE)) {
			// Clear any existing timeout
			if (startxTimeoutRef.current) {
				clearTimeout(startxTimeoutRef.current);
			}
			// Small delay for cinematic effect before transitioning
			startxTimeoutRef.current = setTimeout(() => {
				if (onComplete) onComplete();
				startxTimeoutRef.current = null;
			}, 1000);
		}
	};

	/**
	 * Find common prefix among an array of strings.
	 * Used for tab autocomplete: if multiple matches exist, complete to common prefix.
	 * Example: ["help", "hint"] with input "h" returns "h" (common prefix).
	 */
	const findCommonPrefix = (strings: string[]): string => {
		if (strings.length === 0) return "";
		return strings.reduce((prefix: string, str) => {
			let i = 0;
			// Find the first position where characters differ
			while (i < prefix.length && i < str.length && prefix[i] === str[i]) {
				i++;
			}
			return prefix.slice(0, i);
		}, strings[0]);
	};

	/**
	 * Handle command autocomplete on Tab key.
	 * - Single match: complete command and add space for arguments
	 * - Multiple matches: complete to common prefix only
	 * - No matches: no action (user sees no autocomplete)
	 */
	const handleCommandAutocomplete = (command: string): void => {
		const matches = AVAILABLE_COMMANDS.filter(cmd => cmd.startsWith(command));
		if (matches.length === 1) {
			// Single match: complete and add space for potential arguments
			setInput(matches[0] + " ");
		} else if (matches.length > 1) {
			// Multiple matches: complete only the common prefix
			const commonPrefix = findCommonPrefix(matches);
			if (commonPrefix.length > command.length) {
				setInput(commonPrefix);
			}
		}
		// No matches: do nothing (let user continue typing)
	};

	/**
	 * Handle module autocomplete for "load" command
	 */
	const handleModuleAutocomplete = (currentArg: string): void => {
		const matches = AVAILABLE_MODULES.filter(module =>
			module.startsWith(currentArg)
		);
		if (matches.length === 1) {
			setInput(`load ${matches[0]}`);
		} else if (matches.length > 1) {
			const commonPrefix = findCommonPrefix(matches);
			if (commonPrefix.length > currentArg.length) {
				setInput(`load ${commonPrefix}`);
			}
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		// Ctrl+L: Clear screen (standard terminal shortcut)
		if ((e.ctrlKey || e.metaKey) && (e.key === "l" || e.key === "L")) {
			e.preventDefault();
			e.stopPropagation();
			setHistory([]);
			setCommandHistory([]);
			setHistoryIndex(null);
			setInput("");
			return;
		}

		if (e.key === "ArrowUp") {
			e.preventDefault();
			if (commandHistory.length === 0) return;
			setHistoryIndex(current => {
				// If at start (null), go to last command; otherwise go to previous
				const nextIndex =
					current === null
						? commandHistory.length - 1
						: Math.max(0, current - 1);
				// Validate index is within bounds (defensive check)
				if (nextIndex < 0 || nextIndex >= commandHistory.length) {
					return current;
				}
				setInput(commandHistory[nextIndex] ?? "");
				return nextIndex;
			});
		} else if (e.key === "ArrowDown") {
			e.preventDefault();
			if (commandHistory.length === 0) return;
			setHistoryIndex(current => {
				if (current === null) return null; // Already at bottom
				const nextIndex = current + 1;
				// If past end, clear input and reset to null (bottom of history)
				if (nextIndex >= commandHistory.length) {
					setInput("");
					return null;
				}
				setInput(commandHistory[nextIndex] ?? "");
				return nextIndex;
			});
		} else if (e.key === "Tab") {
			e.preventDefault();
			const trimmed = input.trim();
			const parts = trimmed.split(/\s+/);
			const command = parts[0] || "";
			const currentArg = parts[1] || "";

			// Autocomplete command name when typing first word
			if (parts.length === 1) {
				handleCommandAutocomplete(command);
			}
			// Autocomplete module name for "load" command (second argument)
			else if (command === "load" && parts.length === 2) {
				handleModuleAutocomplete(currentArg);
			}
			// Other commands with arguments: no autocomplete (could be extended later)
		}
	};

	// Handle Ctrl+L at the container level to prevent browser address bar focus
	const handleContainerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if ((e.ctrlKey || e.metaKey) && (e.key === "l" || e.key === "L")) {
			e.preventDefault();
			e.stopPropagation();
			setHistory([]);
			setCommandHistory([]);
			setHistoryIndex(null);
			setInput("");
		}
	};

	return (
		<div
			ref={containerRef}
			className="fixed inset-0 safemode-scrollbar"
			onKeyDown={handleContainerKeyDown}
			tabIndex={-1}
			style={{
				backgroundColor: "#0d0d0d",
				color: "#FFFFFF",
				fontFamily: "VT323, monospace",
				fontSize: "16px",
				padding: "1rem",
				overflowY: "auto",
			}}
		>
			{history.map((line, idx) => {
				// Check if line contains ANSI codes
				const hasAnsi = line.includes("\x1b") || line.includes("\u001b");
				const content = hasAnsi ? ansiToReact(line) : line;

				// Use stable key based on index and line length for React reconciliation
				// Index ensures uniqueness; length helps detect content changes
				const lineKey = `history-${idx}-${line.length}`;

				return (
					<pre
						key={lineKey}
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
						{content}
					</pre>
				);
			})}

			<form
				onSubmit={handleCommand}
				style={{
					marginTop: "0.5rem",
					display: "flex",
					alignItems: "flex-start",
				}}
			>
				<span
					style={{
						// Visual feedback: prompt color changes based on progress
						// Start red (degraded), transition to yellow, then green as system recovers
						color:
							loadedModules >= 6 && resolvedFragments >= 5
								? "#00ff00" // Green: system mostly recovered
								: loadedModules >= 3 || resolvedFragments >= 3
									? "#ffff00" // Yellow: making progress
									: "#ff4444", // Red: degraded state
						fontFamily: "VT323, monospace",
						fontSize: "16px",
						whiteSpace: "nowrap",
						flexShrink: 0,
						transition: "color 0.3s ease",
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
						flex: 1,
						minWidth: 0,
						whiteSpace: "nowrap",
						overflow: "hidden",
						marginLeft: "0.25rem",
					}}
					autoFocus
				/>
			</form>
		</div>
	);
};

export default SafeModeTerminal;
