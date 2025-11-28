/**
 * TerminalHistory Component
 * Displays the terminal output history with ANSI code support
 */

import React from "react";

import { ansiToReact, hasAnsiCodes } from "../utils/ansi";

import { TERMINAL_STYLES } from "../styles/terminalStyles";

interface TerminalHistoryProps {
	history: string[];
}

/**
 * Component for displaying terminal history lines
 */
export const TerminalHistory: React.FC<TerminalHistoryProps> = ({ history }) => {
	return (
		<>
			{history.map((line, idx) => {
				const content = hasAnsiCodes(line) ? ansiToReact(line) : line;
				const lineKey = `history-${idx}-${line.length}`;

				return (
					<pre key={lineKey} style={TERMINAL_STYLES.HISTORY_LINE}>
						{content}
					</pre>
				);
			})}
		</>
	);
};
