import { useCallback } from "react";
import { useGameContext } from "../context/GameContext";
import {
  BoardState,
  ChessPiece,
  PieceColor,
  PieceType,
  Position,
  getLegalMoves,
  isInCheck,
} from "../utils/chessLogic";
import {
  getAllLegalMoves,
  isMovePromotion,
  isMovecastling,
} from "../utils/moveValidator";

// ─── Piece Values for Simple Evaluation ──────────────────────────────────────

const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useGameLogic = () => {
  const {
    boardState,
    currentTurn,
    selectedSquare,
    validMoves,
    isCheck,
    isCheckmate,
    isStalemate,
    enPassantTarget,
    capturedPieces,
    promotionPending,
    moveHistory,
    isGameOver,
    winner,
    selectSquare,
    promotePawn,
    resetGame,
    handleTimeout,
  } = useGameContext();

  // ── Check if a position is currently selected ────────────────────────────────

  const isSelected = useCallback(
    (pos: Position): boolean => {
      return (
        selectedSquare !== null &&
        selectedSquare.row === pos.row &&
        selectedSquare.col === pos.col
      );
    },
    [selectedSquare]
  );

  // ── Check if a position is a valid move destination ──────────────────────────

  const isValidDestination = useCallback(
    (pos: Position): boolean => {
      return validMoves.some((m) => m.row === pos.row && m.col === pos.col);
    },
    [validMoves]
  );

  // ── Check if a piece belongs to current player ───────────────────────────────

  const isCurrentPlayerPiece = useCallback(
    (piece: ChessPiece | null): boolean => {
      return piece !== null && piece.color === currentTurn;
    },
    [currentTurn]
  );

  // ── Get legal moves for any position ─────────────────────────────────────────

  const getMovesForPosition = useCallback(
    (pos: Position): Position[] => {
      return getLegalMoves(boardState, pos, enPassantTarget);
    },
    [boardState, enPassantTarget]
  );

  // ── Calculate material advantage ─────────────────────────────────────────────

  const getMaterialAdvantage = useCallback((): {
    white: number;
    black: number;
    advantage: PieceColor | "equal";
    diff: number;
  } => {
    let whiteScore = 0;
    let blackScore = 0;

    for (const piece of capturedPieces.black) {
      whiteScore += PIECE_VALUES[piece.type];
    }
    for (const piece of capturedPieces.white) {
      blackScore += PIECE_VALUES[piece.type];
    }

    const diff = whiteScore - blackScore;
    const advantage: PieceColor | "equal" =
      diff > 0 ? "white" : diff < 0 ? "black" : "equal";

    return { white: whiteScore, black: blackScore, advantage, diff: Math.abs(diff) };
  }, [capturedPieces]);

  // ── Check if a specific king is in check ─────────────────────────────────────

  const isKingInCheck = useCallback(
    (color: PieceColor): boolean => {
      return isInCheck(boardState, color);
    },
    [boardState]
  );

  // ── Get all legal moves for current player ────────────────────────────────────

  const getAllMovesForCurrentPlayer = useCallback((): {
    from: Position;
    to: Position;
  }[] => {
    return getAllLegalMoves(boardState, currentTurn, enPassantTarget);
  }, [boardState, currentTurn, enPassantTarget]);

  // ── Check if move is a promotion ─────────────────────────────────────────────

  const checkIsPromotion = useCallback(
    (from: Position, to: Position): boolean => {
      return isMovePromotion(boardState, from, to);
    },
    [boardState]
  );

  // ── Check if move is castling ─────────────────────────────────────────────────

  const checkIsCastling = useCallback(
    (from: Position, to: Position): boolean => {
      return isMovecastling(boardState, from, to);
    },
    [boardState]
  );

  // ── Get game status message ───────────────────────────────────────────────────

  const getStatusMessage = useCallback((): string => {
    if (isCheckmate) {
      const loser = currentTurn;
      const winnerColor = loser === "white" ? "Black" : "White";
      return `Checkmate! ${winnerColor} wins!`;
    }
    if (isStalemate) return "Stalemate! It's a draw.";
    if (winner) {
      const winnerLabel = winner === "white" ? "White" : "Black";
      return `${winnerLabel} wins on time!`;
    }
    if (isGameOver) return "Game over!";
    if (isCheck) return `${currentTurn === "white" ? "White" : "Black"} is in check!`;
    return `${currentTurn === "white" ? "White" : "Black"}'s turn`;
  }, [isCheck, isCheckmate, isStalemate, isGameOver, winner, currentTurn]);

  // ── Count pieces on board ─────────────────────────────────────────────────────

  const getPieceCounts = useCallback((): Record<PieceColor, Record<PieceType, number>> => {
    const counts: Record<PieceColor, Record<PieceType, number>> = {
      white: { pawn: 0, knight: 0, bishop: 0, rook: 0, queen: 0, king: 0 },
      black: { pawn: 0, knight: 0, bishop: 0, rook: 0, queen: 0, king: 0 },
    };
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (piece) {
          counts[piece.color][piece.type]++;
        }
      }
    }
    return counts;
  }, [boardState]);

  // ─── Return ───────────────────────────────────────────────────────────────────

  return {
    // State
    boardState,
    currentTurn,
    selectedSquare,
    validMoves,
    isCheck,
    isCheckmate,
    isStalemate,
    enPassantTarget,
    capturedPieces,
    promotionPending,
    moveHistory,
    isGameOver,
    winner,

    // Actions
    selectSquare,
    promotePawn,
    resetGame,
    handleTimeout,

    // Computed
    isSelected,
    isValidDestination,
    isCurrentPlayerPiece,
    getMovesForPosition,
    getMaterialAdvantage,
    isKingInCheck,
    getAllMovesForCurrentPlayer,
    checkIsPromotion,
    checkIsCastling,
    getStatusMessage,
    getPieceCounts,
  };
};