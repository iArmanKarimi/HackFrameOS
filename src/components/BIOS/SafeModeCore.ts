// Thin command router for the Safe Mode terminal.
// Delegates to pure simulation modules under src/sim.

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
} from "../../sim/kernel";
 
// Keep BOOT_LOG co-located with BIOS visuals.
export { BOOT_LOG } from "./boot-log";

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
 * Parse command input using minimist for better argument handling.
 */
function parseCommand(input: string): { command: string; args: string[]; parsed: minimist.ParsedArgs } {
	const trimmed = input.trim();
	const parts = trimmed.split(/\s+/);
	const command = parts[0] || "";
	const args = parts.slice(1);
	const parsed = minimist(args, { string: ["_"] });

	return { command, args, parsed };
}

/**
 * Route a raw command line into the simulation core.
 * All branching lives here; underlying behavior is implemented in src/sim/*.
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
		if (args.length === 0) return getModuleListing();
		const module = args[0];
		const validation = ModuleIdSchema.safeParse(module);
		if (!validation.success) {
			return `[ERROR] Invalid module name '${module}'. Type 'load' to see available modules.`;
		}
		return loadModule(validation.data);
	}

	// Fragment command with validation
	if (command === "fragment") {
		if (args.length === 0) return listFragments();
		const fragmentId = args[0];
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

	// Fallback
	return COMMAND_NOT_FOUND;
}
 
 
