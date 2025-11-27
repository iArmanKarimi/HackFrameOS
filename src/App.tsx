import React, { useState, useEffect, useCallback } from "react";
import SafeModeTerminal from "./components/BIOS/SafeModeTerminal";
import { BootScreen } from "./components/BIOS/BootScreen";
import { StartScreen } from "./components/BIOS/StartScreen";
import DesktopShell from "./ui/DesktopShell";
import { initFilesystem } from "./sim/fs";
import MemtestScreen from "./components/BIOS/MemtestScreen";

type AppPhase = "start" | "boot" | "safemode" | "desktop" | "memtest";
type BootTarget = "normal" | "safemode" | "memtest" | "restart";
const SAFE_MODE_FLAG = "hf:safeModeComplete";

const App: React.FC = () => {
	const [phase, setPhase] = useState<AppPhase>("start");
	const [bootTarget, setBootTarget] = useState<BootTarget>("safemode");
	const [hasCompletedSafeMode, setHasCompletedSafeMode] = useState<boolean>(
		() => {
			if (typeof window === "undefined") return false;
			return window.localStorage.getItem(SAFE_MODE_FLAG) === "true";
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
			if (target === "restart") {
				window.location.reload();
				return;
			}

			if (target === "memtest") {
				setPhase("memtest");
				return;
			}

			if (target === "normal" && !hasCompletedSafeMode) {
				console.warn("Normal boot locked until Safe Mode completes.");
				return;
			}

			setBootTarget(target === "normal" ? "normal" : "safemode");
			setPhase("boot");
		},
		[hasCompletedSafeMode]
	);

	const handleBootComplete = useCallback(() => {
		if (bootTarget === "normal") {
			setPhase("desktop");
			return;
		}
		setPhase("safemode");
	}, [bootTarget]);

	const handleSafeModeComplete = useCallback(() => {
		setHasCompletedSafeMode(true);
		try {
			window.localStorage.setItem(SAFE_MODE_FLAG, "true");
		} catch (err) {
			console.warn("Failed to persist safe mode completion flag:", err);
		}
		setPhase("desktop");
	}, []);

	if (phase === "start") {
		return (
			<StartScreen
				canBootNormal={hasCompletedSafeMode}
				onSelectBoot={handleBootSelection}
			/>
		);
	}

	if (phase === "boot") {
		return <BootScreen onComplete={handleBootComplete} />;
	}

	if (phase === "memtest") {
		return <MemtestScreen onExit={() => setPhase("start")} />;
	}

	if (phase === "safemode") {
		return <SafeModeTerminal onComplete={handleSafeModeComplete} />;
	}

	return <DesktopShell />;
};

export default App;
