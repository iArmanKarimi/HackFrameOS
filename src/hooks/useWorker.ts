/**
 * Custom hook for managing Web Workers with type safety
 */

import { useEffect, useRef, useState } from "react";

import type {
	WorkerLogPayload,
	WorkerMessage,
	WorkerProgressPayload,
} from "../types";

interface UseWorkerOptions {
	workerUrl: URL;
	onMessage?: (message: WorkerMessage) => void;
	onError?: (error: ErrorEvent) => void;
}

interface UseWorkerReturn {
	isReady: boolean;
	terminate: () => void;
}

/**
 * Hook to manage Web Worker lifecycle and messaging
 * @param options - Configuration with workerUrl and optional callbacks
 * @returns Object with isReady status and terminate function
 */
export function useWorker({
	workerUrl,
	onMessage,
	onError,
}: UseWorkerOptions): UseWorkerReturn {
	const workerRef = useRef<Worker | null>(null);
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		const worker = new Worker(workerUrl, { type: "module" });
		workerRef.current = worker;

		worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
			if (onMessage) {
				onMessage(event.data);
			}
		};

		worker.onerror = (error: ErrorEvent) => {
			if (onError) {
				onError(error);
			} else {
				console.error("Worker error:", error);
			}
		};

		worker.onmessageerror = (error: MessageEvent) => {
			console.error("Worker message error:", error);
		};

		setIsReady(true);

		return () => {
			worker.terminate();
			workerRef.current = null;
			setIsReady(false);
		};
	}, [workerUrl, onMessage, onError]);

	const terminate = () => {
		if (workerRef.current) {
			workerRef.current.terminate();
			workerRef.current = null;
			setIsReady(false);
		}
	};

	return {
		isReady,
		terminate,
	};
}

/**
 * Specialized hook for memtest worker with typed message handlers
 * @param onProgress - Callback for progress updates (percent, step)
 * @param onLog - Callback for log entries
 * @param onComplete - Callback when worker completes
 * @param onError - Optional error handler
 * @returns Object with isReady status and terminate function
 */
interface UseMemtestWorkerOptions {
	onProgress?: (percent: number, step: string) => void;
	onLog?: (line: string) => void;
	onComplete?: () => void;
	onError?: (error: ErrorEvent) => void;
}

interface UseMemtestWorkerReturn {
	isReady: boolean;
	terminate: () => void;
}

export function useMemtestWorker({
	onProgress,
	onLog,
	onComplete,
	onError,
}: UseMemtestWorkerOptions): UseMemtestWorkerReturn {
	// Use Vite's ?worker syntax to properly load the worker module
	const workerUrl = new URL(
		"../../workers/memtestWorker.ts?worker",
		import.meta.url
	);

	const handleMessage = (message: WorkerMessage) => {
		const { type, payload } = message;
		if (type === "progress") {
			const progressPayload = payload as WorkerProgressPayload;
			if (onProgress) {
				onProgress(progressPayload.percent, progressPayload.step);
			}
		} else if (type === "log") {
			const logPayload = payload as WorkerLogPayload;
			if (onLog) {
				onLog(logPayload.line);
			}
		} else if (type === "complete") {
			if (onComplete) {
				onComplete();
			}
		}
	};

	return useWorker({
		workerUrl,
		onMessage: handleMessage,
		onError,
	});
}
