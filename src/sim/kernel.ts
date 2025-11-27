export { BOOT_LOG } from "../components/BIOS/boot-log";
import ansiEscapes from "ansi-escapes";

// --- Constants & Boot banner ---
const OS_VERSION = "HackFrameOS v0.1";

// TTY-authentic formatting: only green for OK, everything else white
const OK = (text: string) => `\x1b[32m${text}\x1b[0m`; // Green for OK (authentic Linux TTY)
const plain = (text: string) => text; // Plain white (default)

export const BOOT_BANNER = `${OS_VERSION}
 
[BOOT] Kernel handshake........ ${OK("OK")}
[BOOT] Memory map.............. ${OK("OK")}
[BOOT] Display driver.......... MISSING
[BOOT] Entering fallback terminal (TTY0)
 
[STATE] Image status: DEGRADED (SAFE MODE)
[STATE] Operator intervention required to restore core subsystems.
[HINT] Type 'mission' to view objectives or 'help' for available commands.
 
[    0.000089] Launching terminal interface...
`;

export const COMMAND_NOT_FOUND =
	`bash: command not found. Type 'help' for available commands.`;

export const HELP_TEXT = `Available commands:
	load              Load subsystems
	load [module]     Load a specific subsystem
	status            View current system state
	fragment          Inspect boot fragments
	fragment [id]     Attempt to resolve a fragment
	mission           Show high-level rehabilitation objectives
	hint              Contextual guidance for the next step
	startx            Launch desktop GUI (requires completion)
	clear             Clear the terminal screen
`;

export function getModuleListing(): string {
	const formatStatus = (state: ModuleState) =>
		state === "OK" ? OK("[OK]") : "[ ]";
	return `[LOAD] Available modules:
	└─ auth-module      ${formatStatus(moduleStates["auth-module"])}
	└─ net-module       ${formatStatus(moduleStates["net-module"])}
	└─ entropy-core     ${formatStatus(moduleStates["entropy-core"])}
	└─ locale-config     ${formatStatus(moduleStates["locale-config"])}
	└─ time-sync        ${formatStatus(moduleStates["time-sync"])}
	└─ package-core     ${formatStatus(moduleStates["package-core"])}
		 └─ core-utils    ${formatStatus(moduleStates["core-utils"])}
				└─ gfx-module ${formatStatus(moduleStates["gfx-module"])}
Type 'load [module]' to activate.
`;
}

// --- Module state & types ---
export type ModuleId =
	| "auth-module"
	| "net-module"
	| "entropy-core"
	| "locale-config"
	| "time-sync"
	| "package-core"
	| "core-utils"
	| "gfx-module";

type ModuleState = "OK" | "MISSING";

const moduleStates: Record<ModuleId, ModuleState> = {
	"auth-module": "MISSING",
	"net-module": "MISSING",
	"entropy-core": "MISSING",
	"locale-config": "MISSING",
	"time-sync": "MISSING",
	"package-core": "MISSING",
	"core-utils": "MISSING",
	"gfx-module": "MISSING",
};

// --- Mission / task tracking for rehab narrative ---
type TaskId =
	| "auth-online"
	| "net-online"
	| "entropy-online"
	| "all-fragments"
	| "gfx-online";

interface Task {
	label: string;
	done: () => boolean;
	critical?: boolean;
}

// --- Fragments tied to modules ---
export type FragmentState = "RESOLVED" | "UNRESOLVED";

export interface BootFragment {
	id: string;
	description: string;
	origin: ModuleId;
	status: FragmentState;
}

const bootFragments: BootFragment[] = [
	{
		id: "0xa3",
		description: "orphaned syscall",
		origin: "auth-module",
		status: "UNRESOLVED",
	},
	{
		id: "0xb7",
		description: "ghost port pinged",
		origin: "net-module",
		status: "UNRESOLVED",
	},
	{
		id: "0xd4",
		description: "entropy seed missing",
		origin: "entropy-core",
		status: "UNRESOLVED",
	},
	{
		id: "0xf2",
		description: "invalid locale binding",
		origin: "locale-config",
		status: "UNRESOLVED",
	},
	{
		id: "0x9c",
		description: "oscillator drift detected",
		origin: "time-sync",
		status: "UNRESOLVED",
	},
	{
		id: "0xe1",
		description: "repo mount failure",
		origin: "package-core",
		status: "UNRESOLVED",
	},
	{
		id: "0x8f",
		description: "framebuffer handshake failed",
		origin: "gfx-module",
		status: "UNRESOLVED",
	},
];

