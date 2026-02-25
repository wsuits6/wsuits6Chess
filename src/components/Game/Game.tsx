import React from "react";
import "./Game.css";
import Board from "../Board/Board";
import GameStatus from "./GameStatus";
import Timer from "../UI/Timer";
import Modal from "../UI/Modal";
import { useGameLogic } from "../../hooks/useGameLogic";

// ─── Component ────────────────────────────────────────────────────────────────

const Game: React.FC = () => {
  const { handleReset } = useGameLogic();

  return (
    <div className="game">
      {/* Modal overlay for promotion / game over */}
      <Modal />

      <div className="game__layout">
        {/* Left Panel — Black Timer + Status */}
        <aside className="game__side-panel game__side-panel--left">
          <Timer color="black" />
          <GameStatus />
        </aside>

        {/* Center — Board */}
        <main className="game__board-wrapper">
          <div className="game__board-container">
            <Board />
          </div>
          <div className="game__controls">
            <button
              className="game__btn game__btn--reset"
              onClick={handleReset}
              title="Start a new game"
            >
              New Game
            </button>
          </div>
        </main>

        {/* Right Panel — White Timer */}
        <aside className="game__side-panel game__side-panel--right">
          <Timer color="white" />
        </aside>
      </div>
    </div>
  );
};

export default Game;