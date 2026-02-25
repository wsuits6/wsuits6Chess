import { useCallback } from "react";
import { useGameContext } from "../context/GameContext";
import type {
  Position,
  PieceColor,
  PieceType,
  BoardState,
  ChessPiece,
} from "../utils/chessLogic";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GameLogic {
  // Board interaction
  handleSquareClick: (position: Position) => void;
  handlePromotion: (pieceType: PieceType) => void;
  handleReset: () => void;
  handleTimeout: (color: PieceColor) => void;

  // Derived state
  boardState: BoardState;
  currentTurn: PieceColor;
  selectedSquare: Position | null;
  validMoves: Position[];
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isGameOver: boolean;
  winner: PieceColor | null;
  capturedPieces: { white: ChessPiece[]; black: ChessPiece[] };
  promotionPending: { position: Position; color: PieceColor } | null;
  moveHistory: string[];
  whiteTime: number;
  blackTime: number;

  // Helpers
  isSquareSelected: (position: Position) => boolean;
  isSquareValidMove: (position: Position) => boolean;
  isSquareInCheck: (position: Position) => boolean;
  getStatusMessage: () => string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useGameLogic = (): GameLogic => {
  const {
    boardState,
    currentTurn,
    selectedSquare,
    validMoves,
    isCheck,
    isCheckmate,
    isStalemate,
    isGameOver,
    winner,
    capturedPieces,
    promotionPending,
    moveHistory,
    whiteTime,
    blackTime,
    selectSquare,
    promotePawn,
    resetGame,
    handleTimeout,
  } = useGameContext();

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSquareClick = useCallback(
    (position: Position) => {
      selectSquare(position);
    },
    [selectSquare]
  );

  const handlePromotion = useCallback(
    (pieceType: PieceType) => {
      promotePawn(pieceType);
    },
    [promotePawn]
  );

  const handleReset = useCallback(() => {
    resetGame();
  }, [resetGame]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const isSquareSelected = useCallback(
    (position: Position): boolean => {
      return (
        selectedSquare !== null &&
        selectedSquare.row === position.row &&
        selectedSquare.col === position.col
      );
    },
    [selectedSquare]
  );

  const isSquareValidMove = useCallback(
    (position: Position): boolean => {
      return validMoves.some(
        (m) => m.row === position.row && m.col === position.col
      );
    },
    [validMoves]
  );

  const isSquareInCheck = useCallback(
    (position: Position): boolean => {
      if (!isCheck) return false;
      const piece = boardState[position.row][position.col];
      return (
        piece !== null &&
        piece.type === "king" &&
        piece.color === currentTurn
      );
    },
    [isCheck, boardState, currentTurn]
  );

  const getStatusMessage = useCallback((): string => {
    if (isCheckmate) {
      const winnerName = winner === "white" ? "White" : "Black";
      return `Checkmate! ${winnerName} wins!`;
    }
    if (isStalemate) {
      return "Stalemate! It's a draw.";
    }
    if (isGameOver && winner) {
      const winnerName = winner === "white" ? "White" : "Black";
      return `${winnerName} wins on time!`;
    }
    if (isCheck) {
      const turnName = currentTurn === "white" ? "White" : "Black";
      return `${turnName} is in check!`;
    }
    const turnName = currentTurn === "white" ? "White" : "Black";
    return `${turnName}'s turn`;
  }, [isCheckmate, isStalemate, isGameOver, isCheck, currentTurn, winner]);

  // ─── Return ───────────────────────────────────────────────────────────────────

  return {
    handleSquareClick,
    handlePromotion,
    handleReset,
    handleTimeout,
    boardState,
    currentTurn,
    selectedSquare,
    validMoves,
    isCheck,
    isCheckmate,
    isStalemate,
    isGameOver,
    winner,
    capturedPieces,
    promotionPending,
    moveHistory,
    whiteTime,
    blackTime,
    isSquareSelected,
    isSquareValidMove,
    isSquareInCheck,
    getStatusMessage,
  };
};
