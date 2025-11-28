import React, { useEffect, useState } from "react";

import { MemtestLogViewer } from "./MemtestLogViewer";
import { MemtestProgressBar } from "./MemtestProgressBar";

import { useMemtestWorker } from "../hooks/useWorker";

import { MEMTEST_SCREEN_STYLES } from "../styles/terminalStyles";

import type { LogEntry, MemtestScreenProps } from "../types";

export const MemtestScreen: React.FC<MemtestScreenProps> = ({ onExit }) => {
	const [progress, setProgress] = useState(0);
	const [currentStep, setCurrentStep] = useState("Awaiting diagnostics…");
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const [isComplete, setIsComplete] = useState(false);

	useMemtestWorker({
		onProgress: (percent, step) => {
			setProgress(percent);
			setCurrentStep(step);
		},
		onLog: line => {
			setLogs(prev => [...prev, { id: `${prev.length}-${Date.now()}`, line }]);
		},
		onComplete: () => {
			setIsComplete(true);
		},
	});

	useEffect(() => {
		const handleKey = (event: KeyboardEvent) => {
			if (!isComplete) {
				return;
			}
			if (event.key === "Enter" || event.key === "Escape") {
				event.preventDefault();
				onExit();
			}
		};
		document.addEventListener("keydown", handleKey);
		return () => {
			document.removeEventListener("keydown", handleKey);
		};
	}, [isComplete, onExit]);

	return (
		<div style={MEMTEST_SCREEN_STYLES.CONTAINER}>
			<header style={MEMTEST_SCREEN_STYLES.HEADER}>
				<span>memtest86+</span>
				<span>Status: {isComplete ? "complete" : "running"}</span>
			</header>

			<MemtestProgressBar progress={progress} currentStep={currentStep} />

			<MemtestLogViewer logs={logs} />

			<footer
				style={{
					...MEMTEST_SCREEN_STYLES.FOOTER,
					color: isComplete ? "#9cffc5" : "#bdbdbd",
				}}
			>
				{isComplete
					? "Diagnostics complete. Press Enter to return to the boot menu."
					: "Running extended diagnostics. Keyboard input is locked until completion."}
			</footer>
		</div>
	);
};

export default MemtestScreen;
