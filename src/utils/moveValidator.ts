import {
  BoardState,
  ChessPiece,
  PieceColor,
  Position,
  getLegalMoves,
  applyMove,
  getGameStatus,
  positionsEqual,
} from "./chessLogic";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

export interface MoveContext {
  board: BoardState;
  from: Position;
  to: Position;
  currentTurn: PieceColor;
  enPassantTarget: Position | null;
}

// ─── Validate a Move ──────────────────────────────────────────────────────────

export const validateMove = (ctx: MoveContext): ValidationResult => {
  const { board, from, to, currentTurn, enPassantTarget } = ctx;

  const piece = board[from.row][from.col];

  // No piece at source
  if (!piece) {
    return { isValid: false, reason: "No piece at source square." };
  }

  // Wrong turn
  if (piece.color !== currentTurn) {
    return { isValid: false, reason: "It is not your turn." };
  }

  // Get legal moves for this piece
  const legal = getLegalMoves(board, from, enPassantTarget);

  // Check if destination is in legal moves
  const isLegal = legal.some((m) => positionsEqual(m, to));

  if (!isLegal) {
    return { isValid: false, reason: "That move is not legal." };
  }

  return { isValid: true };
};

// ─── Compute En Passant Target After a Move ───────────────────────────────────

export const computeEnPassantTarget = (
  board: BoardState,
  from: Position,
  to: Position
): Position | null => {
  const piece = board[from.row][from.col];
  if (!piece || piece.type !== "pawn") return null;

  const rowDiff = Math.abs(to.row - from.row);
  if (rowDiff !== 2) return null;

  // The en passant target is the square the pawn skipped over
  const targetRow = (from.row + to.row) / 2;
  return { row: targetRow, col: from.col };
};

// ─── Determine if a Move is a Promotion ──────────────────────────────────────

export const isMovePromotion = (
  board: BoardState,
  from: Position,
  to: Position
): boolean => {
  const piece = board[from.row][from.col];
  if (!piece || piece.type !== "pawn") return false;
  return to.row === 0 || to.row === 7;
};

// ─── Determine if a Move is Castling ─────────────────────────────────────────

export const isMovecastling = (
  board: BoardState,
  from: Position,
  to: Position
): boolean => {
  const piece = board[from.row][from.col];
  if (!piece || piece.type !== "king") return false;
  return Math.abs(to.col - from.col) === 2;
};

// ─── Get All Legal Moves for a Color ─────────────────────────────────────────

export const getAllLegalMoves = (
  board: BoardState,
  color: PieceColor,
  enPassantTarget: Position | null = null
): { from: Position; to: Position }[] => {
  const moves: { from: Position; to: Position }[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color) {
        const from: Position = { row: r, col: c };
        const legal = getLegalMoves(board, from, enPassantTarget);
        for (const to of legal) {
          moves.push({ from, to });
        }
      }
    }
  }

  return moves;
};

// ─── Evaluate Position After Move ────────────────────────────────────────────

export const evaluateAfterMove = (
  board: BoardState,
  from: Position,
  to: Position,
  enPassantTarget: Position | null = null
): {
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  newEnPassantTarget: Position | null;
} => {
  const { newBoard } = applyMove(board, from, to, enPassantTarget);
  const piece = board[from.row][from.col]!;
  const opponent: PieceColor = piece.color === "white" ? "black" : "white";

  const status = getGameStatus(newBoard, opponent, null);
  const newEnPassantTarget = computeEnPassantTarget(board, from, to);

  return {
    ...status,
    newEnPassantTarget,
  };
};