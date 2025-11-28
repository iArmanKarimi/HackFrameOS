/**
 * GrubMenuItem Component
 * Individual menu item in GRUB boot menu
 */

import React from "react";

import { FONT_STACKS } from "../styles/terminalStyles";

import type { MenuItem } from "../types";

interface GrubMenuItemProps {
	item: MenuItem;
	isActive: boolean;
	isLocked: boolean;
}

const getItemStyle = (
	isActive: boolean,
	isLocked: boolean
): React.CSSProperties => ({
	fontFamily: FONT_STACKS.GRUB,
	fontSize: "13px",
	color: isLocked ? "#5b5b5b" : isActive ? "#ffffff" : "#c4c4c4",
	padding: "0.45rem 1rem",
	backgroundColor: isActive && !isLocked ? "#114d9a" : "transparent",
	borderLeft:
		isActive && !isLocked ? "3px solid #4db5ff" : "3px solid transparent",
	display: "flex",
	flexDirection: "column",
	gap: "0.2rem",
	opacity: isLocked ? 0.6 : 1,
	textAlign: "center",
});

const DETAIL_STYLE: React.CSSProperties = {
	fontSize: "11px",
	fontFamily: FONT_STACKS.GRUB,
};

const getDetailColor = (isLocked: boolean, isActive: boolean): string => {
	if (isLocked) return "#555555";
	if (isActive) return "#cfe9ff";
	return "#7e7e7e";
};

const LOCKED_MESSAGE_STYLE: React.CSSProperties = {
	fontSize: "11px",
	color: "#ff9b63",
	fontFamily: FONT_STACKS.GRUB,
};

/**
 * Component for individual GRUB menu item
 */
export const GrubMenuItem: React.FC<GrubMenuItemProps> = ({
	item,
	isActive,
	isLocked,
}) => {
	return (
		<div style={getItemStyle(isActive, isLocked)}>
			<span>{item.label}</span>
			{item.detail && (
				<span
					style={{ ...DETAIL_STYLE, color: getDetailColor(isLocked, isActive) }}
				>
					{item.detail}
				</span>
			)}
			{isLocked && (
				<span style={LOCKED_MESSAGE_STYLE}>
					System image flagged as damaged; Safe Mode must repair.
				</span>
			)}
		</div>
	);
};
