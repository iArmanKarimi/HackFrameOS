/**
 * Style constants for terminal and boot-related components
 * Centralized styling to reduce duplication and improve maintainability
 */

import type { CSSProperties } from "react";

// Font stacks
export const FONT_STACKS = {
	TERMINAL: "VT323, monospace",
	GRUB: "'Liberation Mono', 'DejaVu Sans Mono', 'Source Code Pro', monospace",
	MEMTEST: "'Liberation Mono', monospace",
} as const;

// Common colors
export const STYLE_COLORS = {
	BACKGROUND_DARK: "#0d0d0d",
	BACKGROUND_BLACK: "#000000",
	BACKGROUND_MEMTEST: "#050505",
	TEXT_WHITE: "#ffffff",
	TEXT_LIGHT: "#d1d1d1",
	TEXT_MUTED: "#a9a9a9",
	ACCENT_CYAN: "#00c2ff",
	ACCENT_BLUE: "#1e90ff",
} as const;

// Terminal styles
export const TERMINAL_STYLES = {
	CONTAINER: {
		backgroundColor: STYLE_COLORS.BACKGROUND_DARK,
		color: STYLE_COLORS.TEXT_WHITE,
		fontFamily: FONT_STACKS.TERMINAL,
		fontSize: "16px",
		padding: "1rem",
		overflowY: "auto",
	} as CSSProperties,

	HISTORY_LINE: {
		margin: 0,
		whiteSpace: "pre-wrap" as const,
		wordWrap: "break-word" as const,
		overflowWrap: "break-word" as const,
		color: STYLE_COLORS.TEXT_WHITE,
		lineHeight: "1.4",
		fontFamily: FONT_STACKS.TERMINAL,
		fontSize: "16px",
	} as CSSProperties,

	BOOT_LOG_LINE: {
		margin: 0,
		lineHeight: "1.4",
		fontFamily: FONT_STACKS.TERMINAL,
		fontSize: "16px",
		color: STYLE_COLORS.TEXT_WHITE,
	} as CSSProperties,
} as const;

// Boot screen styles
export const BOOT_SCREEN_STYLES = {
	CONTAINER: {
		backgroundColor: STYLE_COLORS.BACKGROUND_DARK,
		color: STYLE_COLORS.TEXT_WHITE,
		fontFamily: FONT_STACKS.TERMINAL,
		fontSize: "16px",
		padding: "1rem",
		height: "100vh",
		overflowY: "auto" as const,
		scrollbarWidth: "none" as const,
		msOverflowStyle: "none" as const,
	} as CSSProperties,
} as const;

// GRUB screen styles
export const GRUB_SCREEN_STYLES = {
	CONTAINER: {
		width: "100vw",
		height: "100vh",
		backgroundColor: STYLE_COLORS.BACKGROUND_BLACK,
		backgroundImage:
			"linear-gradient(180deg, rgba(10,10,10,0.95) 0%, rgba(0,0,0,1) 100%), repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 3px)",
		color: STYLE_COLORS.TEXT_WHITE,
		fontFamily: FONT_STACKS.GRUB,
		fontSize: "13px",
		display: "flex" as const,
		flexDirection: "column" as const,
		justifyContent: "center" as const,
		alignItems: "center" as const,
		padding: "0",
		outline: "none",
		lineHeight: "1.2",
		cursor: "none" as const,
		overflow: "hidden" as const,
		position: "relative" as const,
		userSelect: "none" as const,
	} as CSSProperties,

	MENU_CONTAINER: {
		width: "100%",
		height: "100%",
		padding: "1.5rem",
		boxSizing: "border-box" as const,
		display: "flex" as const,
		flexDirection: "column" as const,
		alignItems: "center" as const,
		justifyContent: "center" as const,
	} as CSSProperties,

	HEADER: {
		margin: 0,
		fontSize: "13px",
		color: STYLE_COLORS.TEXT_WHITE,
		whiteSpace: "pre" as const,
		fontFamily: FONT_STACKS.GRUB,
		textAlign: "center" as const,
	} as CSSProperties,

	SEPARATOR: {
		margin: "0.75rem 0 1rem 0",
		fontSize: "12px",
		color: "#8f8f8f",
		whiteSpace: "pre" as const,
		fontFamily: FONT_STACKS.GRUB,
		textAlign: "center" as const,
	} as CSSProperties,

	INSTRUCTIONS: {
		marginTop: "2.5rem",
		fontFamily: FONT_STACKS.GRUB,
		fontSize: "11.5px",
		color: "#9d9d9d",
		lineHeight: "1.5",
		textAlign: "center" as const,
	} as CSSProperties,

	BUILD_INFO: {
		marginTop: "1rem",
		fontFamily: FONT_STACKS.GRUB,
		fontSize: "11px",
		color: "#636363",
		textAlign: "center" as const,
	} as CSSProperties,

	PROMPT: {
		marginTop: "0.75rem",
		fontFamily: FONT_STACKS.GRUB,
		fontSize: "12px",
		color: STYLE_COLORS.ACCENT_CYAN,
		textAlign: "center" as const,
	} as CSSProperties,
} as const;

// Memtest screen styles
export const MEMTEST_SCREEN_STYLES = {
	CONTAINER: {
		width: "100vw",
		height: "100vh",
		backgroundColor: STYLE_COLORS.BACKGROUND_MEMTEST,
		color: STYLE_COLORS.TEXT_LIGHT,
		fontFamily: FONT_STACKS.MEMTEST,
		display: "flex" as const,
		flexDirection: "column" as const,
		padding: "2rem",
		boxSizing: "border-box" as const,
	} as CSSProperties,

	HEADER: {
		fontSize: "14px",
		marginBottom: "0.75rem",
		display: "flex" as const,
		justifyContent: "space-between" as const,
	} as CSSProperties,

	FOOTER: {
		marginTop: "1rem",
		fontSize: "12px",
		textAlign: "center" as const,
	} as CSSProperties,
} as const;

// Desktop shell styles
export const DESKTOP_SHELL_STYLES = {
	CONTAINER: {
		width: "100vw",
		height: "100vh",
		backgroundColor: STYLE_COLORS.BACKGROUND_DARK,
		color: STYLE_COLORS.TEXT_WHITE,
		fontFamily: FONT_STACKS.TERMINAL,
		fontSize: "16px",
		display: "flex" as const,
		flexDirection: "column" as const,
		padding: "1rem",
		gap: "1rem",
	} as CSSProperties,

	PANEL: {
		border: "1px solid rgba(255, 255, 255, 0.2)",
		padding: "1rem",
	} as CSSProperties,
} as const;
