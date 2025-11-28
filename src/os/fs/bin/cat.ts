/**
 * cat command - Display file contents
 */

import { fsCat } from "../fs";

/**
 * Handle cat command
 * @param args - Command arguments (file path)
 * @returns File contents or error message
 */
export function handleCat(args: string[]): string {
	if (args.length === 0) {
		return "cat: missing operand\nUsage: cat /path/to/file";
	}
	return fsCat(args[0]);
}
