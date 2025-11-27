import React, { useState, useEffect, useCallback } from "react";
import SafeModeTerminal from "./components/SafeModeTerminal";
import { BootScreen } from "./components/BootScreen";
import { GrubScreen } from "./components/GrubScreen";
import DesktopShell from "./components/DesktopShell";
import { initFilesystem } from "./os/fs";
import MemtestScreen from "./components/MemtestScreen";
import {
	APP_PHASES,
	BOOT_TARGETS,
	STORAGE_KEYS,
	type AppPhase,
	type BootTarget,
} from "./constants";

const App: React.FC = () => {
	const [phase, setPhase] = useState<AppPhase>(APP_PHASES.START);
	const [bootTarget, setBootTarget] = useState<BootTarget>(
		BOOT_TARGETS.SAFEMODE
	);
	const [hasCompletedSafeMode, setHasCompletedSafeMode] = useState<boolean>(
		() => {
			if (typeof window === "undefined") return false;
			return (
				window.localStorage.getItem(STORAGE_KEYS.SAFE_MODE_COMPLETE) === "true"
			);
		}
	);

	// Initialize filesystem with IndexedDB persistence on app startup
	// Failures are handled gracefully - app will work without filesystem
	useEffect(() => {
		initFilesystem().catch(err => {
			// Filesystem is optional - app can function without it
			console.warn("Filesystem initialization failed (non-critical):", err);
		});
	}, []);

	const handleBootSelection = useCallback(
		(target: BootTarget) => {
			if (target === BOOT_TARGETS.RESTART) {
				window.location.reload();
				return;
			}

			if (target === BOOT_TARGETS.MEMTEST) {
				setPhase(APP_PHASES.MEMTEST);
				return;
			}

			if (target === BOOT_TARGETS.NORMAL && !hasCompletedSafeMode) {
				console.warn("Normal boot locked until Safe Mode completes.");
				return;
			}

			setBootTarget(
				target === BOOT_TARGETS.NORMAL
					? BOOT_TARGETS.NORMAL
					: BOOT_TARGETS.SAFEMODE
			);
			setPhase(APP_PHASES.BOOT);
		},
		[hasCompletedSafeMode]
	);

	const handleBootComplete = useCallback(() => {
		if (bootTarget === BOOT_TARGETS.NORMAL) {
			setPhase(APP_PHASES.DESKTOP);
			return;
		}
		setPhase(APP_PHASES.SAFEMODE);
	}, [bootTarget]);

	const handleSafeModeComplete = useCallback(() => {
		setHasCompletedSafeMode(true);
		try {
			window.localStorage.setItem(STORAGE_KEYS.SAFE_MODE_COMPLETE, "true");
		} catch (err) {
			console.warn("Failed to persist safe mode completion flag:", err);
		}
		setPhase(APP_PHASES.DESKTOP);
	}, []);

	if (phase === APP_PHASES.START) {
		return (
			<GrubScreen
				canBootNormal={hasCompletedSafeMode}
				onSelectBoot={handleBootSelection}
			/>
		);
	}

	if (phase === APP_PHASES.BOOT) {
		return <BootScreen onComplete={handleBootComplete} />;
	}

	if (phase === APP_PHASES.MEMTEST) {
		return <MemtestScreen onExit={() => setPhase(APP_PHASES.START)} />;
	}

	if (phase === APP_PHASES.SAFEMODE) {
		return <SafeModeTerminal onComplete={handleSafeModeComplete} />;
	}

	return <DesktopShell />;
};

export default App;
