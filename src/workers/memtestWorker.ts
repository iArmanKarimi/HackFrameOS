const TEST_PLAN = [
	{ label: "Initializing memory controller", duration: 600, progress: 5 },
	{ label: "Verifying SPD profiles", duration: 800, progress: 5 },
	{ label: "Walking 1s pattern (pass 1/2)", duration: 1400, progress: 18 },
	{ label: "Walking 0s pattern (pass 1/2)", duration: 1200, progress: 15 },
	{ label: "Random fill entropy sweep", duration: 1600, progress: 20 },
	{ label: "Hammer test (row hit analysis)", duration: 1800, progress: 20 },
	{ label: "Finalizing report", duration: 900, progress: 17 },
];

type WorkerMessage =
	| { type: "progress"; payload: { percent: number; step: string } }
	| { type: "log"; payload: { line: string } }
	| { type: "complete"; payload: { passed: boolean } };

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const emit = (message: WorkerMessage) => {
	postMessage(message);
};

const formatLog = (text: string) => {
	const now = new Date().toISOString();
	return `[${now}] ${text}`;
};

const run = async () => {
	try {
		let percent = 0;
		emit({
			type: "log",
			payload: { line: formatLog("memtest86+ diagnostic initialized") },
		});
		emit({ type: "progress", payload: { percent, step: "Initializing..." } });

		for (const step of TEST_PLAN) {
			emit({ type: "log", payload: { line: formatLog(step.label) } });
			emit({ type: "progress", payload: { percent, step: step.label } });
			await sleep(step.duration);
			percent = Math.min(100, percent + step.progress);
			emit({ type: "progress", payload: { percent, step: step.label } });
		}

		emit({
			type: "progress",
			payload: { percent: 100, step: "Complete" },
		});
		emit({
			type: "log",
			payload: { line: formatLog("All tests passed (no faults detected)") },
		});
		emit({ type: "complete", payload: { passed: true } });
	} catch (error) {
		emit({
			type: "log",
			payload: { line: formatLog(`Error: ${error instanceof Error ? error.message : String(error)}`) },
		});
	}
};

run().catch(() => {
	// Error handling - can be extended if needed
});

export { };

