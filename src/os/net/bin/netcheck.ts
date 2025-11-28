/**
 * netcheck command - Verify network status and external connectivity
 */

import { netCheck } from "../net";

/**
 * Handle netcheck command
 * @param args - Command arguments (unused)
 * @returns Network status message
 */
export function handleNetcheck(args: string[]): string {
	return netCheck();
}
