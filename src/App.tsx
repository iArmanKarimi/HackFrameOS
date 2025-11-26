import React, { useState } from "react";
import SafeModeTerminal from "./components/BIOS/SafeModeTerminal";
import { BootScreen } from "./components/BIOS/BootScreen";
import DesktopShell from "./ui/DesktopShell";

type AppPhase = "boot" | "safemode" | "desktop";

const App: React.FC = () => {
  const [phase, setPhase] = useState<AppPhase>("boot");

  if (phase === "boot") {
    return <BootScreen onComplete={() => setPhase("safemode")} />;
  }

  if (phase === "safemode") {
    return <SafeModeTerminal onComplete={() => setPhase("desktop")} />;
  }

  return <DesktopShell />;
};

export default App;
