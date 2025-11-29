# HackFrameOS Simulator – Full Plan

## Goals

- Turn the current prototype into a **cohesive, production-ready OS rehab simulator**.
- Preserve the **cinematic boot + Safe Mode terminal** core, add more system tools, and tighten narrative clarity.
- Keep everything **purely simulated** (no real hacking/network operations) and easy to extend.

## 1. Architecture & Codebase Structure

- **Component organization**
- Boot UI components under [`src/components/Boot`](src/components/Boot):
- `BootScreen.tsx` – animated log display using `BOOT_LOG`.
- `boot-log.ts` – boot log content.
- Terminal UI components under [`src/components/terminal`](src/components/terminal):
- `SafeModeTerminal.tsx` – terminal UI, input handling, history, colors.
- `SafeModeCore.ts` – command router that delegates to OS modules.
- Desktop UI under [`src/components/desktop`](src/components/desktop):
- `DesktopShell.tsx` – desktop environment after recovery.

- **OS simulation layer**
- Pure logic layer under [`src/os`](src/os):
- `kernel.ts` – subsystems, fragments, mission system, status.
- `net.ts` – Wi‑Fi and external connectivity simulation.
- `fs.ts` – filesystem and logs (IndexedDB-backed).
- Command implementations organized in `src/os/*/bin/` subdirectories.

- **Entry & shell**
- Keep [`src/main.tsx`](src/main.tsx) minimal: mount `<App />` and import `index.css`.
- In [`src/App.tsx`](src/App.tsx), manage **boot → safe mode → desktop** transitions.

## 2. Boot Flow & Narrative

- **Boot log and banner**
- Continue sourcing `BOOT_LOG` from [`src/components/Boot/boot-log.ts`](src/components/Boot/boot-log.ts).
- Keep the enriched `BOOT_BANNER` text in `os/kernel.ts` that:
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
- Make sure `help` and subsystem listing descriptions are consistent and beginner-friendly.

- **Tier 2 – Mission & guided setup (now present, refine)**
- Commands: `mission`, `hint`.
- Refine `TASKS` in `os/kernel.ts` to:
- Distinguish **critical** vs optional tasks.
- Match the actual subsystems and fragments defined.
- Ensure `hint` always leads to a valid next action and does not get stuck.

- **Tier 3 – Networking via Wi‑Fi (already prototyped)**
- Commands: `wifi`, `wifi scan`, `wifi crack [id]`, `wifi connect [id]`, `netcheck`, `ping`.
- Net logic in `os/net.ts`:
- Define `WifiAp` list, `connectedApId`, `hasExternalConnectivity`.
- Command implementations in `os/net/bin/`.
- Ensure commands explicitly label themselves as **simulation only**.

- **Tier 4 – Filesystem & logs (implemented)**
- Filesystem in `os/fs.ts` with IndexedDB persistence.
- Paths like `/var/log/boot.log`, `/etc/hackframe.conf`, `/var/log/net.log`.
- Files updated when user actions occur (e.g. subsystem loads, Wi‑Fi connect).
- Commands in `os/fs/bin/`:
- `fs ls [path]` – list pseudo-directories.
- `fs cat [path]` – print file content.

- **Tier 5 – Processes (optional stretch)**
- In `os/process.ts`, maintain a tiny process table:
- Always include a few system daemons.
- Optionally spawn ephemeral processes when certain subsystems load.
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
- In `os/*` modules, store sim state (subsystem states, `bootFragments`, Wi‑Fi state, FS, processes) in module-level variables.
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
- `os/kernel` functions: loading subsystems, resolving fragments, mission completion.
- `os/net` functions: Wi‑Fi cracking and connectivity rules.

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

## 8. Desktop GUI (Hacknet-inspired)

