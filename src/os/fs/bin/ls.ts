/**
 * ls command - List directory contents
 */

import { fsLs } from "../fs";

/**
 * Handle ls command
 * @param args - Command arguments (optional path)
 * @returns Directory listing
 */
export function handleLs(args: string[]): string {
	const path = args[0];
	return fsLs(path);
}
