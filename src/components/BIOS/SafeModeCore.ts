// Thin command router for the Safe Mode terminal.
// Delegates to pure simulation modules under src/_deprecated.

import { z } from "zod";
import minimist from "minimist";
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
} from "../../_deprecated/kernel";
import { wifiHelp, wifiScan, wifiCrack, wifiConnect, netCheck, ping } from "../../_deprecated/net";
import { fsHelp, fsLs, fsCat } from "../../_deprecated/fs";
 
// Keep BOOT_LOG co-located with BIOS visuals.
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
 * Simple whitespace-based splitting (minimist import kept for future flag support).
 */
function parseCommand(input: string): { command: string; args: string[] } {
	const trimmed = input.trim();
	const parts = trimmed.split(/\s+/);
	const command = parts[0] || "";
	const args = parts.slice(1);

	return { command, args };
}

/**
 * Route a raw command line into the simulation core.
 * All branching lives here; underlying behavior is implemented in src/_deprecated/*.
 * Now uses minimist for argument parsing and zod for validation.
 */
export function runCommand(input: string): string {
	const trimmed = input.trim();
	if (!trimmed) return "";

	const { command, args } = parseCommand(trimmed);

	// Core rehab / boot commands
	if (command === "help") return HELP_TEXT;
	if (command === "status") return showStatus();
	if (command === "clear") return clearScreen();

	// Mission & guidance
	if (command === "mission") return showMission();
	if (command === "hint") return nextHint();

	// Load command with validation
	if (command === "load") {
		// No args: show available modules
		if (args.length === 0) return getModuleListing();
		const module = args[0];
		// Validate module name against known modules to prevent typos/attacks
		const validation = ModuleIdSchema.safeParse(module);
		if (!validation.success) {
			return `[ERROR] Invalid module name '${module}'. Type 'load' to see available modules.`;
		}
		return loadModule(validation.data);
	}

	// Fragment command with validation
	if (command === "fragment") {
		// No args: list all available fragments
		if (args.length === 0) return listFragments();
		const fragmentId = args[0];
		// Validate hex format (0xXX) to prevent invalid input
		const validation = FragmentIdSchema.safeParse(fragmentId);
		if (!validation.success) {
			return `[ERROR] Invalid fragment ID format. Expected format: 0xXX (e.g., 0xa3)`;
		}
		return resolveFragment(validation.data);
	}

	// Desktop transition (requires completion)
	if (command === "startx") {
		if (!isSafeModeComplete()) {
			return `[ERROR] System not ready for GUI.
Complete all critical tasks and enable gfx-module first.
Use 'mission' to check progress.`;
		}
		return `[OK] Starting X server...
[OK] Display subsystem initialized.
[OK] Transitioning to desktop environment...`;
	}

	// Network commands
	if (command === "wifi") {
		// No args or unknown subcommand: show help
		if (args.length === 0) return wifiHelp();
		const subcommand = args[0];
		if (subcommand === "scan") return wifiScan();
		if (subcommand === "crack") {
			// Require AP ID argument
			if (args.length < 2) return wifiHelp();
			return wifiCrack(args[1]);
		}
		if (subcommand === "connect") {
			// Require AP ID argument
			if (args.length < 2) return wifiHelp();
			return wifiConnect(args[1]);
		}
		// Unknown subcommand: show help
		return wifiHelp();
	}

	if (command === "ping") {
		// ping handles its own argument validation (shows usage if missing)
		return ping(args[0]);
	}

	if (command === "netcheck") {
		// No arguments needed
		return netCheck();
	}

	// Filesystem commands
	if (command === "fs") {
		if (args.length === 0) return fsHelp();
		const subcommand = args[0];
		if (subcommand === "ls") {
			return fsLs(args[1]);
		}
		if (subcommand === "cat") {
			return fsCat(args[1]);
		}
		return fsHelp();
	}

	// Fallback
	return COMMAND_NOT_FOUND;
}
 
 
