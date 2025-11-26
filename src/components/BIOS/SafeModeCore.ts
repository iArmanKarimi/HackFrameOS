export { BOOT_LOG } from "./boot-log";

// --- Constants & Boot banner ---
const OS_VERSION = "HackFrameOS v0.1";
export const BOOT_BANNER = `${OS_VERSION}

[BOOT] Kernel handshake........ OK
[BOOT] Memory map.............. OK
[BOOT] Display driver.......... MISSING
[BOOT] Entering fallback terminal (TTY0)

[STATE] Image status: DEGRADED (SAFE MODE)
[STATE] Operator intervention required to restore core subsystems.
[HINT] Type 'mission' to view objectives or 'help' for available commands.

[    0.000089] Launching terminal interface...
`;

export const COMMAND_NOT_FOUND = `bash: command not found. Type 'help' for available commands.`;

export const HELP_TEXT = `Available commands:
  load              Load subsystems
  load [module]     Load a specific subsystem
  status            View current system state
  fragments         Inspect boot fragments
  fragment [id]     Attempt to resolve a fragment
  mission           Show high-level rehabilitation objectives
  hint              Contextual guidance for the next step
  wifi              Show Wi-Fi help (simulation)
  wifi scan         List nearby access points (simulation)
  wifi crack [id]   Attempt to gain access to an access point (simulation)
  wifi connect [id] Attach net-module to a cracked access point (simulation)
  netcheck          Check external connectivity state
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

// --- Simulated Wi-Fi / external connectivity layer ---
type WifiId = "ap-01" | "ap-02" | "ap-ghost";

interface WifiAp {
  id: WifiId;
  ssid: string;
  signal: number; // 0-100
  locked: boolean;
  cracked: boolean;
}

let wifiAps: WifiAp[] = [
  { id: "ap-01", ssid: "HF_LAB_NET", signal: 78, locked: true, cracked: false },
  { id: "ap-02", ssid: "Café-Guest", signal: 42, locked: true, cracked: false },
  { id: "ap-ghost", ssid: "GHOSTLINK", signal: 15, locked: true, cracked: false },
];

let connectedApId: WifiId | null = null;
let hasExternalConnectivity = false;

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

export function showMission(): string {
  const lines = Object.values(TASKS)
    .map((task) => {
      const mark = task.done() ? "[x]" : "[ ]";
      const tag = task.critical ? " (critical)" : "";
      return `  ${mark} ${task.label}${tag}`;
    })
    .join("\n");

  return `[MISSION] Operator objectives:
${lines}

System exits degraded state when all critical tasks are complete.
Use 'status', 'load', and 'fragments' to make progress.
`;
}

function nextHint(): string {
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
Use 'fragments' to list them and 'fragment [id]' after the relevant module is online.`;
  }

  if (moduleStates["gfx-module"] !== "OK") {
    return `[HINT] System is stable but display driver is missing.
Use 'load package-core' then 'load core-utils' and finally 'load gfx-module'.`;
  }

  return `[HINT] All critical tasks appear complete.
Use 'status' to verify system health or explore freely.`;
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

// --- Wi-Fi command helpers (simulation only) ---
function wifiHelp(): string {
  return `[WIFI] Simulated wireless interface
  wifi scan            List nearby access points
  wifi crack [id]      Attempt to gain access (simulation only)
  wifi connect [id]    Attach to a cracked AP
  netcheck             Verify external connectivity state
Note: Requires net-module to be online.`;
}

function ensureNetOnline(): string | null {
  if (moduleStates["net-module"] !== "OK") {
    return `[ERROR] net-module offline. Use 'load net-module' before accessing Wi-Fi tools.`;
  }
  return null;
}

function wifiScan(): string {
  const netError = ensureNetOnline();
  if (netError) return netError;

  const lines = wifiAps
    .map(
      (ap) =>
        `  └─ [${ap.id}] ${ap.ssid}  signal=${ap.signal}%  locked=${ap.locked ? "yes" : "no"}  cracked=${ap.cracked ? "yes" : "no"}`
    )
    .join("\n");

  return `[WIFI] Nearby access points (simulated):
${lines}
Use 'wifi crack [id]' to attempt access.`;
}

function wifiCrack(id: string): string {
  const netError = ensureNetOnline();
  if (netError) return netError;

  const ap = wifiAps.find((a) => a.id === id);
  if (!ap) return `[ERROR] Access point '${id}' not found. Use 'wifi scan' first.`;
  if (ap.cracked) return `[WIFI] AP ${id} already cracked.`;

  // Simple deterministic "success" logic: only HF_LAB_NET is actually crackable.
  if (ap.id === "ap-01") {
    ap.cracked = true;
    ap.locked = false;
    return `[WIFI] Running simulated attack against ${ap.ssid}...
[OK] Key material reconstructed (simulation only).
[OK] Access point ${id} marked as cracked. Use 'wifi connect ${id}'.`;
  }

  return `[WIFI] Attempted attack on ${ap.ssid}...
[ERROR] Simulation: this AP resists current toolset. Try a different target.`;
}

function wifiConnect(id: string): string {
  const netError = ensureNetOnline();
  if (netError) return netError;

  const ap = wifiAps.find((a) => a.id === id);
  if (!ap) return `[ERROR] Access point '${id}' not found.`;
  if (!ap.cracked) {
    return `[ERROR] Cannot connect to ${id}: access point not cracked in simulation.
Use 'wifi crack ${id}' first.`;
  }

  connectedApId = ap.id;
  hasExternalConnectivity = true;

  return `[WIFI] Interface bound to ${ap.ssid} (${ap.id}).
[NET] External connectivity: SIMULATED-ONLINE.
Use 'netcheck' to verify status.`;
}

function netCheck(): string {
  if (moduleStates["net-module"] !== "OK") {
    return `[NETCHECK] net-module: OFFLINE
[RESULT] External connectivity unavailable.`;
  }

  if (!connectedApId || !hasExternalConnectivity) {
    return `[NETCHECK] net-module: ONLINE
[NETCHECK] Wi-Fi binding: NONE
[RESULT] No route to external network in simulation.`;
  }

  const ap = wifiAps.find((a) => a.id === connectedApId);
  const name = ap ? ap.ssid : connectedApId;
  return `[NETCHECK] net-module: ONLINE
[NETCHECK] Wi-Fi binding: ${name}
[RESULT] External connectivity: SIMULATED-ONLINE.`;
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
  if (trimmed === "mission") return showMission();
  if (trimmed === "hint") return nextHint();
  if (trimmed === "wifi") return wifiHelp();
  if (trimmed === "wifi scan") return wifiScan();
  if (trimmed === "netcheck") return netCheck();

  if (trimmed.startsWith("wifi crack ")) {
    return wifiCrack(trimmed.slice("wifi crack ".length));
  }
  if (trimmed.startsWith("wifi connect ")) {
    return wifiConnect(trimmed.slice("wifi connect ".length));
  }

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