const TASKS: Record<TaskId, Task> = {
	"auth-online": {
		label: "Initialize auth-module",
		done: () => moduleStates["auth-module"] === "OK",
		critical: true,
	},
	"net-online": {
		label: "Bring net-module online",
		done: () => moduleStates["net-module"] === "OK",
		critical: true,
	},
	"entropy-online": {
		label: "Stabilize entropy-core",
		done: () => moduleStates["entropy-core"] === "OK",
		critical: false,
	},
	"all-fragments": {
		label: "Resolve all boot fragments",
		done: () => bootFragments.every((f) => f.status === "RESOLVED"),
		critical: true,
	},
	"gfx-online": {
		label: "Enable gfx-module (exit fallback TTY)",
		done: () => moduleStates["gfx-module"] === "OK",
		critical: false,
	},
};

// Dependencies (hierarchy)
const moduleDependencies: Partial<Record<ModuleId, ModuleId>> = {
	"core-utils": "package-core",
	"gfx-module": "core-utils",
};

// --- Module outputs (cinematic hard-coded lines) ---
const MODULE_OUTPUTS: Record<string, string> = {
	"auth-module": `[LOAD] Subsystem /auth/null initialized  
${OK("[OK]")} User identity handshake active`,

	"net-module": `[LOAD] Subsystem /net/ghost online  
${OK("[OK]")} IP stack: 127.0.0.1  
${OK("[OK]")} Ping loopback: success`,

	"entropy-core": `[LOAD] entropy-core activated  
${OK("[OK]")} Entropy index: 0.42`,

	"locale-config": `[LOAD] Locale set: en_US.UTF-8  
${OK("[OK]")} Encoding: UTF-8  
${OK("[OK]")} Console dimensions fixed`,

	"time-sync": `[LOAD] Clock sync: internal oscillator  
${OK("[OK]")} Kernel tick rate: 60Hz  
${OK("[OK]")} Timezone: UTC`,

	"package-core": `[LOAD] Package manager initialized  
${OK("[OK]")} Repositories mounted  
${OK("[OK]")} Ready to install tools`,

	"core-utils": `[LOAD] core-utils online  
${OK("[OK]")} Added commands: ls, cat, ps, kill, cd, rm, mv`,
};

// --- Kernel/status helpers ---
export function showStatus(): string {
	const unresolvedCount = bootFragments.filter(
		(f) => f.status === "UNRESOLVED"
	).length;

	const formatStatus = (state: ModuleState) =>
		state === "OK" ? OK("[OK]") : "[ ]";

	return `[STATUS] ${OS_VERSION}  
	Kernel: initialized  
	Memory: 512KB base / 2048KB extended  
	Subsystems:
	└─ auth-module      ${formatStatus(moduleStates["auth-module"])}
	└─ net-module       ${formatStatus(moduleStates["net-module"])}
	└─ entropy-core     ${formatStatus(moduleStates["entropy-core"])}
	└─ locale-config     ${formatStatus(moduleStates["locale-config"])}
	└─ time-sync        ${formatStatus(moduleStates["time-sync"])}
	└─ package-core     ${formatStatus(moduleStates["package-core"])}
		 └─ core-utils    ${formatStatus(moduleStates["core-utils"])}
				└─ gfx-module ${formatStatus(moduleStates["gfx-module"])}
	Boot fragments: ${unresolvedCount > 0 ? `${unresolvedCount} unresolved` : OK("all resolved")}
`;
}

export function showMission(): string {
	const lines = Object.values(TASKS)
		.map((task) => {
			const mark = task.done() ? OK("[x]") : "[ ]";
			const tag = task.critical ? " (critical)" : "";
			return `  ${mark} ${task.label}${tag}`;
		})
		.join("\n");

	return `[MISSION] Operator objectives:
${lines}
 
System exits degraded state when all critical tasks are complete.
Use 'status', 'load', and 'fragment' to make progress.
`;
}

/**
 * Check if SafeMode rehabilitation is complete.
 * Requires all critical tasks done AND gfx-module online for GUI transition.
 */
export function isSafeModeComplete(): boolean {
	const criticalTasks = Object.values(TASKS).filter((t) => t.critical);
	const allCriticalDone = criticalTasks.every((t) => t.done());
	const gfxOnline = moduleStates["gfx-module"] === "OK";
	return allCriticalDone && gfxOnline;
}

export function nextHint(): string {
	if (moduleStates["auth-module"] !== "OK") {
		return `[HINT] auth-module is still offline.
Use 'load auth-module' to bring identity handshake online.`;
	}

	if (moduleStates["net-module"] !== "OK") {
		return `[HINT] Network stack is dormant.
Use 'load net-module' to activate /net/ghost.`;
	}

	if (moduleStates["entropy-core"] !== "OK") {
		return `[HINT] Entropy index is pinned at 0.00.
Use 'load entropy-core' before attempting to resolve entropy-related fragments.`;
	}

	if (!bootFragments.every((f) => f.status === "RESOLVED")) {
		return `[HINT] Boot fragments remain unresolved.
Use 'fragment' to list them and 'fragment [id]' after the relevant module is online.`;
	}

	if (moduleStates["gfx-module"] !== "OK") {
		return `[HINT] System is stable but display driver is missing.
Use 'load package-core' then 'load core-utils' and finally 'load gfx-module'.`;
	}

	return `${OK("[HINT]")} All critical tasks appear complete.
Use 'status' to verify system health or explore freely.`;
}

