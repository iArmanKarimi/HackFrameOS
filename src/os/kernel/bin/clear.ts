/**
 * clear command - Clear the terminal screen
 */

import { clearScreen } from "../kernel";

/**
 * Handle clear command
 * @param args - Command arguments (unused)
 * @returns ANSI escape sequence to clear screen
 */
export function handleClear(args: string[]): string {
	return clearScreen();
}
