import React from "react";
import logo from "../../assets/logo.png";
import { useGameContext } from "../../context/GameContext";

// ─── Component ────────────────────────────────────────────────────────────────

const Navbar: React.FC = () => {
  const { resetGame, isGameOver, currentTurn } = useGameContext();

  return (
    <nav className="navbar">
      <div className="navbar__logo-wrapper">
        <img
          src={logo}
          alt="wsuits6Chess logo"
          className="navbar__logo"
        />
        <span className="navbar__title">wsuits6Chess</span>
      </div>

      <div className="navbar__center">
        <span className="navbar__turn-indicator">
          {isGameOver ? (
            <span className="navbar__turn-indicator--gameover">Game Over</span>
          ) : (
            <span className={`navbar__turn-indicator--${currentTurn}`}>
              {currentTurn === "white" ? "⬜ White's Turn" : "⬛ Black's Turn"}
            </span>
          )}
        </span>
      </div>

      <div className="navbar__actions">
        <button
          className="navbar__btn navbar__btn--reset"
          onClick={resetGame}
          title="Start a new game"
        >
          New Game
        </button>
      </div>
    </nav>
  );
};

export default Navbar;