/**
 * GrubProgressBar Component
 * Progress bar showing boot countdown
 */

import React from "react";

import { GRUB_CONFIG } from "../../constants";
import { FONT_STACKS } from "../../styles/terminalStyles";

interface GrubProgressBarProps {
	countdown: number;
	autoBootEnabled: boolean;
}

const CONTAINER_STYLE: React.CSSProperties = {
	marginTop: "1.25rem",
	fontSize: "12px",
	color: "#a9a9a9",
	fontFamily: FONT_STACKS.GRUB,
	textAlign: "center",
};

const PAUSED_STYLE: React.CSSProperties = {
	marginTop: "0.25rem",
	color: "#737373",
};

/**
 * Component for GRUB boot countdown progress bar
 */
export const GrubProgressBar: React.FC<GrubProgressBarProps> = ({
	countdown,
	autoBootEnabled,
}) => {
	const filledSegments = autoBootEnabled
		? Math.round(
				((GRUB_CONFIG.BOOT_TIMEOUT_SECONDS - countdown) /
					GRUB_CONFIG.BOOT_TIMEOUT_SECONDS) *
					GRUB_CONFIG.PROGRESS_SEGMENTS
			)
		: GRUB_CONFIG.PROGRESS_SEGMENTS;
	const progressBar =
		"█".repeat(filledSegments) +
		"░".repeat(GRUB_CONFIG.PROGRESS_SEGMENTS - filledSegments);

	return (
		<div style={CONTAINER_STYLE}>
			<div>
				Boot default entry in {autoBootEnabled ? `${countdown}s` : "—"}{" "}
				{progressBar}
			</div>
			{!autoBootEnabled && (
				<div style={PAUSED_STYLE}>Auto boot paused (press ENTER to continue)</div>
			)}
		</div>
	);
};
