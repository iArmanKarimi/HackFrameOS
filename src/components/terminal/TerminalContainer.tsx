/**
 * TerminalContainer Component
 * Container for terminal with scroll management
 */

import React, { useEffect } from "react";

import { TERMINAL_STYLES } from "../../styles/terminalStyles";

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
	// Apply scrollbar hiding - inject global style once
	useEffect(() => {
		const styleId = "safemode-hide-scrollbar-global";
		if (!document.getElementById(styleId)) {
			const style = document.createElement("style");
			style.id = styleId;
			style.textContent = `
				.hide-scrollbar::-webkit-scrollbar {
					display: none !important;
					width: 0 !important;
					height: 0 !important;
				}
				.hide-scrollbar::-webkit-scrollbar-track {
					display: none !important;
				}
				.hide-scrollbar::-webkit-scrollbar-thumb {
					display: none !important;
				}
			`;
			document.head.appendChild(style);
		}
	}, []);

	// Apply scrollbar hiding styles when element is available
	useEffect(() => {
		const element = containerRef.current;
		if (element) {
			element.style.setProperty("scrollbar-width", "none", "important");
			element.style.setProperty("-ms-overflow-style", "none", "important");
		}
	}, [containerRef]);

	return (
		<div
			ref={containerRef}
			className="fixed inset-0 hide-scrollbar"
			onKeyDown={onKeyDown}
			tabIndex={-1}
			style={TERMINAL_STYLES.CONTAINER}
		>
			{children}
		</div>
	);
};
