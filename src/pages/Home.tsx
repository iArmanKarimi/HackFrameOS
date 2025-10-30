import React, { useState } from "react";
import SafeModeTerminal from "./Boot/SafeModeTerminal";
import { BootScreen } from "./Boot/BootScreen";

const Home: React.FC = () => {
  const [bootDone, setBootDone] = useState(false);
  return bootDone ? (
    <SafeModeTerminal />
  ) : (
    <BootScreen onComplete={() => setBootDone(true)} />
  );
};

export default Home;
