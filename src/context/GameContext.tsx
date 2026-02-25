import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  BoardState,
  ChessPiece,
  PieceColor,
  PieceType,
  Position,
  GameState,
  getLegalMoves,
  applyMove,
  getGameStatus,
  cloneBoard,
} from "../utils/chessLogic";
import { createInitialBoard } from "../utils/initialBoard";
import {
  validateMove,
  computeEnPassantTarget,
} from "../utils/moveValidator";

// ─── Context Shape ────────────────────────────────────────────────────────────

interface GameContextType {
  // State
  boardState: BoardState;
  currentTurn: PieceColor;
  selectedSquare: Position | null;
  validMoves: Position[];
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  enPassantTarget: Position | null;
  capturedPieces: { white: ChessPiece[]; black: ChessPiece[] };
  promotionPending: { position: Position; color: PieceColor } | null;
  moveHistory: string[];
  whiteTime: number;
  blackTime: number;
  isGameOver: boolean;
  winner: PieceColor | null;

  // Actions
  selectSquare: (position: Position) => void;
  promotePawn: (pieceType: PieceType) => void;
  resetGame: () => void;
  setWhiteTime: React.Dispatch<React.SetStateAction<number>>;
  setBlackTime: React.Dispatch<React.SetStateAction<number>>;
  handleTimeout: (color: PieceColor) => void;
}

// ─── Create Context ───────────────────────────────────────────────────────────

const GameContext = createContext<GameContextType | undefined>(undefined);

// ─── Initial State ────────────────────────────────────────────────────────────

const createInitialGameState = (): GameState => ({
  board: createInitialBoard(),
  currentTurn: "white",
  selectedSquare: null,
  validMoves: [],
  isCheck: false,
  isCheckmate: false,
  isStalemate: false,
  enPassantTarget: null,
  capturedPieces: { white: [], black: [] },
});

// ─── Move Notation Helper ─────────────────────────────────────────────────────

