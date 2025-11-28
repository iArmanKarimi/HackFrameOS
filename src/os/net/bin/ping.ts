/**
 * ping command - Test connectivity to core, net, or external targets
 */

import { ping as pingCore } from "../net";

/**
 * Handle ping command
 * @param args - Command arguments (target: core|net|external)
 * @returns Ping result message
 */
export function handlePing(args: string[]): string {
	const target = args[0];
	return pingCore(target);
}
