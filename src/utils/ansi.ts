/**
 * ANSI escape sequence processing utilities
 * Converts ANSI escape sequences to React elements with inline styles
 */

import React from "react";
import {
	TERMINAL_CONFIG,
	ANSI_CODES,
	COLORS,
} from "../constants";

/**
 * Process ANSI color code and return corresponding color
 */
function processAnsiCode(code: number): string {
	if (ANSI_CODES.RESET.includes(code)) {
		return COLORS.DEFAULT;
	}
	if (code === ANSI_CODES.GREEN) {
		return COLORS.GREEN;
	}
	return COLORS.DEFAULT;
}

/**
 * Flush buffered text to parts array with current color
 */
function flushBuffer(
	buffer: string,
	currentColor: string,
	parts: React.ReactNode[]
): void {
	if (buffer) {
		parts.push(
			<span key={`text-${parts.length}`} style = {{ color: currentColor }
}>
	{ buffer }
	< /span>
		);
	}
}

/**
 * Converts ANSI escape sequences in text to React elements with inline styles.
 * Handles both standard (\x1b[XXm) and malformed ([XXm without escape char) formats.
 * Only processes green (32) for [OK] messages; all other codes default to white.
 */
export function ansiToReact(text: string): React.ReactNode[] {
	const parts: React.ReactNode[] = [];
	let currentColor = COLORS.DEFAULT;
	let buffer = "";
	let i = 0;

	while (i < text.length) {
		const isEscape = text[i] === "\x1b" || text[i] === "\u001b";

		if (isEscape && i + 1 < text.length && text[i + 1] === "[") {
			flushBuffer(buffer, currentColor, parts);
			buffer = "";

			let j = i + 2;
			const maxSearch = Math.min(
				i + TERMINAL_CONFIG.MAX_ANSI_SEQUENCE_LENGTH,
				text.length
			);
			while (j < maxSearch && text[j] !== "m" && /[\d;]/.test(text[j])) {
				j++;
			}

			if (j < text.length && text[j] === "m") {
				if (j - i > TERMINAL_CONFIG.MAX_ANSI_SEQUENCE_LENGTH) {
					i++;
					continue;
				}

				const codeStr = text.slice(i + 2, j);
				const codes = codeStr
					.split(";")
					.map(c => parseInt(c, 10))
					.filter(
						n =>
							!isNaN(n) &&
							n >= 0 &&
							n <= TERMINAL_CONFIG.MAX_ANSI_CODE_VALUE
					);

				for (const code of codes) {
					currentColor = processAnsiCode(code);
				}

				i = j + 1;
				continue;
			}
		}

		if (text[i] === "[" && i + 1 < text.length) {
			const match = text.slice(i).match(/^\[(\d+)m/);
			if (match) {
				if (match[0].length > TERMINAL_CONFIG.MAX_ANSI_SEQUENCE_LENGTH) {
					i++;
					continue;
				}

				flushBuffer(buffer, currentColor, parts);
				buffer = "";

				const code = parseInt(match[1], 10);
				if (
					!isNaN(code) &&
					code >= 0 &&
					code <= TERMINAL_CONFIG.MAX_ANSI_CODE_VALUE
				) {
					currentColor = processAnsiCode(code);
				}

				i += match[0].length;
				continue;
			}
		}

		buffer += text[i];
		i++;
	}

	flushBuffer(buffer, currentColor, parts);

	return parts.length > 0 ? parts : [text];
}

/**
 * Check if text contains ANSI escape sequences
 */
export function hasAnsiCodes(text: string): boolean {
	return text.includes("\x1b") || text.includes("\u001b");
}
