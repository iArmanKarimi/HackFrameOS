import React, { useCallback, useEffect, useRef, useState } from "react";

import { GrubMenu } from "./GrubMenu";
import { GrubProgressBar } from "./GrubProgressBar";
import { PreBootScreen } from "./PreBootScreen";

import { requestFullscreen } from "../utils/fullscreen";

import { GRUB_CONFIG } from "../constants";
import { FONT_STACKS, GRUB_SCREEN_STYLES } from "../styles/terminalStyles";

import type { GrubScreenProps, MenuItem, MenuItemValue } from "../types";

const MENU_ITEMS: MenuItem[] = [
	{
		label: "HackFrame OS",
		detail: "Normal boot sequence (unlocked after Safe Mode)",
		value: "normal",
	},
	{
		label: "HackFrame OS (Safe Mode)",
		detail: "First boot and fallback recovery environment",
		value: "safemode",
	},
	{
		label: "Memory Tester (memtest86+)",
		detail: "Run extended memory diagnostics",
		value: "memtest",
	},
	{
		label: "Restart",
		detail: "Reboot the virtual machine",
		value: "restart",
	},
];

/**
 * GrubScreen Component
 * ---------------------
 * Authentic GRUB boot menu simulation.
 * Text-based interface, keyboard-only interaction.
 * Automatically enters fullscreen when user starts boot.
 */
