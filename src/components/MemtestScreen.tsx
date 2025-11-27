import React, { useEffect, useRef, useState } from "react";

type LogEntry = {
	id: string;
	line: string;
};

export const MemtestScreen: React.FC<{ onExit: () => void }> = ({ onExit }) => {
	const [progress, setProgress] = useState(0);
	const [currentStep, setCurrentStep] = useState("Awaiting diagnostics…");
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const [isComplete, setIsComplete] = useState(false);
	const workerRef = useRef<Worker | null>(null);

	useEffect(() => {
		const worker = new Worker(
			new URL("../../workers/memtestWorker.ts", import.meta.url),
			{ type: "module" }
		);
		workerRef.current = worker;

		worker.onmessage = event => {
			const { type, payload } = event.data;
			if (type === "progress") {
				setProgress(payload.percent);
				setCurrentStep(payload.step);
			} else if (type === "log") {
				setLogs(prev => [
					...prev,
					{ id: `${prev.length}-${Date.now()}`, line: payload.line },
				]);
			} else if (type === "complete") {
				setIsComplete(true);
			}
		};

		return () => {
			worker.terminate();
			workerRef.current = null;
		};
	}, []);

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
		<div
			style={{
				width: "100vw",
				height: "100vh",
				backgroundColor: "#050505",
				color: "#d1d1d1",
				fontFamily: "'Liberation Mono', monospace",
				display: "flex",
				flexDirection: "column",
				padding: "2rem",
				boxSizing: "border-box",
			}}
		>
			<header
				style={{
					fontSize: "14px",
					marginBottom: "0.75rem",
					display: "flex",
					justifyContent: "space-between",
				}}
			>
				<span>memtest86+</span>
				<span>Status: {isComplete ? "complete" : "running"}</span>
			</header>

			<div
				style={{
					border: "1px solid #202020",
					padding: "1rem",
					backgroundColor: "#0b0b0b",
					boxShadow: "0 0 25px rgba(0,0,0,0.45)",
				}}
			>
				<div
					style={{
						marginBottom: "0.5rem",
						fontSize: "13px",
						color: "#9cd7ff",
					}}
				>
					Current step: {currentStep}
				</div>
				<div
					style={{
						height: "10px",
						width: "100%",
						backgroundColor: "#1a1a1a",
						border: "1px solid #333333",
						marginBottom: "0.5rem",
					}}
				>
					<div
						style={{
							height: "100%",
							width: `${progress}%`,
							backgroundColor: "#1e90ff",
							transition: "width 0.4s ease",
						}}
					/>
				</div>
				<div style={{ fontSize: "11px", color: "#b0b0b0" }}>
					{progress}% complete • system will reboot automatically when testing
					finishes.
				</div>
			</div>

			<section
				style={{
					flex: 1,
					marginTop: "1rem",
					border: "1px solid #1a1a1a",
					backgroundColor: "#000000",
					padding: "0.75rem",
					overflow: "hidden",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<div
					style={{
						fontSize: "11px",
						color: "#6b6b6b",
						marginBottom: "0.5rem",
					}}
				>
					Event log
				</div>
				<div
					style={{
						flex: 1,
						overflowY: "auto",
						fontSize: "12px",
						lineHeight: "1.4",
					}}
				>
					{logs.map(entry => (
						<div key={entry.id}>{entry.line}</div>
					))}
				</div>
			</section>

			<footer
				style={{
					marginTop: "1rem",
					fontSize: "12px",
					color: isComplete ? "#9cffc5" : "#bdbdbd",
					textAlign: "center",
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
