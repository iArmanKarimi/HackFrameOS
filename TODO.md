## HackFrame TODO

- [x] Review the GNU boot loader `StartScreen` component to understand the current menu options and layout constraints (see review + copy cleanup).
- [ ] Plan the UX and logic changes required to add an “Advanced Options for HackFrame OS” entry on the boot loader screen. Implementation can wait until later, but outline any dependencies while reviewing.
  - Insert the new entry directly beneath “HackFrame OS” and render it even if the primary entry stays locked; visually indent its children in a secondary list rendered below the parent when focused.
  - Navigating to the advanced entry replaces the main list with scoped options (e.g., “HackFrame OS (Safe Mode)”, future rescue kernels, diagnostic utilities). Provide breadcrumbs and `Esc`/`Enter` instructions inline so we avoid modal logic.
  - Reuse the existing selection + countdown state, but pause auto boot whenever the user enters the advanced submenu.
  - Dependencies: extend `MenuItem` to express `children`, propagate the active stack to `onSelectBoot`, and ensure analytics/telemetry can distinguish submenu boots.
- [ ] Define the UX flow and technical steps for adding a GRUB memtest entry so implementation can proceed without blockers once the asset exists.
  - UX: expose “Memory Tester (memtest86+)” inside the Advanced Options submenu with a warning blurb (“Runs extended diagnostics; system will reboot automatically afterward”).
  - Binary: keep purely virtual for now—no real file in the OS filesystem; document that sourcing `memtest86+-5.31.bin` and wiring a copy step will happen later if we decide to ship it.
  - Wiring: map the menu value to `onSelectBoot("memtest")`, then have the shell route to a dedicated scene that streams progress logs while a web worker simulates the test until the real binary exists.
  - Build config: document that the menu entry is blocked on the memtest artifact and leave the feature flag off by default so QA can enable once the binary lands.
