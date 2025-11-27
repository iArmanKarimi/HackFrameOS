import React, { useState, useRef, useEffect } from "react";
import ansiEscapes from "ansi-escapes";
import {
	runCommand,
	BOOT_BANNER,
	AVAILABLE_COMMANDS,
	AVAILABLE_MODULES,
} from "./SafeModeCore";
import { getLoadedModuleCount, getResolvedFragmentCount } from "../os/kernel";
import { ansiToReact, hasAnsiCodes } from "../utils/ansi";
import {
	findCommonPrefix,
	getCommandMatches,
	getModuleMatches,
} from "../utils/autocomplete";
import { addToHistory, navigateHistory } from "../utils/commandHistory";
import { TERMINAL_CONFIG, SAFE_MODE_CONFIG, COLORS } from "../constants";

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
			// Force immediate scroll to bottom (no smooth scrolling)
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

	// Prevent user from scrolling up - always keep at bottom
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		let rafId: number | null = null;
		const handleScroll = () => {
			if (!container) return;

			// Cancel any pending scroll correction
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
			}

			// Use requestAnimationFrame to avoid scroll jank
			rafId = requestAnimationFrame(() => {
				if (!container) return;
				const threshold = 10; // Small threshold to account for rounding
				const isAtBottom =
					container.scrollTop >=
					container.scrollHeight - container.clientHeight - threshold;

				// If user scrolled up, force back to bottom
				if (!isAtBottom) {
					container.scrollTop = container.scrollHeight;
				}
			});
		};

		container.addEventListener("scroll", handleScroll, { passive: true });
		return () => {
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
			}
			container.removeEventListener("scroll", handleScroll);
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
		const trimmedInput = input.trim();
		if (
			!trimmedInput ||
			trimmedInput.length > TERMINAL_CONFIG.MAX_INPUT_LENGTH
		) {
			return;
		}

		setHistory(prev => {
			const newHistory = [...prev, `> ${trimmedInput}`];
			return newHistory.slice(-TERMINAL_CONFIG.MAX_HISTORY_SIZE);
		});

		setCommandHistory(prev =>
			addToHistory(prev, trimmedInput, TERMINAL_CONFIG.MAX_COMMAND_HISTORY)
		);
		setHistoryIndex(null);
		setInput("");

		let output: string;
		try {
			output = runCommand(trimmedInput);
		} catch (error) {
			output = `[ERROR] Command execution failed: ${
				error instanceof Error ? error.message : String(error)
			}`;
		}

		if (output === ansiEscapes.clearScreen) {
			setHistory([]);
			return;
		}

		if (output) {
			setHistory(prev => {
				const newHistory = [...prev, output];
				return newHistory.slice(-TERMINAL_CONFIG.MAX_HISTORY_SIZE);
			});
		}

		if (
			trimmedInput === "startx" &&
			output.includes(SAFE_MODE_CONFIG.TRANSITION_MESSAGE)
		) {
			if (startxTimeoutRef.current) {
				clearTimeout(startxTimeoutRef.current);
			}
			startxTimeoutRef.current = setTimeout(() => {
				if (onComplete) onComplete();
				startxTimeoutRef.current = null;
			}, SAFE_MODE_CONFIG.TRANSITION_DELAY_MS);
		}
	};

	const handleCommandAutocomplete = (command: string): void => {
		const matches = getCommandMatches(command, AVAILABLE_COMMANDS);
		if (matches.length === 1) {
			setInput(matches[0] + " ");
		} else if (matches.length > 1) {
			const commonPrefix = findCommonPrefix(matches);
			if (commonPrefix.length > command.length) {
				setInput(commonPrefix);
			}
		}
	};

	const handleModuleAutocomplete = (currentArg: string): void => {
		const matches = getModuleMatches(currentArg, AVAILABLE_MODULES);
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
				const result = navigateHistory(current, "up", commandHistory);
				setInput(result.command);
				return result.index;
			});
		} else if (e.key === "ArrowDown") {
			e.preventDefault();
			if (commandHistory.length === 0) return;
			setHistoryIndex(current => {
				const result = navigateHistory(current, "down", commandHistory);
				setInput(result.command);
				return result.index;
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
				const content = hasAnsiCodes(line) ? ansiToReact(line) : line;

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
						color:
							loadedModules >= 6 && resolvedFragments >= 5
								? COLORS.GREEN
								: loadedModules >= 3 || resolvedFragments >= 3
									? COLORS.YELLOW
									: COLORS.RED,
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
