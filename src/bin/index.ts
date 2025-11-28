/**
 * GUI Terminal Command Registry
 * 
 * Central registry for all GUI terminal commands organized by package.
 * SafeMode commands remain in SafeModeCore.ts and are NOT included here.
 */

import { handleClear, handleHelp } from "../os/kernel/bin";
import { handleLs, handleCat } from "../os/fs/bin";
import { handleWifi, handlePing, handleNetcheck } from "../os/net/bin";

/**
 * Command handler function type
 */
export type CommandHandler = (args: string[]) => string;

/**
 * Command registry mapping command names to handlers
 */
export const COMMAND_REGISTRY: Record<string, CommandHandler> = {
	// Filesystem commands
	ls: handleLs,
	cat: handleCat,

	// Network commands
	wifi: handleWifi,
	ping: handlePing,
	netcheck: handleNetcheck,

	// System commands
	clear: handleClear,
	help: handleHelp,
};

/**
 * Get list of available command names for autocomplete
 */
export const AVAILABLE_COMMANDS = Object.keys(COMMAND_REGISTRY) as readonly string[];

/**
 * Parse command input into command name and arguments
 * @param input - Raw command input string
 * @returns Object with command name and array of arguments
 */
export function parseCommand(input: string): { command: string; args: string[] } {
	const trimmed = input.trim();
	const parts = trimmed.split(/\s+/);
	const command = parts[0] || "";
	const args = parts.slice(1);
	return { command, args };
}

/**
 * Execute a command from the registry
 * @param input - Raw command input from user
 * @returns Command output string or error message
 */
export function runCommand(input: string): string {
	const trimmed = input.trim();
	if (!trimmed) {
		return "";
	}

	const { command, args } = parseCommand(trimmed);
	const handler = COMMAND_REGISTRY[command];

	if (!handler) {
		return `bash: ${command}: command not found. Type 'help' for available commands.`;
	}

	try {
		return handler(args);
	} catch (error) {
		return `[ERROR] Command execution failed: ${error instanceof Error ? error.message : String(error)}`;
	}
}
