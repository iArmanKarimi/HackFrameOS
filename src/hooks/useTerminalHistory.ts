/**
 * Custom hook for managing terminal command history and input
 */

import { useCallback, useEffect, useRef, useState } from "react";
import ansiEscapes from "ansi-escapes";

import { runCommand } from "../components/SafeModeCore";
import {
	AVAILABLE_COMMANDS,
	AVAILABLE_MODULES,
} from "../components/SafeModeCore";

import { getLoadedModuleCount, getResolvedFragmentCount } from "../os/kernel";

import {
	findCommonPrefix,
	getCommandMatches,
	getModuleMatches,
} from "../utils/autocomplete";
import { addToHistory, navigateHistory } from "../utils/commandHistory";

import { SAFE_MODE_CONFIG, TERMINAL_CONFIG } from "../constants";

interface UseTerminalHistoryOptions {
	initialHistory: string[];
	onComplete?: () => void;
}

interface UseTerminalHistoryReturn {
	history: string[];
	input: string;
	setInput: (value: string) => void;
	handleCommand: (e: React.FormEvent) => void;
	handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
	handleCommandAutocomplete: (command: string) => void;
	handleModuleAutocomplete: (currentArg: string) => void;
	containerRef: React.RefObject<HTMLDivElement>;
	inputRef: React.RefObject<HTMLInputElement>;
	loadedModules: number;
	resolvedFragments: number;
	clearScreen: () => void;
}

/**
 * Hook to manage terminal history, input, and command execution
 * @param options - Configuration with initialHistory and optional onComplete callback
 * @returns Object with terminal state and handlers
 */
export function useTerminalHistory({
	initialHistory,
	onComplete,
}: UseTerminalHistoryOptions): UseTerminalHistoryReturn {
	const [history, setHistory] = useState<string[]>(initialHistory);
	const [input, setInput] = useState("");
	const [commandHistory, setCommandHistory] = useState<string[]>([]);
	const [historyIndex, setHistoryIndex] = useState<number | null>(null);
	const [loadedModules, setLoadedModules] = useState(0);
	const [resolvedFragments, setResolvedFragments] = useState(0);

	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const startxTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Auto-scroll to bottom when history updates
	useEffect(() => {
		if (containerRef.current) {
			containerRef.current.scrollTop = containerRef.current.scrollHeight;
		}
	}, [history]);

	// Update progress indicators
	useEffect(() => {
		setLoadedModules(getLoadedModuleCount());
		setResolvedFragments(getResolvedFragmentCount());
	}, [history]);

	// Keep input focused
	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus();
		}
	}, [history]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (startxTimeoutRef.current) {
				clearTimeout(startxTimeoutRef.current);
			}
		};
	}, []);

	// Prevent user from scrolling up
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		let rafId: number | null = null;
		const handleScroll = () => {
			if (!container) return;

			if (rafId !== null) {
				cancelAnimationFrame(rafId);
			}

			rafId = requestAnimationFrame(() => {
				if (!container) return;
				const threshold = 10;
				const isAtBottom =
					container.scrollTop >=
					container.scrollHeight - container.clientHeight - threshold;

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

	// Global handler for Ctrl+L
	useEffect(() => {
		const handleGlobalKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && (e.key === "l" || e.key === "L")) {
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
					if (inputRef.current) {
						inputRef.current.focus();
					}
					return false;
				}
			}
		};

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

	const clearScreen = useCallback(() => {
		setHistory([]);
		setCommandHistory([]);
		setHistoryIndex(null);
		setInput("");
	}, []);

	const handleCommand = useCallback(
		(e: React.FormEvent) => {
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
		},
		[input, onComplete]
	);

	const handleCommandAutocomplete = useCallback((command: string): void => {
		const matches = getCommandMatches(command, AVAILABLE_COMMANDS);
		if (matches.length === 1) {
			setInput(matches[0] + " ");
		} else if (matches.length > 1) {
			const commonPrefix = findCommonPrefix(matches);
			if (commonPrefix.length > command.length) {
				setInput(commonPrefix);
			}
		}
	}, []);

	const handleModuleAutocomplete = useCallback((currentArg: string): void => {
		const matches = getModuleMatches(currentArg, AVAILABLE_MODULES);
		if (matches.length === 1) {
			setInput(`load ${matches[0]}`);
		} else if (matches.length > 1) {
			const commonPrefix = findCommonPrefix(matches);
			if (commonPrefix.length > currentArg.length) {
				setInput(`load ${commonPrefix}`);
			}
		}
	}, []);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if ((e.ctrlKey || e.metaKey) && (e.key === "l" || e.key === "L")) {
				e.preventDefault();
				e.stopPropagation();
				clearScreen();
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

				if (parts.length === 1) {
					handleCommandAutocomplete(command);
				} else if (command === "load" && parts.length === 2) {
					handleModuleAutocomplete(currentArg);
				}
			}
		},
		[commandHistory, input, clearScreen, handleCommandAutocomplete, handleModuleAutocomplete]
	);

	return {
		history,
		input,
		setInput,
		handleCommand,
		handleKeyDown,
		handleCommandAutocomplete,
		handleModuleAutocomplete,
		containerRef,
		inputRef,
		loadedModules,
		resolvedFragments,
		clearScreen,
	};
}
