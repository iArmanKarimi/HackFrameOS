/**
 * Custom hook for managing boot sequence animation
 */

import { useEffect, useMemo, useRef, useState } from "react";

import { BOOT_SCREEN_CONFIG } from "../constants";

interface UseBootSequenceOptions {
	lines: string[];
	onComplete: () => void;
}

interface UseBootSequenceReturn {
	currentLines: string[];
	isComplete: boolean;
	containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Hook to manage progressive line-by-line boot sequence display
 * @param options - Configuration object with lines and onComplete callback
 * @returns Object with currentLines, isComplete status, and containerRef
 */
export function useBootSequence({
	lines,
	onComplete,
}: UseBootSequenceOptions): UseBootSequenceReturn {
	const [index, setIndex] = useState(0);
	const containerRef = useRef<HTMLDivElement>(null);
	const isComplete = index >= lines.length;

	const currentLines = useMemo(() => lines.slice(0, index), [lines, index]);

	// Reveal one new line at a time
	useEffect(() => {
		if (isComplete) {
			return;
		}

		const currentLine = lines[index];
		const isSegmentBreak = currentLine.trim() === "";
		const delay = isSegmentBreak
			? BOOT_SCREEN_CONFIG.SEGMENT_BREAK_DELAY_MS
			: BOOT_SCREEN_CONFIG.LINE_INTERVAL_MS;

		const timer = setTimeout(() => {
			setIndex(prev => prev + 1);
		}, delay);

		return () => clearTimeout(timer);
	}, [index, lines, isComplete]);

	// Notify completion when all lines are shown
	useEffect(() => {
		if (!isComplete) {
			return;
		}

		const completionTimer = setTimeout(
			() => onComplete(),
			BOOT_SCREEN_CONFIG.COMPLETION_DELAY_MS
		);
		return () => clearTimeout(completionTimer);
	}, [isComplete, onComplete]);

	// Auto-scroll to bottom when new line is added
	useEffect(() => {
		if (containerRef.current) {
			containerRef.current.scrollTop = containerRef.current.scrollHeight;
		}
	}, [index]);

	return {
		currentLines,
		isComplete,
		containerRef,
	};
}