- **Desktop shell layout**
- Once all critical tasks are done and `gfx-module` is OK, `startx` command switches `App` from SafeModeTerminal to `DesktopShell`.
- Three-panel layout:
  - **System Info Panel** (top, ~25% height): Recovery status dashboard, subsystem indicators, network connectivity, visual reports.
  - **Target Node Window** (left, ~65% width):
    - **When target selected**: Shows detailed node view:
      - Node info (name, IP, status: connected/cracked/locked)
      - Ports section (open/closed ports, scanning results)
      - Firewall section (status, rules, bypass progress)
      - Filesystem section (only visible if node is cracked - file tree, file contents)
    - **When no target selected**: Shows node browser/list:
      - Displays all discovered nodes (from `wifi scan` results)
      - Shows node name, IP, signal strength, security status
      - Clickable/selectable nodes to set as target
      - Visual indicators for connection status (connected/locked/available)
      - Empty state: "No nodes discovered. Use `wifi scan` in terminal to discover nodes."
  - **Terminal** (right, ~35% width): Compact terminal interface with all commands available (wifi, fs, netcheck, etc.). Terminal is narrow and focused, doesn't need to dominate the screen.
- Recovery status should be prominently displayed in the System Info panel.
- Target node concept: Nodes are discovered via `wifi scan`, can be selected from the node browser, connected via `wifi connect`, and cracked to reveal filesystem access.
- Node browser should update dynamically when new nodes are discovered via terminal commands.

- **Scenario/missions system**
- Allow selecting different “images” or scenarios with different fragment configurations.
- Possibly load scenario definitions from JSON under `src/txt/`.

- **Theming & sound**
- Use Tailwind (already loaded via CDN) more consistently from JSX to reduce inline styles.
- Optionally add subtle sound cues (keypress, error, boot chime) via a small audio library.

## 9. RAM Visualization & Advanced Visual Effects

- **RAM Visualization (Hacknet-style)**
- Display in System Info Panel (top bar).
- Basic implementation: CSS Grid/Flexbox with React state.
  - Block-based grid showing memory allocation.
  - Color-coded blocks: kernel, processes, free memory, cached.
  - Simple CSS transitions for fade in/out when memory changes.
  - Memory stats overlay: total/used/free, percentage, top consumers.
- Memory simulation: Track allocation per subsystem/process.
  - Each loaded subsystem consumes memory.
  - Active connections use memory.
  - File operations use cache memory.
  - Processes spawn ephemeral memory usage.

- **Shader Effects (for tool execution - Hacknet-style)**
- When tools execute (e.g., SQLInjection.exe, port scanners), show impressive shader effects in RAM visualization.
- Visual techniques used in Hacknet:
  - **Polygons**: Geometric shapes (triangles, quads) representing program execution blocks, dynamically rendered.
  - **Noise patterns**: Procedural noise (Perlin, Simplex) for texture, distortion, and organic movement effects.
  - **Shader effects**: WebGL/GLSL shaders for glows, distortions, color shifts, and dynamic lighting.
  - **Particle systems**: Flowing particles and data streams during active operations.
  - **Procedural animations**: Dynamic movement and transformations based on program activity.
  - **Color gradients**: Smooth color transitions representing different program states.
  - **Distortion effects**: Visual warping and displacement during intensive operations.
- Library options for shader effects:
  - **Three.js + React Three Fiber**: WebGL shaders, 3D polygons, noise functions, advanced particles. Most powerful for authentic Hacknet-style effects. npm: `@react-three/fiber` + `three`.
  - **React Particles / Particles.js** (~20KB): Particle systems with shader-like effects, data flow effects. npm: `react-particles` or `particles.js`.
  - **Canvas API + Custom Shaders**: Full control, WebGL shaders, noise generation, polygon rendering. Most flexible but requires more implementation.
  - **Framer Motion**: Advanced animations, physics-based motion. npm: `framer-motion`.
  - **Lottie**: Pre-made animations, less customization. npm: `lottie-react`.
- Implementation strategy:
  - Start with basic CSS-based RAM grid (simple, no dependencies).
  - Add shader effects when tools execute using Three.js/WebGL or Canvas API with custom shaders.
  - Use noise functions (Perlin/Simplex) for organic, procedural effects.
  - Render polygons (triangles, quads) to represent program blocks dynamically.
  - Apply shader effects: glows, distortions, color shifts, visual feedback during tool execution.
- Shader effects to implement:
  - Polygon-based program blocks with noise texture overlays.
  - Particle flows with shader-based rendering when hacking tools run.
  - Data stream visualizations with noise-based distortion and glow effects.
  - Memory block animations with procedural noise and shader effects during active operations.
  - Visual feedback (glows, color shifts, distortions) for successful/failed operations.
  - Procedural animations using noise functions for organic movement.
