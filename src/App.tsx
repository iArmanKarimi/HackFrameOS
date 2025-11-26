import React, { useState } from "react";
import SafeModeTerminal from "./components/BIOS/SafeModeTerminal";
import { BootScreen } from "./components/BIOS/BootScreen";

const App: React.FC = () => {
  const [bootDone, setBootDone] = useState(false);
  return bootDone ? (
    <SafeModeTerminal />
  ) : (
    <BootScreen onComplete={() => setBootDone(true)} />
  );
};

export default App;
