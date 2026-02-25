import React from "react";
import "./Pieces.css";
import { ChessPiece } from "../../utils/chessLogic";

// ─── Props ────────────────────────────────────────────────────────────────────

interface PieceProps {
  piece: ChessPiece;
}

// ─── Unicode Chess Symbols ────────────────────────────────────────────────────

const PIECE_SYMBOLS: Record<string, Record<string, string>> = {
  white: {
    king:   "♔",
    queen:  "♕",
    rook:   "♖",
    bishop: "♗",
    knight: "♘",
    pawn:   "♙",
  },
  black: {
    king:   "♚",
    queen:  "♛",
    rook:   "♜",
    bishop: "♝",
    knight: "♞",
    pawn:   "♟",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

const Piece: React.FC<PieceProps> = ({ piece }) => {
  const symbol = PIECE_SYMBOLS[piece.color][piece.type];

  return (
    <span
      className={`piece piece--${piece.color} piece--${piece.type}`}
      role="img"
      aria-label={`${piece.color} ${piece.type}`}
    >
      {symbol}
    </span>
  );
};

export default Piece;