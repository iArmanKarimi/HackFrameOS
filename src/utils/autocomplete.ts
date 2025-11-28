/**
 * Autocomplete utilities for terminal command and module completion
 */

/**
 * Find common prefix among an array of strings.
 * Used for tab autocomplete: if multiple matches exist, complete to common prefix.
 * @param strings - Array of strings to find common prefix for
 * @returns Common prefix string (empty if no common prefix)
 * @example findCommonPrefix(["help", "hint"]) returns "h"
 */
export function findCommonPrefix(strings: string[]): string {
	if (strings.length === 0) return "";
	return strings.reduce((prefix: string, str) => {
		let i = 0;
		while (i < prefix.length && i < str.length && prefix[i] === str[i]) {
			i++;
		}
		return prefix.slice(0, i);
	}, strings[0]);
}

/**
 * Get autocomplete matches for a command prefix
 * @param prefix - Command prefix to match
 * @param availableCommands - List of available commands
 * @returns Array of commands that start with the prefix
 */
export function getCommandMatches(
	prefix: string,
	availableCommands: readonly string[]
): string[] {
	return availableCommands.filter(cmd => cmd.startsWith(prefix));
}

/**
 * Get autocomplete matches for a module prefix
 * @param prefix - Module prefix to match
 * @param availableModules - List of available modules
 * @returns Array of modules that start with the prefix
 */
export function getModuleMatches(
	prefix: string,
	availableModules: readonly string[]
): string[] {
	return availableModules.filter(module => module.startsWith(prefix));
}
