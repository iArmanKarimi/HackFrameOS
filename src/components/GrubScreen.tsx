import React, { useEffect, useRef, useState, useCallback } from "react";
import { requestFullscreen } from "../utils/fullscreen";
import { GRUB_CONFIG } from "../constants";

/**
 * GrubScreen Component
 * ---------------------
 * Authentic GRUB boot menu simulation.
 * Text-based interface, keyboard-only interaction.
 * Automatically enters fullscreen when user starts boot.
 */
type MenuItemValue = "normal" | "safemode" | "memtest" | "restart";

type MenuItem = {
	label: string;
	detail?: string;
	value: MenuItemValue;
};

const BASE_FONT_STACK =
	"'Liberation Mono', 'DejaVu Sans Mono', 'Source Code Pro', monospace";

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

export const GrubScreen: React.FC<{
	onSelectBoot: (value: MenuItemValue) => void;
	canBootNormal: boolean;
}> = ({ onSelectBoot, canBootNormal }) => {
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

	const filledSegments = autoBootEnabled
		? Math.round(
				((GRUB_CONFIG.BOOT_TIMEOUT_SECONDS - countdown) /
					GRUB_CONFIG.BOOT_TIMEOUT_SECONDS) *
					GRUB_CONFIG.PROGRESS_SEGMENTS
			)
		: GRUB_CONFIG.PROGRESS_SEGMENTS;
	const progressBar =
		"█".repeat(filledSegments) +
		"░".repeat(GRUB_CONFIG.PROGRESS_SEGMENTS - filledSegments);

	return (
		<div
			ref={preBootUnlocked ? containerRef : preBootRef}
			tabIndex={0}
			style={{
				width: "100vw",
				height: "100vh",
				backgroundColor: "#000000",
				backgroundImage:
					"linear-gradient(180deg, rgba(10,10,10,0.95) 0%, rgba(0,0,0,1) 100%), repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 3px)",
				color: "#ffffff",
				fontFamily: BASE_FONT_STACK,
				fontSize: "13px",
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				alignItems: "center",
				padding: "0",
				outline: "none",
				lineHeight: "1.2",
				cursor: "none",
				overflow: "hidden",
				position: "relative",
				userSelect: "none",
			}}
		>
			{!preBootUnlocked ? (
				<div
					style={{
						width: "100%",
						height: "100%",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						textAlign: "center",
						gap: "1rem",
						cursor: "default",
					}}
				>
					<pre
						style={{
							fontSize: "14px",
							letterSpacing: "0.15em",
							color: "#00c2ff",
							margin: 0,
						}}
					>
						{`HackFrame Firmware Interface`}
					</pre>
					<div
						style={{ fontSize: "12px", color: "#a9a9a9", maxWidth: "420px" }}
					>
						Initializing secure display pipeline. Press ENTER to start booting
						GNU GRUB.
					</div>
					<div
						style={{
							padding: "0.75rem 1.5rem",
							border: "1px solid #00c2ff",
							color: "#00c2ff",
							fontSize: "12px",
							fontFamily: BASE_FONT_STACK,
							letterSpacing: "0.3em",
						}}
					>
						PRESS ENTER
					</div>
				</div>
			) : (
				<div
					style={{
						width: "100%",
						height: "100%",
						padding: "1.5rem",
						boxSizing: "border-box",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<pre
						style={{
							margin: 0,
							fontSize: "13px",
							color: "#ffffff",
							whiteSpace: "pre",
							fontFamily: BASE_FONT_STACK,
							textAlign: "center",
						}}
					>
						{`GNU GRUB  version 2.06    |    HackFrameOS Boot Manager`}
					</pre>

					<pre
						style={{
							margin: "0.75rem 0 1rem 0",
							fontSize: "12px",
							color: "#8f8f8f",
							whiteSpace: "pre",
							fontFamily: BASE_FONT_STACK,
							textAlign: "center",
						}}
					>
						{`──────────────────────────────────────────────────────────────`}
					</pre>

					<div
						style={{
							border: "1px solid rgba(255,255,255,0.25)",
							padding: "0.5rem 0",
							width: "460px",
							maxWidth: "90vw",
							backgroundColor: "rgba(5,5,5,0.65)",
							boxShadow: "0 0 18px rgba(0,0,0,0.45)",
							margin: "0 auto",
						}}
					>
						{MENU_ITEMS.map((item, index) => {
							const isActive = index === selectedIndex;
							const isLocked = item.value === "normal" && !canBootNormal;
							return (
								<div
									key={item.value}
									style={{
										fontFamily: BASE_FONT_STACK,
										fontSize: "13px",
										color: isLocked
											? "#5b5b5b"
											: isActive
												? "#ffffff"
												: "#c4c4c4",
										padding: "0.45rem 1rem",
										backgroundColor:
											isActive && !isLocked ? "#114d9a" : "transparent",
										borderLeft:
											isActive && !isLocked
												? "3px solid #4db5ff"
												: "3px solid transparent",
										display: "flex",
										flexDirection: "column",
										gap: "0.2rem",
										opacity: isLocked ? 0.6 : 1,
										textAlign: "center",
									}}
								>
									<span>{item.label}</span>
									{item.detail && (
										<span
											style={{
												fontSize: "11px",
												color: isLocked
													? "#555555"
													: isActive
														? "#cfe9ff"
														: "#7e7e7e",
												fontFamily: BASE_FONT_STACK,
											}}
										>
											{item.detail}
										</span>
									)}
									{isLocked && (
										<span
											style={{
												fontSize: "11px",
												color: "#ff9b63",
												fontFamily: BASE_FONT_STACK,
											}}
										>
											System image flagged as damaged; Safe Mode must repair.
										</span>
									)}
								</div>
							);
						})}
					</div>

					<div
						style={{
							marginTop: "1.25rem",
							fontSize: "12px",
							color: "#a9a9a9",
							fontFamily: BASE_FONT_STACK,
							textAlign: "center",
						}}
					>
						<div>
							Boot default entry in {autoBootEnabled ? `${countdown}s` : "—"}{" "}
							{progressBar}
						</div>
						{!autoBootEnabled && (
							<div style={{ marginTop: "0.25rem", color: "#737373" }}>
								Auto boot paused (press ENTER to continue)
							</div>
						)}
					</div>

					<div
						style={{
							marginTop: "2.5rem",
							fontFamily: BASE_FONT_STACK,
							fontSize: "11.5px",
							color: "#9d9d9d",
							lineHeight: "1.5",
							textAlign: "center",
						}}
					>
						<div style={{ marginBottom: "0.2rem" }}>
							Use the ↑ and ↓ keys to select which entry is highlighted.
						</div>
						<div>Press Enter to boot the highlighted entry.</div>
					</div>

					<div
						style={{
							marginTop: "1rem",
							fontFamily: BASE_FONT_STACK,
							fontSize: "11px",
							color: "#636363",
							textAlign: "center",
						}}
					>
						<div> Build: hf-grub 2.06-custom | Serial: 0xAC21-FRAME-76B4</div>
					</div>

					<div
						style={{
							marginTop: "0.75rem",
							fontFamily: BASE_FONT_STACK,
							fontSize: "12px",
							color: "#00c2ff",
							textAlign: "center",
						}}
					>
						{`>>> Press ENTER to boot <<<${promptVisible ? "_" : " "}`}
					</div>
				</div>
			)}
		</div>
	);
};
