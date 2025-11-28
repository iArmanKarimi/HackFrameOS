/**
 * PreBootScreen Component
 * Initial screen before GRUB menu is unlocked
 */

import React from "react";

import { FONT_STACKS, STYLE_COLORS } from "../../styles/terminalStyles";

const CONTAINER_STYLE: React.CSSProperties = {
	width: "100%",
	height: "100%",
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	justifyContent: "center",
	textAlign: "center",
	gap: "1rem",
	cursor: "default",
};

const TITLE_STYLE: React.CSSProperties = {
	fontSize: "14px",
	letterSpacing: "0.15em",
	color: STYLE_COLORS.ACCENT_CYAN,
	margin: 0,
};

const DESCRIPTION_STYLE: React.CSSProperties = {
	fontSize: "12px",
	color: STYLE_COLORS.TEXT_MUTED,
	maxWidth: "420px",
};

const BUTTON_STYLE: React.CSSProperties = {
	padding: "0.75rem 1.5rem",
	border: `1px solid ${STYLE_COLORS.ACCENT_CYAN}`,
	color: STYLE_COLORS.ACCENT_CYAN,
	fontSize: "12px",
	fontFamily: FONT_STACKS.GRUB,
	letterSpacing: "0.3em",
};

/**
 * Component for pre-boot screen (before GRUB menu)
 */
export const PreBootScreen: React.FC = () => {
	return (
		<div style={CONTAINER_STYLE}>
			<pre style={TITLE_STYLE}>HackFrame Firmware Interface</pre>
			<div style={DESCRIPTION_STYLE}>
				Initializing secure display pipeline. Press ENTER to start booting GNU GRUB.
			</div>
			<div style={BUTTON_STYLE}>PRESS ENTER</div>
		</div>
	);
};
