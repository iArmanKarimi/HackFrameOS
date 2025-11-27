# HackFrameOS

A retro OS rehabilitation simulator built with React and TypeScript. You're operating a degraded HackFrameOS image that has dropped into Safe Mode. Through a cinematic boot log and terminal interface, bring core subsystems back online in a fully sandboxed simulation.

## Important

All filesystem, networking, and "hacking" operations are 100% simulated and in-memory. Nothing touches your real OS or network.

## Installation

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Getting Started

Watch the boot sequence, then explore the Safe Mode terminal. Use `help` to discover available commands and `mission` to understand your objectives.

## Development

```bash
npm run dev      # Development server
npm run build    # Build for production
npm run serve    # Preview production build
npm test         # Run tests
```

## Project Structure

- `src/components/BIOS/` - Boot screen and terminal UI
- `src/sim/` - Simulation core (kernel, filesystem, networking)
- `src/ui/` - Desktop environment

All simulation logic is in `src/sim/*` and can be extended without touching the UI.
