import React, { useCallback, useEffect, useRef, useState } from "react";
import { FirmwareScreen } from "./FirmwareScreen";
import { GrubMenu } from "./GrubMenu";

import { requestFullscreen } from "../../utils/fullscreen";

import { GRUB_CONFIG } from "../../constants";
import { GRUB_SCREEN_STYLES } from "../../styles/terminalStyles";

import type { GrubScreenProps, MenuItem, MenuItemValue } from "../../types";

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
	const isBootingRef = useRef(false);
	const [preBootUnlocked, setPreBootUnlocked] = useState(false);

	// Reset booting flag on component mount (always reset to false when component is created)
	useEffect(() => {
		console.log(
			"[GrubScreen] Component mounted, resetting isBootingRef to false"
		);
		isBootingRef.current = false;
	}, []); // Empty deps = run only on mount
	const [selectedIndex, setSelectedIndex] = useState(() => {
		const initial = canBootNormal ? 0 : 1;
		console.debug(
			"[GrubScreen] Initial selectedIndex:",
			initial,
			"canBootNormal:",
			canBootNormal
		);
		return initial;
	});
	const selectedIndexRef = useRef(selectedIndex);
	const [promptVisible, setPromptVisible] = useState(true);

	// Debug: Log state changes
	useEffect(() => {
		console.debug(
			"[GrubScreen] State update - selectedIndex:",
			selectedIndex,
			"preBootUnlocked:",
			preBootUnlocked,
			"canBootNormal:",
			canBootNormal
		);
		selectedIndexRef.current = selectedIndex;
	}, [selectedIndex, preBootUnlocked, canBootNormal]);

	const handlePreBootUnlock = useCallback(async () => {
		if (preBootUnlocked) {
			console.debug("[GrubScreen] PreBoot unlock already completed");
			return;
		}

		console.debug("[GrubScreen] Unlocking pre-boot screen");
		setPreBootUnlocked(true);
		// Try to request fullscreen, but don't block on it
		try {
			await requestFullscreen(preBootRef.current ?? undefined);
			console.debug("[GrubScreen] Fullscreen requested successfully");
		} catch (error) {
			console.warn(
				"[GrubScreen] Fullscreen request failed before GRUB:",
				error
			);
			// Continue even if fullscreen is not supported
		}
	}, [preBootUnlocked]);

	const handleSelection = useCallback(
		async (value: MenuItemValue) => {
			console.log(
				"[GrubScreen] handleSelection called, value:",
				value,
				"isBootingRef.current:",
				isBootingRef.current
			);
			if (isBootingRef.current) {
				console.warn(
					"[GrubScreen] Boot already in progress, ignoring selection"
				);
				return;
			}
			console.log("[GrubScreen] Setting isBootingRef.current = true");
			isBootingRef.current = true;

			// Request fullscreen with timeout - don't block boot if it fails or hangs
			const fullscreenPromise = requestFullscreen().catch(error => {
				console.warn("[GrubScreen] Fullscreen request failed:", error);
				return null; // Continue even if fullscreen fails
			});

			// Add timeout to prevent hanging
			const fullscreenTimeout = new Promise(resolve => {
				setTimeout(() => {
					console.warn(
						"[GrubScreen] Fullscreen request timed out, proceeding anyway"
					);
					resolve(null);
				}, 1000); // 1 second timeout
			});

			try {
				console.log("[GrubScreen] Requesting fullscreen...");
				await Promise.race([fullscreenPromise, fullscreenTimeout]);
				console.log(
					"[GrubScreen] Fullscreen handled, booting in",
					GRUB_CONFIG.FULLSCREEN_DELAY_MS,
					"ms"
				);
			} catch (error) {
				console.error(
					"[GrubScreen] Unexpected error during fullscreen:",
					error
				);
			}

			// Proceed with boot regardless of fullscreen result
			setTimeout(() => {
				console.log("[GrubScreen] Calling onSelectBoot with:", value);
				onSelectBoot(value);
				// Reset booting flag after a delay in case user comes back
				setTimeout(() => {
					console.log(
						"[GrubScreen] Resetting isBootingRef.current = false (after onSelectBoot)"
					);
					isBootingRef.current = false;
				}, 2000);
			}, GRUB_CONFIG.FULLSCREEN_DELAY_MS);
		},
		[onSelectBoot]
	);

	// Keep selection on a bootable entry when lock state changes (only when canBootNormal changes)
	useEffect(() => {
		// Only adjust selection when canBootNormal actually changes, not on every selectedIndex change
		if (canBootNormal !== prevCanBootNormal.current) {
			if (!canBootNormal) {
				// Normal boot just got locked - move to safe mode if currently on normal
				setSelectedIndex(prev => {
					if (prev === 0) {
						console.debug(
							"[GrubScreen] Normal boot locked, moving selection to index 1"
						);
						return 1;
					}
					return prev;
				});
			} else {
				// Normal boot just got unlocked - move to normal if safe mode was selected
				setSelectedIndex(prev => {
					if (prev === 1) {
						console.debug(
							"[GrubScreen] Normal boot unlocked, moving selection to index 0"
						);
						return 0;
					}
					return prev;
				});
			}
			prevCanBootNormal.current = canBootNormal;
		}
	}, [canBootNormal]);

	// Reset booting flag when GRUB menu is unlocked (in case user returns from another screen)
	useEffect(() => {
		if (preBootUnlocked) {
			console.log(
				"[GrubScreen] GRUB menu unlocked, resetting isBootingRef to false"
			);
			isBootingRef.current = false;
		}
	}, [preBootUnlocked]);

	// Focus container for keyboard events and ensure it stays focused
	useEffect(() => {
		if (!preBootUnlocked) {
			return;
		}

		const focusElement = () => {
			if (containerRef.current) {
				containerRef.current.focus();
				console.debug("[GrubScreen] Container focused");
			} else {
				console.warn("[GrubScreen] Container ref is null, cannot focus");
			}
		};

		const rafId = requestAnimationFrame(focusElement);

		// Re-focus on click to ensure keyboard events work
		const handleClick = () => {
			console.debug("[GrubScreen] Click detected, refocusing container");
			focusElement();
		};
		document.addEventListener("click", handleClick);

		return () => {
			cancelAnimationFrame(rafId);
			document.removeEventListener("click", handleClick);
		};
	}, [preBootUnlocked]);

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
			console.debug("[GrubScreen] PreBoot key pressed:", e.key);
			if (e.key !== "Enter" && e.key !== "Return") {
				return;
			}
			e.preventDefault();
			console.debug("[GrubScreen] PreBoot Enter detected, unlocking");
			handlePreBootUnlock();
		};
		document.addEventListener("keydown", handlePreBootKey);
		return () => {
			document.removeEventListener("keydown", handlePreBootKey);
		};
	}, [handlePreBootUnlock, preBootUnlocked]);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent | React.KeyboardEvent<HTMLDivElement>) => {
			if (!preBootUnlocked) {
				console.debug(
					"[GrubScreen] Key pressed but preBoot not unlocked:",
					e.key
				);
				return;
			}

			const currentIndex = selectedIndexRef.current;
			console.debug(
				"[GrubScreen] Key pressed:",
				e.key,
				"selectedIndex:",
				currentIndex
			);

			if (e.key === "ArrowUp") {
				e.preventDefault();
				e.stopPropagation();
				// Allow arrow keys even when booting is in progress
				// Calculate new index
				let newIndex =
					currentIndex === 0 ? MENU_ITEMS.length - 1 : currentIndex - 1;
				// Skip index 0 if normal boot is locked (wrap to last item)
				if (newIndex === 0 && !canBootNormal) {
					newIndex = MENU_ITEMS.length - 1;
				}
				console.debug(
					"[GrubScreen] ArrowUp: moving from",
					currentIndex,
					"to",
					newIndex
				);
				// Use functional update to ensure we get the latest state
				setSelectedIndex(prev => {
					const calculated = prev === 0 ? MENU_ITEMS.length - 1 : prev - 1;
					return calculated === 0 && !canBootNormal
						? MENU_ITEMS.length - 1
						: calculated;
				});
				return;
			}

			if (e.key === "ArrowDown") {
				e.preventDefault();
				e.stopPropagation();
				// Allow arrow keys even when booting is in progress
				// Calculate new index
				let newIndex =
					currentIndex === MENU_ITEMS.length - 1 ? 0 : currentIndex + 1;
				// Skip index 0 if normal boot is locked (go to index 1 instead)
				if (newIndex === 0 && !canBootNormal) {
					newIndex = 1;
				}
				console.debug(
					"[GrubScreen] ArrowDown: moving from",
					currentIndex,
					"to",
					newIndex
				);
				// Use functional update to ensure we get the latest state
				setSelectedIndex(prev => {
					const calculated = prev === MENU_ITEMS.length - 1 ? 0 : prev + 1;
					return calculated === 0 && !canBootNormal ? 1 : calculated;
				});
				return;
			}

			if (e.key === "Enter" || e.key === "Return") {
				console.log(
					"[GrubScreen] Enter key detected in handleKeyDown, isBootingRef.current:",
					isBootingRef.current,
					"preBootUnlocked:",
					preBootUnlocked
				);
				// Block Enter key when boot is already in progress
				if (isBootingRef.current) {
					console.warn(
						"[GrubScreen] Enter pressed but boot in progress (isBootingRef.current = true), ignoring. This should not happen if component was properly reset."
					);
					return;
				}
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();
				const item = MENU_ITEMS[currentIndex];
				console.log(
					"[GrubScreen] Selected item:",
					item,
					"currentIndex:",
					currentIndex
				);
				// Only "normal" boot can be disabled; all other items (safemode, memtest, restart) are always enabled
				const isDisabled = item.value === "normal" && !canBootNormal;
				console.log(
					"[GrubScreen] Enter pressed, item:",
					item.value,
					"disabled:",
					isDisabled,
					"selectedIndex:",
					currentIndex,
					"canBootNormal:",
					canBootNormal
				);
				if (isDisabled) {
					console.warn("[GrubScreen] Selection disabled, ignoring");
					return;
				}
				// Memtest, safemode, and restart are always selectable
				console.log("[GrubScreen] Calling handleSelection with:", item.value);
				handleSelection(item.value);
			}
		},
		[preBootUnlocked, canBootNormal, handleSelection]
	);

	// Handle keyboard events at document level when GRUB menu is unlocked
	// Since GRUB only handles one instance of key presses, document-level is sufficient
	useEffect(() => {
		console.debug(
			"[GrubScreen] Setting up document listener, preBootUnlocked:",
			preBootUnlocked
		);
		if (!preBootUnlocked) {
			console.debug(
				"[GrubScreen] preBootUnlocked is false, not setting up listener"
			);
			return;
		}

		const handleDocumentKeyDown = (e: KeyboardEvent) => {
			console.log("[GrubScreen] Document keydown:", e.key, "target:", e.target);
			// Only handle navigation and Enter keys
			if (
				e.key === "ArrowUp" ||
				e.key === "ArrowDown" ||
				e.key === "Enter" ||
				e.key === "Return"
			) {
				console.log("[GrubScreen] Document handler processing key:", e.key);
				// Prevent default and stop propagation for all handled keys
				e.preventDefault();
				e.stopPropagation();
				if (e.key === "Enter" || e.key === "Return") {
					e.stopImmediatePropagation();
				}
				handleKeyDown(e);
			}
		};

		// Use capture phase to catch events early before other handlers
		console.debug("[GrubScreen] Adding document keydown listener");
		document.addEventListener("keydown", handleDocumentKeyDown, true);
		return () => {
			console.debug("[GrubScreen] Removing document keydown listener");
			document.removeEventListener("keydown", handleDocumentKeyDown, true);
		};
	}, [preBootUnlocked, handleKeyDown]);

	return (
		<div
			ref={preBootUnlocked ? containerRef : preBootRef}
			tabIndex={0}
			onFocus={e => {
				console.debug("[GrubScreen] Container received focus");
			}}
			onBlur={e => {
				console.debug("[GrubScreen] Container lost focus");
			}}
			style={GRUB_SCREEN_STYLES.CONTAINER}
		>
			{!preBootUnlocked ? (
				<FirmwareScreen />
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
