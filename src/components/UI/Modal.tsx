import React from "react";
import { PieceType, PieceColor } from "../../utils/chessLogic";
import { useGameContext } from "../../context/GameContext";

// ─── Promotion Piece Options ──────────────────────────────────────────────────

const PROMOTION_PIECES: { type: PieceType; whiteSymbol: string; blackSymbol: string; label: string }[] = [
  { type: "queen",  whiteSymbol: "♕", blackSymbol: "♛", label: "Queen"  },
  { type: "rook",   whiteSymbol: "♖", blackSymbol: "♜", label: "Rook"   },
  { type: "bishop", whiteSymbol: "♗", blackSymbol: "♝", label: "Bishop" },
  { type: "knight", whiteSymbol: "♘", blackSymbol: "♞", label: "Knight" },
];

// ─── Component ────────────────────────────────────────────────────────────────

const Modal: React.FC = () => {
  const { promotionPending, promotePawn, isGameOver, isCheckmate, isStalemate, winner, resetGame } =
    useGameContext();

  // ── Promotion Modal ──────────────────────────────────────────────────────────

  if (promotionPending) {
    const { color } = promotionPending;

    return (
      <div className="modal__overlay">
        <div className="modal__container">
          <h2 className="modal__title">Pawn Promotion</h2>
          <p className="modal__subtitle">
            Choose a piece to promote your pawn to:
          </p>
          <div className="modal__promotion-options">
            {PROMOTION_PIECES.map(({ type, whiteSymbol, blackSymbol, label }) => (
              <button
                key={type}
                className="modal__promotion-btn"
                onClick={() => promotePawn(type)}
                title={label}
              >
                <span className={`modal__promotion-symbol modal__promotion-symbol--${color}`}>
                  {color === "white" ? whiteSymbol : blackSymbol}
                </span>
                <span className="modal__promotion-label">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Game Over Modal ──────────────────────────────────────────────────────────

  if (isGameOver || isCheckmate || isStalemate) {
    const getTitle = (): string => {
      if (isCheckmate) return "Checkmate!";
      if (isStalemate) return "Stalemate!";
      return "Game Over!";
    };

    const getMessage = (): string => {
      if (isStalemate) return "The game is a draw.";
      if (winner === "white") return "White wins! 🎉";
      if (winner === "black") return "Black wins! 🎉";
      return "The game has ended.";
    };

    return (
      <div className="modal__overlay">
        <div className="modal__container">
          <h2 className="modal__title">{getTitle()}</h2>
          <p className="modal__subtitle">{getMessage()}</p>
          <button
            className="modal__btn modal__btn--primary"
            onClick={resetGame}
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default Modal;