import React from "react";
import { useGameLogic } from "../../hooks/useGameLogic";
import { ChessPiece, PieceColor } from "../../utils/chessLogic";

// ─── Piece Symbol Helper ──────────────────────────────────────────────────────

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

// ─── Captured Pieces Display ──────────────────────────────────────────────────

interface CapturedPiecesProps {
  pieces: ChessPiece[];
  color: PieceColor;
}

const CapturedPieces: React.FC<CapturedPiecesProps> = ({ pieces, color }) => {
  if (pieces.length === 0) return null;

  return (
    <div className={`game-status__captured game-status__captured--${color}`}>
      <span className="game-status__captured-label">
        {color === "white" ? "White captured:" : "Black captured:"}
      </span>
      <span className="game-status__captured-pieces">
        {pieces.map((piece, index) => (
          <span
            key={index}
            className={`game-status__captured-piece game-status__captured-piece--${piece.color}`}
            title={`${piece.color} ${piece.type}`}
          >
            {PIECE_SYMBOLS[piece.color][piece.type]}
          </span>
        ))}
      </span>
    </div>
  );
};

// ─── Move History Display ─────────────────────────────────────────────────────

interface MoveHistoryProps {
  moves: string[];
}

const MoveHistory: React.FC<MoveHistoryProps> = ({ moves }) => {
  const pairs: [string, string?][] = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push([moves[i], moves[i + 1]]);
  }

  return (
    <div className="game-status__history">
      <h3 className="game-status__history-title">Move History</h3>
      <div className="game-status__history-list">
        {pairs.length === 0 ? (
          <p className="game-status__history-empty">No moves yet.</p>
        ) : (
          pairs.map(([white, black], index) => (
            <div key={index} className="game-status__history-row">
              <span className="game-status__history-number">{index + 1}.</span>
              <span className="game-status__history-white">{white}</span>
              <span className="game-status__history-black">{black ?? ""}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const GameStatus: React.FC = () => {
  const {
    currentTurn,
    isCheck,
    isCheckmate,
    isStalemate,
    isGameOver,
    winner,
    capturedPieces,
    moveHistory,
    getStatusMessage,
  } = useGameLogic();

  const getStatusClass = (): string => {
    const classes = ["game-status__message"];
    if (isCheckmate || isGameOver) classes.push("game-status__message--gameover");
    else if (isStalemate) classes.push("game-status__message--stalemate");
    else if (isCheck) classes.push("game-status__message--check");
    else classes.push(`game-status__message--${currentTurn}`);
    return classes.join(" ");
  };

  return (
    <aside className="game-status">
      {/* Status Message */}
      <div className={getStatusClass()}>
        {getStatusMessage()}
      </div>

      {/* Captured Pieces */}
      <div className="game-status__captured-wrapper">
        <CapturedPieces pieces={capturedPieces.black} color="white" />
        <CapturedPieces pieces={capturedPieces.white} color="black" />
      </div>

      {/* Move History */}
      <MoveHistory moves={moveHistory} />
    </aside>
  );
};

export default GameStatus;