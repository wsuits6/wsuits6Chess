import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { applyMove, getGameStatus, getLegalMoves, positionsEqual } from "../utils/chessLogic";
import type {
  BoardState,
  ChessPiece,
  PieceColor,
  PieceType,
  Position,
} from "../utils/chessLogic";
import {
  computeEnPassantTarget,
  validateMove,
} from "../utils/moveValidator";

// ─── Types ────────────────────────────────────────────────────────────────────

type CapturedPieces = {
  white: ChessPiece[];
  black: ChessPiece[];
};

type PromotionPending = {
  position: Position;
  color: PieceColor;
  from: Position;
  to: Position;
  capturedPiece: ChessPiece | null;
};

export interface GameContextValue {
  boardState: BoardState;
  currentTurn: PieceColor;
  selectedSquare: Position | null;
  validMoves: Position[];
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  enPassantTarget: Position | null;
  capturedPieces: CapturedPieces;
  promotionPending: PromotionPending | null;
  moveHistory: string[];
  isGameOver: boolean;
  winner: PieceColor | null;
  whiteTime: number;
  blackTime: number;
  selectSquare: (pos: Position) => void;
  promotePawn: (pieceType: PieceType) => void;
  resetGame: () => void;
  handleTimeout: (color: PieceColor) => void;
  setWhiteTime: React.Dispatch<React.SetStateAction<number>>;
  setBlackTime: React.Dispatch<React.SetStateAction<number>>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

const createInitialBoard = (): BoardState => {
  const emptyRow = () => Array.from({ length: 8 }, () => null as ChessPiece | null);
  const board: BoardState = Array.from({ length: 8 }, () => emptyRow());

  const backRow: PieceType[] = [
    "rook",
    "knight",
    "bishop",
    "queen",
    "king",
    "bishop",
    "knight",
    "rook",
  ];

  // Black pieces
  for (let c = 0; c < 8; c++) {
    board[0][c] = { type: backRow[c], color: "black", hasMoved: false };
    board[1][c] = { type: "pawn", color: "black", hasMoved: false };
  }

  // White pieces
  for (let c = 0; c < 8; c++) {
    board[6][c] = { type: "pawn", color: "white", hasMoved: false };
    board[7][c] = { type: backRow[c], color: "white", hasMoved: false };
  }

  return board;
};

const toAlgebraic = (pos: Position): string => `${FILES[pos.col]}${8 - pos.row}`;

const pieceLetter = (type: PieceType): string => {
  switch (type) {
    case "king":
      return "K";
    case "queen":
      return "Q";
    case "rook":
      return "R";
    case "bishop":
      return "B";
    case "knight":
      return "N";
    default:
      return "";
  }
};

const buildMoveNotation = (args: {
  piece: ChessPiece;
  from: Position;
  to: Position;
  captured: boolean;
  isCastling: boolean;
  promotion?: PieceType | null;
  isCheck: boolean;
  isCheckmate: boolean;
}): string => {
  const { piece, from, to, captured, isCastling, promotion, isCheck, isCheckmate } = args;

  if (isCastling) {
    const side = to.col === 6 ? "O-O" : "O-O-O";
    return `${side}${isCheckmate ? "#" : isCheck ? "+" : ""}`;
  }

  const fromAlg = toAlgebraic(from);
  const toAlg = toAlgebraic(to);
  const captureSymbol = captured ? "x" : "-";
  const promo = promotion ? `=${pieceLetter(promotion)}` : "";
  const suffix = isCheckmate ? "#" : isCheck ? "+" : "";

  return `${pieceLetter(piece.type)}${fromAlg}${captureSymbol}${toAlg}${promo}${suffix}`;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const GameContext = createContext<GameContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

const INITIAL_TIME_SECONDS = 300;

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [boardState, setBoardState] = useState<BoardState>(() => createInitialBoard());
  const [currentTurn, setCurrentTurn] = useState<PieceColor>("white");
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [isCheck, setIsCheck] = useState<boolean>(false);
  const [isCheckmate, setIsCheckmate] = useState<boolean>(false);
  const [isStalemate, setIsStalemate] = useState<boolean>(false);
  const [enPassantTarget, setEnPassantTarget] = useState<Position | null>(null);
  const [capturedPieces, setCapturedPieces] = useState<CapturedPieces>({
    white: [],
    black: [],
  });
  const [promotionPending, setPromotionPending] = useState<PromotionPending | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [winner, setWinner] = useState<PieceColor | null>(null);
  const [whiteTime, setWhiteTime] = useState<number>(INITIAL_TIME_SECONDS);
  const [blackTime, setBlackTime] = useState<number>(INITIAL_TIME_SECONDS);

  const resetGame = useCallback(() => {
    setBoardState(createInitialBoard());
    setCurrentTurn("white");
    setSelectedSquare(null);
    setValidMoves([]);
    setIsCheck(false);
    setIsCheckmate(false);
    setIsStalemate(false);
    setEnPassantTarget(null);
    setCapturedPieces({ white: [], black: [] });
    setPromotionPending(null);
    setMoveHistory([]);
    setIsGameOver(false);
    setWinner(null);
    setWhiteTime(INITIAL_TIME_SECONDS);
    setBlackTime(INITIAL_TIME_SECONDS);
  }, []);

  const handleTimeout = useCallback((color: PieceColor) => {
    const winnerColor: PieceColor = color === "white" ? "black" : "white";
    setIsGameOver(true);
    setWinner(winnerColor);
    setIsCheck(false);
    setIsCheckmate(false);
    setIsStalemate(false);
  }, []);

  const updateGameStatus = useCallback(
    (board: BoardState, nextTurn: PieceColor, enPassant: Position | null) => {
      const status = getGameStatus(board, nextTurn, enPassant);
      setIsCheck(status.isCheck);
      setIsCheckmate(status.isCheckmate);
      setIsStalemate(status.isStalemate);
      if (status.isCheckmate) {
        setWinner(nextTurn === "white" ? "black" : "white");
        setIsGameOver(true);
      } else if (status.isStalemate) {
        setWinner(null);
        setIsGameOver(true);
      } else {
        setWinner(null);
        setIsGameOver(false);
      }
      return status;
    },
    []
  );

  const selectSquare = useCallback(
    (pos: Position) => {
      if (promotionPending || isGameOver || isCheckmate || isStalemate) return;

      const piece = boardState[pos.row][pos.col];

      if (!selectedSquare) {
        if (piece && piece.color === currentTurn) {
          setSelectedSquare(pos);
          setValidMoves(getLegalMoves(boardState, pos, enPassantTarget));
        }
        return;
      }

      // Deselect if clicking same square
      if (positionsEqual(selectedSquare, pos)) {
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }

      // Switch selection to another own piece
      if (piece && piece.color === currentTurn) {
        setSelectedSquare(pos);
        setValidMoves(getLegalMoves(boardState, pos, enPassantTarget));
        return;
      }

      const validation = validateMove({
        board: boardState,
        from: selectedSquare,
        to: pos,
        currentTurn,
        enPassantTarget,
      });

      if (!validation.isValid) {
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }

      const { newBoard, capturedPiece, isPromotion, isCastling } = applyMove(
        boardState,
        selectedSquare,
        pos,
        enPassantTarget
      );

      const nextEnPassant = computeEnPassantTarget(boardState, selectedSquare, pos);
      const nextTurn: PieceColor = currentTurn === "white" ? "black" : "white";

      if (capturedPiece) {
        setCapturedPieces((prev) => ({
          ...prev,
          [capturedPiece.color]: [...prev[capturedPiece.color], capturedPiece],
        }));
      }

      setBoardState(newBoard);
      setEnPassantTarget(nextEnPassant);
      setSelectedSquare(null);
      setValidMoves([]);

      if (isPromotion) {
        setPromotionPending({
          position: pos,
          color: currentTurn,
          from: selectedSquare,
          to: pos,
          capturedPiece,
        });
        setIsCheck(false);
        setIsCheckmate(false);
        setIsStalemate(false);
        setIsGameOver(false);
        setWinner(null);
        return;
      }

      const status = updateGameStatus(newBoard, nextTurn, nextEnPassant);

      const pieceMoved = boardState[selectedSquare.row][selectedSquare.col]!;
      const moveNotation = buildMoveNotation({
        piece: pieceMoved,
        from: selectedSquare,
        to: pos,
        captured: Boolean(capturedPiece),
        isCastling,
        promotion: null,
        isCheck: status.isCheck,
        isCheckmate: status.isCheckmate,
      });

      setMoveHistory((prev) => [...prev, moveNotation]);
      setCurrentTurn(nextTurn);
    },
    [
      promotionPending,
      isGameOver,
      isCheckmate,
      isStalemate,
      boardState,
      selectedSquare,
      currentTurn,
      enPassantTarget,
      updateGameStatus,
    ]
  );

  const promotePawn = useCallback(
    (pieceType: PieceType) => {
      if (!promotionPending) return;

      const { position, from, to, capturedPiece } = promotionPending;
      const newBoard = boardState.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
      const pawn = newBoard[position.row][position.col];

      if (!pawn) {
        setPromotionPending(null);
        return;
      }

      newBoard[position.row][position.col] = {
        type: pieceType,
        color: pawn.color,
        hasMoved: true,
      };

      const nextTurn: PieceColor = currentTurn === "white" ? "black" : "white";
      const status = updateGameStatus(newBoard, nextTurn, enPassantTarget);

      const moveNotation = buildMoveNotation({
        piece: pawn,
        from,
        to,
        captured: Boolean(capturedPiece),
        isCastling: false,
        promotion: pieceType,
        isCheck: status.isCheck,
        isCheckmate: status.isCheckmate,
      });

      setBoardState(newBoard);
      setPromotionPending(null);
      setMoveHistory((prev) => [...prev, moveNotation]);
      setCurrentTurn(nextTurn);
    },
    [promotionPending, boardState, currentTurn, enPassantTarget, updateGameStatus]
  );

  const value = useMemo<GameContextValue>(
    () => ({
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
      whiteTime,
      blackTime,
      selectSquare,
      promotePawn,
      resetGame,
      handleTimeout,
      setWhiteTime,
      setBlackTime,
    }),
    [
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
      whiteTime,
      blackTime,
      selectSquare,
      promotePawn,
      resetGame,
      handleTimeout,
      setWhiteTime,
      setBlackTime,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useGameContext = (): GameContextValue => {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return ctx;
};
