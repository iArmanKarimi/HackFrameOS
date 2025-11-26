# HackFrameOS

HackFrameOS is a **retro OS rehabilitation simulator** built with React and TypeScript.

You’re operating a degraded HackFrameOS image that has dropped into **SAFE MODE**.  
Through a cinematic boot log and a safe terminal, you bring core subsystems back online — all inside a sandboxed simulation.

## What this is (and isn’t)

- **All simulated**: Filesystem, networking, and “hacking” are 100% in‑memory. Nothing touches your real OS or network.
- **Focused scope**: One boot flow, one Safe Mode terminal, a handful of guided tools.
- **Extensible**: Core logic lives in `src/sim/*`, so you can add new commands and scenarios without touching the UI.

## Project layout

```text
HackFrameOS
├── src
│   ├── main.tsx              # App entry
│   ├── App.tsx               # Boot → Safe Mode transition
│   ├── index.css             # Global styles
│   ├── components
│   │   └── BIOS
│   │       ├── BootScreen.tsx       # Animated boot log using BOOT_LOG
│   │       ├── SafeModeTerminal.tsx # Terminal UI & input handling
│   │       └── SafeModeCore.ts      # Command router for the sim core
│   ├── sim
│   │   ├── kernel.ts          # Modules, fragments, mission, hints
│   │   ├── fs.ts              # In‑memory filesystem & logs
│   │   └── net.ts             # Wi‑Fi and connectivity simulation
│   ├── txt                    # Narrative text fragments (optional)
│   └── types
│       └── index.d.ts
├── public
│   └── README.md              # Static readme for built bundle
├── package.json
├── tsconfig.json
├── vite.config.ts
├── postcss.config.cjs
└── .gitignore
```

## Running the simulator

```bash
npm install
npm run dev
```

Then open `http://localhost:3000` in your browser, watch the boot log finish, and wait for the Safe Mode prompt.

## Quickstart session

Paste this sequence into the terminal to walk a basic rehab path:

```text
help
mission
status
load auth-module
load net-module
load entropy-core
fragment
fragment 0xd4
fs ls /var/log
fs cat /var/log/hackframe.log
wifi
wifi scan
wifi crack ap-01
wifi connect ap-01
netcheck
ping external
```

## Command reference (all simulated)

Everything below stays inside an in‑memory sandbox; no real system calls or packets.

### Boot & status

- `help` – List available commands.
- `status` – Show module states and unresolved fragment count.
- `load` / `load [module]` – List or load subsystems.
- `fragment` / `fragment [id]` – List boot fragments or resolve a specific fragment.
- `clear` – Clear the terminal.

### Mission & guidance

- `mission` – High‑level objectives and which ones are complete.
- `hint` – Contextual nudge toward the next useful action.

### Filesystem (`sim/fs.ts`)

- `fs` – Filesystem help.
- `fs ls [path]` – List entries under a simulated path (default `/`).
- `fs cat [path]` – View file contents, e.g. `/var/log/hackframe.log`, `/var/log/net.log`.

### Networking (`sim/net.ts`)

- `wifi` – Wi‑Fi help and usage.
- `wifi scan` – List simulated access points.
- `wifi crack [id]` – Pretend to attack an AP (no real networking).
- `wifi connect [id]` – Bind the simulated interface to a cracked AP.
- `netcheck` – Summarize simulated external connectivity state.
- `ping [core|net|external]` – Probe core services, net‑module, or a fake external host.

## Dev & tests

- **Dev server**

  ```bash
  npm run dev
  ```

- **Build / preview**

  ```bash
  npm run build
  npm run serve
  ```

- **Tests**

  ```bash
  npm test
  ```

Vitest covers the simulation core (`sim/kernel`, `sim/net`) and the `SafeModeCore` command router.


