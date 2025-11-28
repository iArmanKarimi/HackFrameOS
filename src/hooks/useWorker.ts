/**
 * Custom hook for managing Web Workers with type safety
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
	WorkerLogPayload,
	WorkerMessage,
	WorkerProgressPayload,
} from "../types";

interface UseWorkerOptions {
	workerUrl: URL | string;
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
	const onMessageRef = useRef(onMessage);
	const onErrorRef = useRef(onError);
	const [isReady, setIsReady] = useState(false);

	// Keep refs up to date without causing worker restarts
	useEffect(() => {
		onMessageRef.current = onMessage;
		onErrorRef.current = onError;
	}, [onMessage, onError]);

	useEffect(() => {
		let worker: Worker;
		try {
			// Convert URL to string if needed
			const urlString = workerUrl instanceof URL ? workerUrl.href : workerUrl;
			worker = new Worker(urlString, { type: "module" });
			workerRef.current = worker;

			worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
				if (onMessageRef.current) {
					onMessageRef.current(event.data);
				}
			};

			worker.onerror = (error: ErrorEvent) => {
				if (onErrorRef.current) {
					onErrorRef.current(error);
				}
			};

			worker.onmessageerror = (error: MessageEvent) => {
				// Message error - handler can be added if needed
			};

			setIsReady(true);
		} catch (error) {
			if (onErrorRef.current) {
				onErrorRef.current(error as ErrorEvent);
			}
		}

		return () => {
			if (workerRef.current) {
				workerRef.current.terminate();
				workerRef.current = null;
				setIsReady(false);
			}
		};
	}, [workerUrl]);

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
	const workerRef = useRef<Worker | null>(null);
	const [isReady, setIsReady] = useState(false);
	const onProgressRef = useRef(onProgress);
	const onLogRef = useRef(onLog);
	const onCompleteRef = useRef(onComplete);
	const onErrorRef = useRef(onError);

	// Keep refs up to date
	useEffect(() => {
		onProgressRef.current = onProgress;
		onLogRef.current = onLog;
		onCompleteRef.current = onComplete;
		onErrorRef.current = onError;
	}, [onProgress, onLog, onComplete, onError]);

	// Load and create the worker using Vite's worker import
	useEffect(() => {
		let cancelled = false;

		// Use dynamic import to get the Worker constructor from Vite
		import("../workers/memtestWorker.ts?worker")
			.then((WorkerModule) => {
				if (cancelled) return;

				// Vite's ?worker import gives us a Worker constructor
				const WorkerConstructor = WorkerModule.default || WorkerModule;

				const worker = new WorkerConstructor();
				workerRef.current = worker;

				worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
					const { type, payload } = event.data;
					if (type === "progress") {
						const progressPayload = payload as WorkerProgressPayload;
						if (onProgressRef.current) {
							onProgressRef.current(progressPayload.percent, progressPayload.step);
						}
					} else if (type === "log") {
						const logPayload = payload as WorkerLogPayload;
						if (onLogRef.current) {
							onLogRef.current(logPayload.line);
						}
					} else if (type === "complete") {
						if (onCompleteRef.current) {
							onCompleteRef.current();
						}
					}
				};

				worker.onerror = (error: ErrorEvent) => {
					if (onErrorRef.current) {
						onErrorRef.current(error);
					}
				};

				worker.onmessageerror = (error: MessageEvent) => {
					// Message error - handler can be added if needed
				};

				setIsReady(true);
			})
			.catch((error) => {
				if (!cancelled) {
					if (onErrorRef.current) {
						onErrorRef.current(error as ErrorEvent);
					}
				}
			});

		return () => {
			cancelled = true;
			if (workerRef.current) {
				workerRef.current.terminate();
				workerRef.current = null;
				setIsReady(false);
			}
		};
	}, []);

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