const toAlgebraic = (pos: Position): string => {
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  return `${files[pos.col]}${8 - pos.row}`;
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const [promotionPending, setPromotionPending] = useState<{
    position: Position;
    color: PieceColor;
    from: Position;
  } | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [whiteTime, setWhiteTime] = useState<number>(600);
  const [blackTime, setBlackTime] = useState<number>(600);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [winner, setWinner] = useState<PieceColor | null>(null);

  // ── Select a Square ──────────────────────────────────────────────────────────

  const selectSquare = useCallback(
    (position: Position) => {
      if (isGameOver) return;

      const { board, currentTurn, selectedSquare, validMoves, enPassantTarget } =
        gameState;

      const clickedPiece = board[position.row][position.col];

      // If a square is already selected
      if (selectedSquare) {
        const isValidDest = validMoves.some(
          (m) => m.row === position.row && m.col === position.col
        );

        // Attempt move
        if (isValidDest) {
          const validation = validateMove({
            board,
            from: selectedSquare,
            to: position,
            currentTurn,
            enPassantTarget,
          });

          if (!validation.isValid) {
            setGameState((prev) => ({
              ...prev,
              selectedSquare: null,
              validMoves: [],
            }));
            return;
          }

          const { newBoard, capturedPiece, isPromotion } = applyMove(
            board,
            selectedSquare,
            position,
            enPassantTarget
          );

          // Update captured pieces
          const newCaptured = {
            white: [...gameState.capturedPieces.white],
            black: [...gameState.capturedPieces.black],
          };
          if (capturedPiece) {
            if (capturedPiece.color === "white") {
              newCaptured.white.push(capturedPiece);
            } else {
              newCaptured.black.push(capturedPiece);
            }
          }

          // Move history notation
          const notation = `${toAlgebraic(selectedSquare)}-${toAlgebraic(position)}`;
          setMoveHistory((prev) => [...prev, notation]);

          // Handle promotion
          if (isPromotion) {
            setPromotionPending({
              position,
              color: currentTurn,
              from: selectedSquare,
            });
            setGameState((prev) => ({
              ...prev,
              board: newBoard,
              selectedSquare: null,
              validMoves: [],
              capturedPieces: newCaptured,
            }));
            return;
          }

          // Compute new en passant target
          const newEnPassant = computeEnPassantTarget(board, selectedSquare, position);
          const opponent: PieceColor = currentTurn === "white" ? "black" : "white";
          const status = getGameStatus(newBoard, opponent, newEnPassant);

          if (status.isCheckmate) {
            setIsGameOver(true);
            setWinner(currentTurn);
          } else if (status.isStalemate) {
            setIsGameOver(true);
            setWinner(null);
          }

          setGameState({
            board: newBoard,
            currentTurn: opponent,
            selectedSquare: null,
            validMoves: [],
            isCheck: status.isCheck,
            isCheckmate: status.isCheckmate,
            isStalemate: status.isStalemate,
            enPassantTarget: newEnPassant,
            capturedPieces: newCaptured,
          });

          return;
        }

        // Clicked own piece — re-select
        if (clickedPiece && clickedPiece.color === currentTurn) {
          const moves = getLegalMoves(board, position, enPassantTarget);
          setGameState((prev) => ({
            ...prev,
            selectedSquare: position,
            validMoves: moves,
          }));
          return;
        }

        // Clicked empty or enemy (not valid move) — deselect
        setGameState((prev) => ({
          ...prev,
          selectedSquare: null,
          validMoves: [],
        }));
        return;
      }

      // No square selected yet — select own piece
      if (clickedPiece && clickedPiece.color === currentTurn) {
        const moves = getLegalMoves(board, position, enPassantTarget);
        setGameState((prev) => ({
          ...prev,
          selectedSquare: position,
          validMoves: moves,
        }));
      }
    },
    [gameState, isGameOver]
  );

  // ── Promote Pawn ─────────────────────────────────────────────────────────────

  const promotePawn = useCallback(
    (pieceType: PieceType) => {
      if (!promotionPending) return;

      const { position, color } = promotionPending;
      const newBoard = cloneBoard(gameState.board);
      newBoard[position.row][position.col] = {
        type: pieceType,
        color,
        hasMoved: true,
      };

      const opponent: PieceColor = color === "white" ? "black" : "white";
      const status = getGameStatus(newBoard, opponent, null);

      if (status.isCheckmate) {
        setIsGameOver(true);
        setWinner(color);
      } else if (status.isStalemate) {
        setIsGameOver(true);
        setWinner(null);
      }

      setGameState((prev) => ({
        ...prev,
        board: newBoard,
        currentTurn: opponent,
        isCheck: status.isCheck,
        isCheckmate: status.isCheckmate,
        isStalemate: status.isStalemate,
        enPassantTarget: null,
      }));

      setPromotionPending(null);
    },
    [promotionPending, gameState.board]
  );

  // ── Reset Game ───────────────────────────────────────────────────────────────

  const resetGame = useCallback(() => {
    setGameState(createInitialGameState());
    setPromotionPending(null);
    setMoveHistory([]);
    setWhiteTime(600);
    setBlackTime(600);
    setIsGameOver(false);
    setWinner(null);
  }, []);

  // ── Handle Timeout ───────────────────────────────────────────────────────────

  const handleTimeout = useCallback((color: PieceColor) => {
    setIsGameOver(true);
    setWinner(color === "white" ? "black" : "white");
  }, []);

  // ─── Context Value ────────────────────────────────────────────────────────────

  const value: GameContextType = {
    boardState: gameState.board,
    currentTurn: gameState.currentTurn,
    selectedSquare: gameState.selectedSquare,
    validMoves: gameState.validMoves,
    isCheck: gameState.isCheck,
    isCheckmate: gameState.isCheckmate,
    isStalemate: gameState.isStalemate,
    enPassantTarget: gameState.enPassantTarget,
    capturedPieces: gameState.capturedPieces,
    promotionPending: promotionPending
      ? { position: promotionPending.position, color: promotionPending.color }
      : null,
    moveHistory,
    whiteTime,
    blackTime,
    isGameOver,
    winner,
    selectSquare,
    promotePawn,
    resetGame,
    setWhiteTime,
    setBlackTime,
    handleTimeout,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useGameContext = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
};