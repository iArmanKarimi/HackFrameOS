/**
 * TerminalInput Component
 * Input field with prompt for terminal commands
 */

import React from "react";

import { COLORS } from "../../constants";
import { FONT_STACKS } from "../../styles/terminalStyles";

interface TerminalInputProps {
	input: string;
	onInputChange: (value: string) => void;
	onSubmit: (e: React.FormEvent) => void;
	onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
	inputRef: React.RefObject<HTMLInputElement>;
	loadedModules: number;
	resolvedFragments: number;
}

const FORM_STYLE: React.CSSProperties = {
	marginTop: "0.5rem",
	display: "flex",
	alignItems: "flex-start",
};

const getPromptColor = (
	loadedModules: number,
	resolvedFragments: number
): string => {
	if (loadedModules >= 6 && resolvedFragments >= 5) {
		return COLORS.GREEN;
	}
	if (loadedModules >= 3 || resolvedFragments >= 3) {
		return COLORS.YELLOW;
	}
	return COLORS.RED;
};

const PROMPT_STYLE: React.CSSProperties = {
	fontFamily: "VT323, monospace",
	fontSize: "16px",
	whiteSpace: "nowrap",
	flexShrink: 0,
	transition: "color 0.3s ease",
};

const INPUT_STYLE: React.CSSProperties = {
	background: "transparent",
	border: "none",
	outline: "none",
	color: "#ffffff",
	fontFamily: FONT_STACKS.TERMINAL,
	fontSize: "16px",
	flex: 1,
	minWidth: 0,
	whiteSpace: "nowrap",
	overflow: "hidden",
	marginLeft: "0.25rem",
};

/**
 * Component for terminal input with prompt
 */
export const TerminalInput: React.FC<TerminalInputProps> = ({
	input,
	onInputChange,
	onSubmit,
	onKeyDown,
	inputRef,
	loadedModules,
	resolvedFragments,
}) => {
	const promptColor = getPromptColor(loadedModules, resolvedFragments);

	return (
		<form onSubmit={onSubmit} style={FORM_STYLE}>
			<span style={{ ...PROMPT_STYLE, color: promptColor }}>
				safemode@root:~{" "}
			</span>
			<input
				ref={inputRef}
				type="text"
				value={input}
				onChange={e => onInputChange(e.target.value)}
				onKeyDown={onKeyDown}
				onBlur={e => {
					e.target.focus();
				}}
				style={INPUT_STYLE}
				autoFocus
			/>
		</form>
	);
};
