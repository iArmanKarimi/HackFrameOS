import React from "react";

import { TerminalContainer } from "./TerminalContainer";
import { TerminalHistory } from "./TerminalHistory";
import { TerminalInput } from "./TerminalInput";
import { BOOT_BANNER } from "./SafeModeCore";

import { useTerminalHistory } from "../hooks/useTerminalHistory";

import type { SafeModeTerminalProps } from "../types";

const SafeModeTerminal: React.FC<SafeModeTerminalProps> = ({ onComplete }) => {
	const {
		history,
		input,
		setInput,
		handleCommand,
		handleKeyDown,
		containerRef,
		inputRef,
		loadedModules,
		resolvedFragments,
	} = useTerminalHistory({
		initialHistory: [BOOT_BANNER],
		onComplete,
	});

	const handleContainerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if ((e.ctrlKey || e.metaKey) && (e.key === "l" || e.key === "L")) {
			e.preventDefault();
			e.stopPropagation();
		}
	};

	return (
		<TerminalContainer
			containerRef={containerRef}
			onKeyDown={handleContainerKeyDown}
		>
			<TerminalHistory history={history} />
			<TerminalInput
				input={input}
				onInputChange={setInput}
				onSubmit={handleCommand}
				onKeyDown={handleKeyDown}
				inputRef={inputRef}
				loadedModules={loadedModules}
				resolvedFragments={resolvedFragments}
			/>
		</TerminalContainer>
	);
};

export default SafeModeTerminal;
