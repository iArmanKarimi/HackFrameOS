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
		detail: "Normal boot sequence",
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
		isBootingRef.current = false;
	}, []); // Empty deps = run only on mount
	const [selectedIndex, setSelectedIndex] = useState(() => {
		const initial = canBootNormal ? 0 : 1;
		return initial;
	});
	const selectedIndexRef = useRef(selectedIndex);
	const [promptVisible, setPromptVisible] = useState(true);

	useEffect(() => {
		selectedIndexRef.current = selectedIndex;
	}, [selectedIndex, preBootUnlocked, canBootNormal]);

	const handlePreBootUnlock = useCallback(async () => {
		if (preBootUnlocked) {
			return;
		}

		setPreBootUnlocked(true);
		// Try to request fullscreen, but don't block on it
		try {
			await requestFullscreen(preBootRef.current ?? undefined);
		} catch (error) {
			// Continue even if fullscreen is not supported
		}
	}, [preBootUnlocked]);

	const handleSelection = useCallback(
		async (value: MenuItemValue) => {
			if (isBootingRef.current) {
				return;
			}
			isBootingRef.current = true;

			// Request fullscreen with timeout - don't block boot if it fails or hangs
			const fullscreenPromise = requestFullscreen().catch(error => {
				return null; // Continue even if fullscreen fails
			});

			// Add timeout to prevent hanging
			const fullscreenTimeout = new Promise(resolve => {
				setTimeout(() => {
					resolve(null);
				}, 1000); // 1 second timeout
			});

			try {
				await Promise.race([fullscreenPromise, fullscreenTimeout]);
			} catch (error) {
				// Continue even if fullscreen fails
			}

			// Proceed with boot regardless of fullscreen result
			setTimeout(() => {
				onSelectBoot(value);
				// Reset booting flag after a delay in case user comes back
				setTimeout(() => {
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
						return 1;
					}
					return prev;
				});
			} else {
				// Normal boot just got unlocked - move to normal if safe mode was selected
				setSelectedIndex(prev => {
					if (prev === 1) {
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
			}
		};

		const rafId = requestAnimationFrame(focusElement);

		// Re-focus on click to ensure keyboard events work
		const handleClick = () => {
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

	const handleKeyDown = useCallback(
		(e: KeyboardEvent | React.KeyboardEvent<HTMLDivElement>) => {
			if (!preBootUnlocked) {
				return;
			}

			const currentIndex = selectedIndexRef.current;

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
				// Use functional update to ensure we get the latest state
				setSelectedIndex(prev => {
					const calculated = prev === MENU_ITEMS.length - 1 ? 0 : prev + 1;
					return calculated === 0 && !canBootNormal ? 1 : calculated;
				});
				return;
			}

			if (e.key === "Enter" || e.key === "Return") {
				// Block Enter key when boot is already in progress
				if (isBootingRef.current) {
					return;
				}
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();
				const item = MENU_ITEMS[currentIndex];
				// Only "normal" boot can be disabled; all other items (safemode, memtest, restart) are always enabled
				const isDisabled = item.value === "normal" && !canBootNormal;
				if (isDisabled) {
					return;
				}
				// Memtest, safemode, and restart are always selectable
				handleSelection(item.value);
			}
		},
		[preBootUnlocked, canBootNormal, handleSelection]
	);

	// Handle keyboard events at document level when GRUB menu is unlocked
	// Since GRUB only handles one instance of key presses, document-level is sufficient
	useEffect(() => {
		if (!preBootUnlocked) {
			return;
		}

		const handleDocumentKeyDown = (e: KeyboardEvent) => {
			// Only handle navigation and Enter keys
			if (
				e.key === "ArrowUp" ||
				e.key === "ArrowDown" ||
				e.key === "Enter" ||
				e.key === "Return"
			) {
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
		document.addEventListener("keydown", handleDocumentKeyDown, true);
		return () => {
			document.removeEventListener("keydown", handleDocumentKeyDown, true);
		};
	}, [preBootUnlocked, handleKeyDown]);

	return (
		<div
			ref={preBootUnlocked ? containerRef : preBootRef}
			tabIndex={0}
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
