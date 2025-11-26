// Thin command router for the Safe Mode terminal.
// Delegates to pure simulation modules under src/sim.

import {
  BOOT_BANNER,
  HELP_TEXT,
  MODULE_LISTING,
  COMMAND_NOT_FOUND,
  showStatus,
  showMission,
  nextHint,
  listFragments,
  resolveFragment,
  loadModule,
  clearScreen,
} from "../../sim/kernel";

// Keep BOOT_LOG co-located with BIOS visuals.
export { BOOT_LOG } from "./boot-log";

export {
  BOOT_BANNER,
  HELP_TEXT,
  MODULE_LISTING,
  COMMAND_NOT_FOUND,
  showStatus,
  showMission,
  nextHint,
  listFragments,
  resolveFragment,
  loadModule,
  clearScreen,
};

/**
 * Route a raw command line into the simulation core.
 * All branching lives here; underlying behavior is implemented in src/sim/*.
 */
export function runCommand(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  // Core rehab / boot commands
  if (trimmed === "help") return HELP_TEXT;
  if (trimmed === "load") return MODULE_LISTING;
  if (trimmed === "status") return showStatus();
  if (trimmed === "fragments") return listFragments();
  if (trimmed === "clear") return clearScreen();

  // Mission & guidance
  if (trimmed === "mission") return showMission();
  if (trimmed === "hint") return nextHint();

  // Module / fragment commands
  if (trimmed.startsWith("load ")) return loadModule(trimmed.slice(5));
  if (trimmed.startsWith("fragment ")) return resolveFragment(trimmed.slice(9));

  // Fallback
  return COMMAND_NOT_FOUND;
}


