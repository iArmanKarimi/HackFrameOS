export { BOOT_LOG } from "./boot-log";

// --- Constants & Boot banner ---
const OS_VERSION = "HackFrameOS v0.1";
export const BOOT_BANNER = `${OS_VERSION}

[BOOT] Kernel handshake........ OK
[BOOT] Memory map.............. OK
[BOOT] Display driver.......... MISSING
[BOOT] Entering fallback terminal (TTY0)

[    0.000089] Launching terminal interface...
`;

export const COMMAND_NOT_FOUND = `bash: command not found. Type 'help' for available commands.`;

export const HELP_TEXT = `Available commands:
  load           Load subsystems
  load [module]  Load a specific subsystem
  status         View current system state
  fragments      Inspect boot fragments
  fragment [id]  Attempt to resolve a fragment
`;

export const MODULE_LISTING = `[LOAD] Available modules:
  └─ auth-module      [ ]
  └─ net-module       [ ]
  └─ entropy-core     [ ]
  └─ locale-config    [ ]
  └─ time-sync        [ ]
  └─ package-core     [ ]
     └─ core-utils    [ ]
        └─ gfx-module [ ]
Type 'load [module]' to activate.
`;

// --- Module outputs (cinematic hard-coded lines) ---
const MODULE_OUTPUTS: Record<string, string> = {
  "auth-module": `[LOAD] Subsystem /auth/null initialized  
[OK] User identity handshake active`,

  "net-module": `[LOAD] Subsystem /net/ghost online  
[OK] IP stack: 127.0.0.1  
[OK] Ping loopback: success`,

  "entropy-core": `[LOAD] entropy-core activated  
[OK] Entropy index: 0.42`,

  "locale-config": `[LOAD] Locale set: en_US.UTF-8  
[OK] Encoding: UTF-8  
[OK] Console dimensions fixed`,

  "time-sync": `[LOAD] Clock sync: internal oscillator  
[OK] Kernel tick rate: 60Hz  
[OK] Timezone: UTC`,

  "package-core": `[LOAD] Package manager initialized  
[OK] Repositories mounted  
[OK] Ready to install tools`,

  "core-utils": `[LOAD] core-utils online  
[OK] Added commands: ls, cat, ps, kill, cd, rm, mv`,
};

// --- Module state & types ---
type ModuleId =
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

// Dependencies (hierarchy)
const moduleDependencies: Partial<Record<ModuleId, ModuleId>> = {
  "core-utils": "package-core",
  "gfx-module": "core-utils",
};

// --- Fragments tied to modules ---
type FragmentState = "RESOLVED" | "UNRESOLVED";

interface BootFragment {
  id: string;
  description: string;
  origin: ModuleId;
  status: FragmentState;
}

const bootFragments: BootFragment[] = [
  {
    id: "0001A3F2",
    description: "orphaned syscall",
    origin: "auth-module",
    status: "UNRESOLVED",
  },
  {
    id: "0001A3F3",
    description: "ghost port pinged",
    origin: "net-module",
    status: "UNRESOLVED",
  },
  {
    id: "0001A3F5",
    description: "entropy seed missing",
    origin: "entropy-core",
    status: "UNRESOLVED",
  },
  {
    id: "0001A3F7",
    description: "invalid locale binding",
    origin: "locale-config",
    status: "UNRESOLVED",
  },
  {
    id: "0001A3F8",
    description: "oscillator drift detected",
    origin: "time-sync",
    status: "UNRESOLVED",
  },
  {
    id: "0001A3F9",
    description: "repo mount failure",
    origin: "package-core",
    status: "UNRESOLVED",
  },
  {
    id: "0001A3FA",
    description: "framebuffer handshake failed",
    origin: "gfx-module",
    status: "UNRESOLVED",
  },
];

// --- Command implementations ---
export function showStatus(): string {
  const unresolvedCount = bootFragments.filter(
    (f) => f.status === "UNRESOLVED"
  ).length;

  return `[STATUS] ${OS_VERSION}  
  Kernel: initialized  
  Memory: 512KB base / 2048KB extended  
  Subsystems:
  └─ auth-module      [${moduleStates["auth-module"]}]
  └─ net-module       [${moduleStates["net-module"]}]
  └─ entropy-core     [${moduleStates["entropy-core"]}]
  └─ locale-config    [${moduleStates["locale-config"]}]
  └─ time-sync        [${moduleStates["time-sync"]}]
  └─ package-core     [${moduleStates["package-core"]}]
     └─ core-utils    [${moduleStates["core-utils"]}]
        └─ gfx-module [${moduleStates["gfx-module"]}]
  Boot fragments: ${unresolvedCount} unresolved
`;
}

export function listFragments(): string {
  let resolved = bootFragments.filter((f) => f.status === "RESOLVED");
  let unresolved = bootFragments.filter((f) => f.status === "UNRESOLVED");
  let bootFragmentsSorted = [...resolved, ...unresolved];
  return `[FRAGMENTS] Retrieved boot fragment log...
${bootFragmentsSorted
  .map((f) => ` └─ [${f.id}] [${f.status}] ${f.description}`)
  .join("\n")}
Use 'fragment [id]' to resolve.`;
}

export function resolveFragment(id: string): string {
  const frag = bootFragments.find((f) => f.id === id);
  if (!frag) return `[ERROR] Fragment ${id} not found`;
  if (frag.status === "RESOLVED") return `[OK] Fragment ${id} already resolved`;

  if (moduleStates[frag.origin] !== "OK") {
    return `[ERROR] Fragment ${id} requires ${frag.origin} to be loaded`;
  }

  frag.status = "RESOLVED";
  return `[FRAGMENT ${id}]
[Module] ${frag.origin}
[Status] resolving...
[OK] Dependency detected: ${frag.origin} active
[OK] Fragment ${id} resolved`;
}

// --- Module loading (with gating + gfx dramatization) ---
let gfxLoadAttempts = 0;

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
    return `[LOAD] gfx-module initializing...
[OK] Subsystem /core/gfx ready.`;
  }

  // Normal modules
  if (MODULE_OUTPUTS[id]) {
    moduleStates[id] = "OK";
    return MODULE_OUTPUTS[id];
  }

  moduleStates[id] = "OK";
  return `[OK] ${id} initialized`;
}

// --- Clear command ---
function clearScreen(): string {
  return `\x1Bc`;
}

// --- Command router ---
export function runCommand(input: string): string {
  const trimmed = input.trim();
  if (trimmed === "help") return HELP_TEXT;
  if (trimmed === "load") return MODULE_LISTING;
  if (trimmed === "status") return showStatus();
  if (trimmed === "fragments") return listFragments();
  if (trimmed === "clear") return clearScreen();

  if (trimmed.startsWith("load ")) return loadModule(trimmed.slice(5));
  if (trimmed.startsWith("fragment ")) return resolveFragment(trimmed.slice(9));

  return COMMAND_NOT_FOUND;
}

// --- Demo run ---
function demo() {
  console.log(BOOT_BANNER);
  console.log(HELP_TEXT);
  console.log(MODULE_LISTING);

  console.log(runCommand("load auth-module"));
  console.log(runCommand("load net-module"));
  console.log(runCommand("load entropy-core"));
  console.log(runCommand("fragment 0001A3F5")); // resolves after entropy-core
  console.log(runCommand("status"));

  console.log(runCommand("load package-core"));
  console.log(runCommand("load core-utils"));
  console.log(runCommand("load gfx-module")); // fail first
  console.log(runCommand("load gfx-module")); // succeed second
  console.log(runCommand("status"));
}
