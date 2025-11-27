/**
 * Command router for the Safe Mode terminal.
 * Delegates to pure simulation modules under src/os.
 */

import { z } from "zod";
import {
	BOOT_BANNER,
	HELP_TEXT,
	getModuleListing,
	COMMAND_NOT_FOUND,
	showStatus,
	showMission,
	nextHint,
	listFragments,
	resolveFragment,
	loadModule,
	clearScreen,
	isSafeModeComplete,
} from "../os/kernel";
import {
	wifiHelp,
	wifiScan,
	wifiCrack,
	wifiConnect,
	netCheck,
	ping,
} from "../os/net";
import { fsHelp, fsLs, fsCat } from "../os/fs";

export { BOOT_LOG } from "./boot-log";

// Available commands for autocomplete
export const AVAILABLE_COMMANDS = [
	"help",
	"load",
	"status",
	"fragment",
	"mission",
	"hint",
	"startx",
	"clear",
	"wifi",
	"ping",
	"netcheck",
	"fs",
] as const;

// Available modules for autocomplete
export const AVAILABLE_MODULES = [
	"auth-module",
	"net-module",
	"entropy-core",
	"locale-config",
	"time-sync",
	"package-core",
	"core-utils",
	"gfx-module",
] as const;

export {
	BOOT_BANNER,
	HELP_TEXT,
	getModuleListing,
	COMMAND_NOT_FOUND,
	showStatus,
	showMission,
	nextHint,
	listFragments,
	resolveFragment,
	loadModule,
	clearScreen,
	isSafeModeComplete,
};

// Zod schemas for command validation
const ModuleIdSchema = z.enum([
	"auth-module",
	"net-module",
	"entropy-core",
	"locale-config",
	"time-sync",
	"package-core",
	"core-utils",
	"gfx-module",
]);

const FragmentIdSchema = z.string().regex(/^0x[a-f0-9]{2}$/i);

/**
 * Parse command input into command name and arguments.
 */
function parseCommand(input: string): { command: string; args: string[] } {
	const trimmed = input.trim();
	const parts = trimmed.split(/\s+/);
	const command = parts[0] || "";
	const args = parts.slice(1);
	return { command, args };
}

/**
 * Command handler function type
 */
type CommandHandler = (args: string[]) => string;

/**
 * Handle load command with validation
 */
function handleLoad(args: string[]): string {
	if (args.length === 0) {
		return getModuleListing();
	}
	const module = args[0];
	const validation = ModuleIdSchema.safeParse(module);
	if (!validation.success) {
		return `[ERROR] Invalid module name '${module}'. Type 'load' to see available modules.`;
	}
	return loadModule(validation.data);
}

/**
 * Handle fragment command with validation
 */
function handleFragment(args: string[]): string {
	if (args.length === 0) {
		return listFragments();
	}
	const fragmentId = args[0];
	const validation = FragmentIdSchema.safeParse(fragmentId);
	if (!validation.success) {
		return `[ERROR] Invalid fragment ID format. Expected format: 0xXX (e.g., 0xa3)`;
	}
	return resolveFragment(validation.data);
}

/**
 * Handle startx command (desktop transition)
 */
function handleStartx(): string {
	if (!isSafeModeComplete()) {
		return `[ERROR] System not ready for GUI.
Complete all critical tasks and enable gfx-module first.
Use 'mission' to check progress.`;
	}
	return `[OK] Starting X server...
[OK] Display subsystem initialized.
[OK] Transitioning to desktop environment...`;
}

/**
 * Handle wifi command with subcommands
 */
function handleWifi(args: string[]): string {
	if (args.length === 0) {
		return wifiHelp();
	}
	const subcommand = args[0];
	if (subcommand === "scan") {
		return wifiScan();
	}
	if (subcommand === "crack") {
		if (args.length < 2) {
			return wifiHelp();
		}
		return wifiCrack(args[1]);
	}
	if (subcommand === "connect") {
		if (args.length < 2) {
			return wifiHelp();
		}
		return wifiConnect(args[1]);
	}
	return wifiHelp();
}

/**
 * Handle filesystem command with subcommands
 */
function handleFs(args: string[]): string {
	if (args.length === 0) {
		return fsHelp();
	}
	const subcommand = args[0];
	if (subcommand === "ls") {
		return fsLs(args[1]);
	}
	if (subcommand === "cat") {
		return fsCat(args[1]);
	}
	return fsHelp();
}

/**
 * Command map for routing commands to handlers
 */
const COMMAND_HANDLERS: Record<string, CommandHandler> = {
	help: () => HELP_TEXT,
	status: () => showStatus(),
	clear: () => clearScreen(),
	mission: () => showMission(),
	hint: () => nextHint(),
	load: handleLoad,
	fragment: handleFragment,
	startx: () => handleStartx(),
	ping: (args: string[]) => ping(args[0]),
	netcheck: () => netCheck(),
	wifi: handleWifi,
	fs: handleFs,
};

/**
 * Route a raw command line into the simulation core.
 * Uses a command map for cleaner routing and easier extension.
 */
export function runCommand(input: string): string {
	const trimmed = input.trim();
	if (!trimmed) {
		return "";
	}

	const { command, args } = parseCommand(trimmed);
	const handler = COMMAND_HANDLERS[command];

	if (!handler) {
		return COMMAND_NOT_FOUND;
	}

	try {
		return handler(args);
	} catch (error) {
		return `[ERROR] Command execution failed: ${error instanceof Error ? error.message : String(error)
			}`;
	}
}


