/**
 * Application-wide constants
 * Centralized configuration values to avoid magic numbers and strings
 */

// App phases
export const APP_PHASES = {
	START: "start",
	BOOT: "boot",
	SAFEMODE: "safemode",
	DESKTOP: "desktop",
	MEMTEST: "memtest",
} as const;

export type AppPhase = typeof APP_PHASES[keyof typeof APP_PHASES];

// Boot targets
export const BOOT_TARGETS = {
	NORMAL: "normal",
	SAFEMODE: "safemode",
	MEMTEST: "memtest",
	RESTART: "restart",
} as const;

export type BootTarget = typeof BOOT_TARGETS[keyof typeof BOOT_TARGETS];

// Local storage keys
export const STORAGE_KEYS = {
	SAFE_MODE_COMPLETE: "hf:safeModeComplete",
} as const;

// Terminal constants
export const TERMINAL_CONFIG = {
	MAX_INPUT_LENGTH: 1000,
	MAX_HISTORY_SIZE: 1000,
	MAX_COMMAND_HISTORY: 100,
	MAX_ANSI_SEQUENCE_LENGTH: 50,
	MAX_ANSI_CODE_VALUE: 255,
} as const;

// ANSI color codes
export const ANSI_CODES = {
	RESET: [0, 39],
	GREEN: 32,
} as const;

// Colors
export const COLORS = {
	DEFAULT: "#ffffff",
	GREEN: "#00ff00",
	RED: "#ff4444",
	YELLOW: "#ffff00",
} as const;

// Boot screen constants
export const BOOT_SCREEN_CONFIG = {
	LINE_INTERVAL_MS: 35,
	SEGMENT_BREAK_DELAY_MS: 450,
	COMPLETION_DELAY_MS: 1200,
} as const;

// GRUB screen constants
export const GRUB_CONFIG = {
	BOOT_TIMEOUT_SECONDS: 8,
	PROGRESS_SEGMENTS: 32,
	PROMPT_BLINK_INTERVAL_MS: 600,
	FULLSCREEN_DELAY_MS: 100,
} as const;

// Safe mode transition
export const SAFE_MODE_CONFIG = {
	TRANSITION_DELAY_MS: 1000,
	TRANSITION_MESSAGE: "Transitioning to desktop",
} as const;
