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

	// Disable user scrolling while booting is in progress
	useEffect(() => {
		// Only disable scrolling while boot sequence is active
		if (isComplete) {
			return;
		}

		const container = containerRef.current;
		if (!container) return;

		// Prevent all user scroll events
		const handleWheel = (e: WheelEvent) => {
			e.preventDefault();
			e.stopPropagation();
		};

		const handleTouchMove = (e: TouchEvent) => {
			e.preventDefault();
			e.stopPropagation();
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			// Prevent keyboard scrolling (arrow keys, page up/down, home/end, space)
			if (
				e.key === "ArrowUp" ||
				e.key === "ArrowDown" ||
				e.key === "PageUp" ||
				e.key === "PageDown" ||
				e.key === "Home" ||
				e.key === "End" ||
				(e.key === " " && !e.shiftKey)
			) {
				e.preventDefault();
				e.stopPropagation();
			}
		};

		// Prevent scroll events from user interaction
		const handleScroll = (e: Event) => {
			// Only prevent if it's a user-initiated scroll (not programmatic)
			// We can't easily detect this, so we'll reset to bottom immediately
			if (container) {
				container.scrollTop = container.scrollHeight;
			}
		};

		container.addEventListener("wheel", handleWheel, { passive: false });
		container.addEventListener("touchmove", handleTouchMove, { passive: false });
		container.addEventListener("scroll", handleScroll, { passive: true });
		container.addEventListener("keydown", handleKeyDown, { passive: false });

		return () => {
			container.removeEventListener("wheel", handleWheel);
			container.removeEventListener("touchmove", handleTouchMove);
			container.removeEventListener("scroll", handleScroll);
			container.removeEventListener("keydown", handleKeyDown);
		};
	}, [isComplete]);

	return {
		currentLines,
		isComplete,
		containerRef,
	};
}
