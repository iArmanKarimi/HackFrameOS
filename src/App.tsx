import React, { useState, useEffect } from "react";
import SafeModeTerminal from "./components/BIOS/SafeModeTerminal";
import { BootScreen } from "./components/BIOS/BootScreen";
import DesktopShell from "./ui/DesktopShell";
import { initFilesystem } from "./sim/fs";

type AppPhase = "boot" | "safemode" | "desktop";

const App: React.FC = () => {
const [phase, setPhase] = useState<AppPhase>("boot");

// Initialize filesystem with IndexedDB persistence on app startup
useEffect(() => {
	initFilesystem().catch((err) => {
		console.error("Failed to initialize filesystem:", err);
	});
}, []);

if (phase === "boot") {
return <BootScreen onComplete={() => setPhase("safemode")} />;
}

if (phase === "safemode") {
return <SafeModeTerminal onComplete={() => setPhase("desktop")} />;
}

return <DesktopShell />;
};

export default App;
