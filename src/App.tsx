import React from "react";
import { GameProvider } from "./context/GameContext";
import Navbar from "./components/UI/Navbar";
import Game from "./components/Game/Game";
import "./styles/variables.css";
import "./styles/global.css";

// ─── Component ────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  return (
    <GameProvider>
      <div className="app">
        <Navbar />
        <Game />
      </div>
    </GameProvider>
  );
};

export default App;