export function listFragments(): string {
	const resolved = bootFragments.filter((f) => f.status === "RESOLVED");
	const unresolved = bootFragments.filter((f) => f.status === "UNRESOLVED");
	const bootFragmentsSorted = [...resolved, ...unresolved];
	const formatStatus = (status: FragmentState) =>
		status === "RESOLVED" ? OK("[OK]") : "[ ]";
	return `[FRAGMENTS] Retrieved boot fragment log...
${bootFragmentsSorted
			.map((f) => ` └─ ${f.id}. ${formatStatus(f.status)} ${f.description}`)
			.join("\n")}
Use 'fragment [id]' to resolve.`;
}

export function resolveFragment(id: string): string {
	const frag = bootFragments.find((f) => f.id === id);
	if (!frag) return `[ERROR] Fragment ${id} not found`;
	if (frag.status === "RESOLVED")
		return `${OK("[OK]")} Fragment ${id} already resolved`;

	if (moduleStates[frag.origin] !== "OK") {
		return `[ERROR] Fragment ${id} requires ${frag.origin} to be loaded`;
	}

	frag.status = "RESOLVED";
	return `[FRAGMENT ${id}]
[Module] ${frag.origin}
[Status] resolving...
${OK("[OK]")} Dependency detected: ${frag.origin} active
${OK("[OK]")} Fragment ${id} resolved`;
}

// --- Module loading (with gating + gfx dramatization) ---
let gfxLoadAttempts = 0;

import { appendLog } from "./fs";

export function loadModule(module: string): string {
	const id = module as ModuleId;

	if (!(id in moduleStates)) {
		return `[ERROR] Module '${module}' not found. Type 'load' to list available modules.`;
	}

	const dependency = moduleDependencies[id];
	if (dependency && moduleStates[dependency] !== "OK") {
		return `[ERROR] ${id} requires ${dependency} to be loaded`;
	}

	// Special case: gfx-module
	if (id === "gfx-module") {
		// Check if its fragment is resolved
		const gfxFrag = bootFragments.find((f) => f.origin === "gfx-module");
		if (gfxFrag && gfxFrag.status !== "RESOLVED") {
			return `[ERROR] gfx-module cannot initialize: unresolved fragment ${gfxFrag.id} (${gfxFrag.description})`;
		}

		// Dramatic retry sequence
		gfxLoadAttempts++;
		if (gfxLoadAttempts === 1) {
			return `[LOAD] gfx-module initializing...
[ERROR] Subsystem /core/gfx failed to bind frame buffer.`;
		}

		moduleStates[id] = "OK";
		appendLog(
			"/var/log/hackframe.log",
			`[OK] gfx-module online, framebuffer bound (simulation only)`
		);
		return `[LOAD] gfx-module initializing...
${OK("[OK]")} Subsystem /core/gfx ready.`;
	}

	// Normal modules
	if (MODULE_OUTPUTS[id]) {
		moduleStates[id] = "OK";
		// MODULE_OUTPUTS already has OK() applied, so return as-is
		appendLog(
			"/var/log/hackframe.log",
			`[OK] ${id} loaded into safe-mode kernel (simulation only)`
		);
		return MODULE_OUTPUTS[id];
	}

	moduleStates[id] = "OK";
	appendLog(
		"/var/log/hackframe.log",
		`[OK] ${id} initialized (generic module, simulation only)`
	);
	return `${OK("[OK]")} ${id} initialized`;
}

// --- Clear command ---
export function clearScreen(): string {
	return ansiEscapes.clearScreen;
}

// --- Kernel state helpers (for future reset/inspection) ---
export function getModuleStates(): Readonly<Record<ModuleId, ModuleState>> {
	return moduleStates;
}

export function getBootFragments(): ReadonlyArray<BootFragment> {
	return bootFragments;
}

/**
 * Get the number of loaded modules (for visual feedback)
 */
export function getLoadedModuleCount(): number {
	return Object.values(moduleStates).filter(state => state === "OK").length;
}

/**
 * Get the number of resolved fragments (for visual feedback)
 */
export function getResolvedFragmentCount(): number {
	return bootFragments.filter(f => f.status === "RESOLVED").length;
}


