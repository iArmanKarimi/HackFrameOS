/**
 * GrubMenu Component
 * Menu list for GRUB boot options
 */

import React from "react";

import { GrubMenuItem } from "./GrubMenuItem";

import type { MenuItem } from "../../types";

interface GrubMenuProps {
	items: MenuItem[];
	selectedIndex: number;
	canBootNormal: boolean;
}

const MENU_CONTAINER_STYLE: React.CSSProperties = {
	border: "1px solid rgba(255,255,255,0.25)",
	padding: "0.5rem 0",
	width: "460px",
	maxWidth: "90vw",
	backgroundColor: "rgba(5,5,5,0.65)",
	boxShadow: "0 0 18px rgba(0,0,0,0.45)",
	margin: "0 auto",
};

/**
 * Component for GRUB menu list
 */
export const GrubMenu: React.FC<GrubMenuProps> = ({
	items,
	selectedIndex,
	canBootNormal,
}) => {
	return (
		<div style={MENU_CONTAINER_STYLE}>
			{items.map((item, index) => {
				const isActive = index === selectedIndex;
				const isLocked = item.value === "normal" && !canBootNormal;
				return (
					<GrubMenuItem
						key={item.value}
						item={item}
						isActive={isActive}
						isLocked={isLocked}
					/>
				);
			})}
		</div>
	);
};
