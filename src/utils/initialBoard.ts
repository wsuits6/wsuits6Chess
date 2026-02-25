import { BoardState, ChessPiece, PieceColor, PieceType } from "./chessLogic";

// ─── Helper ───────────────────────────────────────────────────────────────────

const piece = (type: PieceType, color: PieceColor): ChessPiece => ({
  type,
  color,
  hasMoved: false,
});

// ─── Initial Board Setup ──────────────────────────────────────────────────────

export const createInitialBoard = (): BoardState => {
  const board: BoardState = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  // Black back rank
  board[0][0] = piece("rook",   "black");
  board[0][1] = piece("knight", "black");
  board[0][2] = piece("bishop", "black");
  board[0][3] = piece("queen",  "black");
  board[0][4] = piece("king",   "black");
  board[0][5] = piece("bishop", "black");
  board[0][6] = piece("knight", "black");
  board[0][7] = piece("rook",   "black");

  // Black pawns
  for (let c = 0; c < 8; c++) {
    board[1][c] = piece("pawn", "black");
  }

  // White pawns
  for (let c = 0; c < 8; c++) {
    board[6][c] = piece("pawn", "white");
  }

  // White back rank
  board[7][0] = piece("rook",   "white");
  board[7][1] = piece("knight", "white");
  board[7][2] = piece("bishop", "white");
  board[7][3] = piece("queen",  "white");
  board[7][4] = piece("king",   "white");
  board[7][5] = piece("bishop", "white");
  board[7][6] = piece("knight", "white");
  board[7][7] = piece("rook",   "white");

  return board;
};