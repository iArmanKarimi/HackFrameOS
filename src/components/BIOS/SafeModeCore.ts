// Thin command router for the Safe Mode terminal.
// Delegates to pure simulation modules under src/sim.

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

/**
 * Route a raw command line into the simulation core.
 * All branching lives here; underlying behavior is implemented in src/sim/*.
 */
export function runCommand(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  // Core rehab / boot commands
  if (trimmed === "help") return HELP_TEXT;
  if (trimmed === "load") return getModuleListing();
  if (trimmed === "status") return showStatus();
  if (trimmed === "fragment") return listFragments();
  if (trimmed === "clear") return clearScreen();

  // Mission & guidance
  if (trimmed === "mission") return showMission();
  if (trimmed === "hint") return nextHint();

  // Desktop transition (requires completion)
  if (trimmed === "startx") {
    if (!isSafeModeComplete()) {
      return `[ERROR] System not ready for GUI.
Complete all critical tasks and enable gfx-module first.
Use 'mission' to check progress.`;
    }
    return `[OK] Starting X server...
[OK] Display subsystem initialized.
[OK] Transitioning to desktop environment...`;
  }

  // Module / fragment commands
  if (trimmed.startsWith("load ")) return loadModule(trimmed.slice(5));
  if (trimmed.startsWith("fragment ")) return resolveFragment(trimmed.slice(9));

  // Fallback
  return COMMAND_NOT_FOUND;
}


