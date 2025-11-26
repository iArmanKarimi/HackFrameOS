# HackFrameOS Simulator – Full Plan

## Goals

- Turn the current prototype into a **cohesive, production-ready OS rehab simulator**.
- Preserve the **cinematic boot + Safe Mode terminal** core, add more system tools, and tighten narrative clarity.
- Keep everything **purely simulated** (no real hacking/network operations) and easy to extend.

## 1. Architecture & Codebase Structure

- **Clarify module boundaries**
- Keep BIOS UI components under [`src/components/BIOS`](src/components/BIOS):
- `BootScreen.tsx` – animated log display using `BOOT_LOG`.
- `SafeModeTerminal.tsx` – terminal UI, input handling, history, colors.
- Introduce a pure logic layer under [`src/sim`](src/sim):
- `kernel.ts` – modules, fragments, mission system, status.
- `net.ts` – Wi‑Fi and external connectivity simulation (currently inside `SafeModeCore.ts`).
- `fs.ts` – in‑memory filesystem and logs (to be added).
- `process.ts` – simple process table for `ps`/`kill` (optional later).
- Slim down [`src/components/BIOS/SafeModeCore.ts`](src/components/BIOS/SafeModeCore.ts) to a **command router** that delegates to these sim modules.

- **Entry & shell**
- Keep [`src/main.tsx`](src/main.tsx) minimal: mount `<App />` and import `index.css`.
- In [`src/App.tsx`](src/App.tsx), manage only **boot → safe mode** transition for now.
- Reserve space for a future `DesktopShell` component (e.g. `src/ui/DesktopShell.tsx`) once rehab is complete.

## 2. Boot Flow & Narrative

- **Boot log and banner**
- Continue sourcing `BOOT_LOG` from [`src/components/BIOS/boot-log.ts`](src/components/BIOS/boot-log.ts).
- Keep the enriched `BOOT_BANNER` text in `SafeModeCore` that:
- States the image is **DEGRADED (SAFE MODE)**.
- Instructs the operator to use `mission`/`help`.

- **Boot experience**
- Use `BOOT_LINE_INTERVAL_MS` for pacing; expose it as a constant for easy tuning.
- In `BootScreen`, ensure:
- Auto-scrolling works via `containerRef`.
- Completion effect calls `onComplete` after a short delay.

## 3. Command System & Learning Progression

- **Tier 1 – Rehab basics (already mostly implemented)**
- Commands: `help`, `status`, `load`, `fragments`, `fragment [id]`, `clear`.
- Make sure `help` and `MODULE_LISTING` descriptions are consistent and beginner-friendly.

- **Tier 2 – Mission & guided setup (now present, refine)**
- Commands: `mission`, `hint`.
- Refine `TASKS` in `SafeModeCore` (or `sim/kernel.ts`) to:
- Distinguish **critical** vs optional tasks.
- Match the actual modules and fragments defined in the sim.
- Ensure `hint` always leads to a valid next action and does not get stuck.

- **Tier 3 – Networking via Wi‑Fi (already prototyped)**
- Commands: `wifi`, `wifi scan`, `wifi crack [id]`, `wifi connect [id]`, `netcheck`.
- Keep net logic pure in `sim/net.ts`:
- Define `WifiAp` list, `connectedApId`, `hasExternalConnectivity`.
- Expose functions `wifiHelp`, `wifiScan`, `wifiCrack`, `wifiConnect`, `netCheck`.
- Ensure commands explicitly label themselves as **simulation only**.

- **Tier 4 – Filesystem & logs (to add)**
- Design an in-memory FS in `sim/fs.ts` with:
- Paths like `/var/log/boot.log`, `/etc/hackframe.conf`, `/var/log/net.log`.
- Some files updated when user actions occur (e.g. module loads, Wi‑Fi connect).
- Commands:
- `fs ls [path]` – list pseudo-directories.
- `fs cat [path]` – print file content.
- Wire these into `runCommand` with clear error messages for missing/forbidden paths.

- **Tier 5 – Processes (optional stretch)**
- In `sim/process.ts`, maintain a tiny process table:
- Always include a few system daemons.
- Optionally spawn ephemeral processes when certain modules load.
- Commands:
- `ps` – list processes.
- `kill [id]` – mark process as stopped; optionally impact status (for teaching consequences).

## 4. Terminal UX & Accessibility

- **History & navigation**
- Keep `commandHistory` and `historyIndex` in `SafeModeTerminal`.
- Support:
- `ArrowUp` / `ArrowDown` for cycling through history.
- Clearing history index when a new command is run.

- **Visual feedback**
- Color-code output lines in `SafeModeTerminal` based on content:
- `[ERROR]` → red.
- `[OK]` → green.
- `[HINT]` / `[MISSION]` → cyan or similar.
- Prompt & user commands (`> ...`) → white.
- Maintain a high-contrast theme with `VT323`/monospace fonts and scalable text size.

- **Scrolling & layout**
- Keep the terminal full-screen (`fixed inset-0`) and scrollable via `containerRef`.
- Hide scrollbars visually where feasible while preserving keyboard accessibility.

## 5. Simulation State & Purity

- **Centralize state**
- In `sim/*` modules, store sim state (`moduleStates`, `bootFragments`, Wi‑Fi state, FS, processes) in module-level variables.
- Provide helper functions to:
- Reset state (for future `reboot`/`reset` command).
- Serialize state (optional future: debugging or save/load).

- **No side-effects in UI layer**
- Ensure `SafeModeTerminal` and `BootScreen` only call into pure functions and react hooks.
- All randomness (if introduced) should be controlled/deterministic for consistency.

## 6. Config, Tooling & Quality

- **Tooling already in place**
- `vite` + `@vitejs/plugin-react` for builds.
- `typescript` with `strict` mode.
- `autoprefixer` via `postcss`.

- **Add testing**
- Introduce Vitest and a `test` script in `package.json`.
- Write tests for:
- `runCommand` sequences: ensure expected strings for key commands and flows.
- `sim/kernel` functions: loading modules, resolving fragments, mission completion.
- `sim/net` functions: Wi‑Fi cracking and connectivity rules.

- **Linting & formatting**
- Optionally add ESLint/Prettier configs tuned for React + TS.
- Enforce consistent quotes and semicolons (match existing style).

## 7. Documentation & Onboarding

- **README updates**
- Expand README to include:
- A short narrative: “You are an operator restoring a degraded HackFrameOS image in Safe Mode.”
- A quickstart transcript showing a complete rehab sequence.
- A **command reference** grouped by category (Boot, Mission, Net, FS, Misc).
- Clarification that **all hacking/network behavior is simulated**.

- **Inline docs**
- Add concise JSDoc/TSDoc comments to key sim functions.
- Keep comments focused on intent (why) rather than obvious implementation details.

## 8. Future Extensions (Nice-to-have)

- **Desktop shell after rehab**
- Once all critical tasks are done and `gfx-module` is OK, allow a command (e.g. `startx`) that:
- Switches `App` from SafeModeTerminal to a simple desktop UI component.
- Shows panels for logs, modules, and a smaller terminal window.

- **Scenario/missions system**
- Allow selecting different “images” or scenarios with different fragment configurations.
- Possibly load scenario definitions from JSON under `src/txt/`.

- **Theming & sound**
- Use Tailwind (already loaded via CDN) more consistently from JSX to reduce inline styles.
- Optionally add subtle sound cues (keypress, error, boot chime) via a small audio library.
