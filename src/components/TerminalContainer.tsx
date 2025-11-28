/**
 * TerminalContainer Component
 * Container for terminal with scroll management
 */

import React from "react";

import { TERMINAL_STYLES } from "../styles/terminalStyles";

interface TerminalContainerProps {
	children: React.ReactNode;
	containerRef: React.RefObject<HTMLDivElement>;
	onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}

/**
 * Component for terminal container with scroll management
 */
export const TerminalContainer: React.FC<TerminalContainerProps> = ({
	children,
	containerRef,
	onKeyDown,
}) => {
	return (
		<div
			ref={containerRef}
			className="fixed inset-0 safemode-scrollbar"
			onKeyDown={onKeyDown}
			tabIndex={-1}
			style={TERMINAL_STYLES.CONTAINER}
		>
			{children}
		</div>
	);
};
