import React, { useMemo } from "react";

import { BootLogLine } from "./BootLogLine";
import { BOOT_LOG } from "./boot-log";

import { useBootSequence } from "../../hooks/useBootSequence";

import { BOOT_SCREEN_STYLES } from "../../styles/terminalStyles";

import type { BootScreenProps } from "../../types";

/**
 * BootScreen Component
 * --------------------
 * Displays a cinematic boot sequence by scrolling through BOOT_LOG line by line.
 * Once all lines are displayed, it optionally calls `onComplete` to signal that
 * the boot process has finished (so the parent can transition to SafeModeTerminal or main UI).
 */
export const BootScreen: React.FC<BootScreenProps> = ({ onComplete }) => {
	const lines = useMemo(() => BOOT_LOG.split("\n"), []);
	const { currentLines, containerRef } = useBootSequence({ lines, onComplete });

	/**
	 * Render:
	 * - A styled container with retro terminal aesthetics.
	 * - Only render lines up to the current index.
	 */
	return (
		<div ref={containerRef} style={BOOT_SCREEN_STYLES.CONTAINER}>
			{currentLines.map((line, idx) => (
				<BootLogLine key={idx} line={line} index={idx} />
			))}
		</div>
	);
};
