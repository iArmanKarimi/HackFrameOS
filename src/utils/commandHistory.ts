/**
 * Command history management utilities
 */

import { TERMINAL_CONFIG } from "../constants";

/**
 * Add command to history with size limit
 * @param history - Current command history array
 * @param command - New command to add
 * @param maxSize - Maximum history size (defaults to TERMINAL_CONFIG.MAX_COMMAND_HISTORY)
 * @returns New history array with command added and size limited
 */
export function addToHistory(
	history: string[],
	command: string,
	maxSize: number = TERMINAL_CONFIG.MAX_COMMAND_HISTORY
): string[] {
	const newHistory = [...history, command];
	return newHistory.slice(-maxSize);
}

/**
 * Navigate command history with arrow keys
 * @param currentIndex - Current position in history (null means at bottom)
 * @param direction - Navigation direction ("up" or "down")
 * @param history - Command history array
 * @returns Object with new index and command string
 */
export function navigateHistory(
	currentIndex: number | null,
	direction: "up" | "down",
	history: string[]
): { index: number | null; command: string } {
	if (history.length === 0) {
		return { index: null, command: "" };
	}

	if (direction === "up") {
		const nextIndex =
			currentIndex === null
				? history.length - 1
				: Math.max(0, currentIndex - 1);
		return {
			index: nextIndex,
			command: history[nextIndex] ?? "",
		};
	} else {
		if (currentIndex === null) {
			return { index: null, command: "" };
		}
		const nextIndex = currentIndex + 1;
		if (nextIndex >= history.length) {
			return { index: null, command: "" };
		}
		return {
			index: nextIndex,
			command: history[nextIndex] ?? "",
		};
	}
}