export const GrubScreen: React.FC<GrubScreenProps> = ({
	onSelectBoot,
	canBootNormal,
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const preBootRef = useRef<HTMLDivElement>(null);
	const prevCanBootNormal = useRef(canBootNormal);
	const [preBootUnlocked, setPreBootUnlocked] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(() =>
		canBootNormal ? 0 : 1
	);
	const [countdown, setCountdown] = useState(GRUB_CONFIG.BOOT_TIMEOUT_SECONDS);
	const [autoBootEnabled, setAutoBootEnabled] = useState(true);
	const [promptVisible, setPromptVisible] = useState(true);

	const handlePreBootUnlock = useCallback(async () => {
		if (preBootUnlocked) {
			return;
		}

		setPreBootUnlocked(true);
		// Try to request fullscreen, but don't block on it
		try {
			await requestFullscreen(preBootRef.current ?? undefined);
		} catch (error) {
			console.warn("Fullscreen request failed before GRUB:", error);
			// Continue even if fullscreen is not supported
		}
	}, [preBootUnlocked]);

	const handleSelection = useCallback(
		async (value: MenuItemValue) => {
			try {
				// Request fullscreen first
				await requestFullscreen();
				setTimeout(() => {
					onSelectBoot(value);
				}, GRUB_CONFIG.FULLSCREEN_DELAY_MS);
			} catch (error) {
				console.error("Failed to enter fullscreen:", error);
				// Still proceed even if fullscreen fails
				onSelectBoot(value);
			}
		},
		[onSelectBoot]
	);

	// Keyboard navigation - arrow keys + enter
	useEffect(() => {
		if (!preBootUnlocked) {
			return;
		}

		const handleKeyPress = (e: KeyboardEvent) => {
			if (e.key === "ArrowUp") {
				e.preventDefault();
				setSelectedIndex(prev =>
					prev === 0 ? MENU_ITEMS.length - 1 : prev - 1
				);
				return;
			}

			if (e.key === "ArrowDown") {
				e.preventDefault();
				setSelectedIndex(prev =>
					prev === MENU_ITEMS.length - 1 ? 0 : prev + 1
				);
				return;
			}

			if (e.key === "Enter" || e.key === "Return") {
				e.preventDefault();
				// If auto-boot is paused, resume it
				if (!autoBootEnabled) {
					setAutoBootEnabled(true);
					return;
				}
				// Otherwise, boot the selected entry
				const item = MENU_ITEMS[selectedIndex];
				const isDisabled = item.value === "normal" && !canBootNormal;
				if (isDisabled) {
					return;
				}
				handleSelection(item.value);
			}

			if (e.key === "Escape") {
				e.preventDefault();
				setAutoBootEnabled(false);
			}
		};

		const container = containerRef.current;
		if (container) {
			container.addEventListener("keydown", handleKeyPress);
			return () => container.removeEventListener("keydown", handleKeyPress);
		}
	}, [
		handleSelection,
		canBootNormal,
		selectedIndex,
		preBootUnlocked,
		autoBootEnabled,
	]);

	// Keep selection on a bootable entry when lock state changes
	useEffect(() => {
		if (!canBootNormal && selectedIndex === 0) {
			setSelectedIndex(1);
		}
		if (canBootNormal && !prevCanBootNormal.current) {
			setSelectedIndex(0);
		}
		prevCanBootNormal.current = canBootNormal;
	}, [canBootNormal, selectedIndex]);

	// Focus container for keyboard events and ensure it stays focused
	useEffect(() => {
		if (!preBootUnlocked) {
			return;
		}

		const focusElement = () => {
			if (containerRef.current) {
				containerRef.current.focus();
			}
		};

		focusElement();
		// Re-focus on click to ensure keyboard events work
		const handleClick = () => focusElement();
		document.addEventListener("click", handleClick);

		return () => document.removeEventListener("click", handleClick);
	}, [preBootUnlocked]);

	// Countdown timer for automatic boot
	useEffect(() => {
		if (!preBootUnlocked || !autoBootEnabled || countdown <= 0) {
			return;
		}

		const timer = setTimeout(() => {
			setCountdown(prev => Math.max(prev - 1, 0));
		}, 1000);

		return () => clearTimeout(timer);
	}, [autoBootEnabled, countdown, preBootUnlocked]);

	// Trigger boot when countdown hits zero (if still enabled)
	useEffect(() => {
		if (!preBootUnlocked || !autoBootEnabled || countdown > 0) {
			return;
		}
		setAutoBootEnabled(false);
		// Auto-select the first bootable entry
		const bootableIndex =
			MENU_ITEMS.findIndex(
				item => !(item.value === "normal" && !canBootNormal)
			) ?? 0;
		const fallbackItem =
			MENU_ITEMS[
				bootableIndex === -1 ? (canBootNormal ? 0 : 1) : bootableIndex
			];
		handleSelection(fallbackItem.value);
	}, [
		autoBootEnabled,
		countdown,
		handleSelection,
		canBootNormal,
		preBootUnlocked,
	]);

	// Blink prompt similar to real GRUB prompt
	useEffect(() => {
		const interval = setInterval(() => {
			setPromptVisible(prev => !prev);
		}, GRUB_CONFIG.PROMPT_BLINK_INTERVAL_MS);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		if (preBootUnlocked) {
			return;
		}

		const handlePreBootKey = (e: KeyboardEvent) => {
			if (e.key !== "Enter" && e.key !== "Return") {
				return;
			}
			e.preventDefault();
			handlePreBootUnlock();
		};
		document.addEventListener("keydown", handlePreBootKey);
		return () => {
			document.removeEventListener("keydown", handlePreBootKey);
		};
	}, [handlePreBootUnlock, preBootUnlocked]);

	return (
		<div
			ref={preBootUnlocked ? containerRef : preBootRef}
			tabIndex={0}
			style={GRUB_SCREEN_STYLES.CONTAINER}
		>
			{!preBootUnlocked ? (
				<PreBootScreen />
			) : (
				<div style={GRUB_SCREEN_STYLES.MENU_CONTAINER}>
					<pre style={GRUB_SCREEN_STYLES.HEADER}>
						{`GNU GRUB  version 2.06    |    HackFrameOS Boot Manager`}
					</pre>

					<pre style={GRUB_SCREEN_STYLES.SEPARATOR}>
						{`──────────────────────────────────────────────────────────────`}
					</pre>

					<GrubMenu
						items={MENU_ITEMS}
						selectedIndex={selectedIndex}
						canBootNormal={canBootNormal}
					/>

					<GrubProgressBar
						countdown={countdown}
						autoBootEnabled={autoBootEnabled}
					/>

					<div style={GRUB_SCREEN_STYLES.INSTRUCTIONS}>
						<div style={{ marginBottom: "0.2rem" }}>
							Use the ↑ and ↓ keys to select which entry is highlighted.
						</div>
						<div>Press Enter to boot the highlighted entry.</div>
					</div>

					<div style={GRUB_SCREEN_STYLES.BUILD_INFO}>
						<div> Build: hf-grub 2.06-custom | Serial: 0xAC21-FRAME-76B4</div>
					</div>

					<div style={GRUB_SCREEN_STYLES.PROMPT}>
						{`>>> Press ENTER to boot <<<${promptVisible ? "_" : " "}`}
					</div>
				</div>
			)}
		</div>
	);
};
