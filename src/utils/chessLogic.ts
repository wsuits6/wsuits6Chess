// ─── Core Types ───────────────────────────────────────────────────────────────

export type PieceType = "king" | "queen" | "rook" | "bishop" | "knight" | "pawn";
export type PieceColor = "white" | "black";

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
  hasMoved?: boolean;
}

export interface Position {
  row: number;
  col: number;
}

export type BoardState = (ChessPiece | null)[][];

export interface MoveResult {
  newBoard: BoardState;
  capturedPiece: ChessPiece | null;
  isPromotion: boolean;
  isCastling: boolean;
  isEnPassant: boolean;
}

export interface GameState {
  board: BoardState;
  currentTurn: PieceColor;
  selectedSquare: Position | null;
  validMoves: Position[];
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  enPassantTarget: Position | null;
  capturedPieces: {
    white: ChessPiece[];
    black: ChessPiece[];
  };
}

// ─── Board Helpers ─────────────────────────────────────────────────────────────

export const isInBounds = (row: number, col: number): boolean =>
  row >= 0 && row <= 7 && col >= 0 && col <= 7;

export const cloneBoard = (board: BoardState): BoardState =>
  board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));

export const positionsEqual = (a: Position, b: Position): boolean =>
  a.row === b.row && a.col === b.col;

// ─── Raw Move Generation (ignores check) ──────────────────────────────────────

const getPawnMoves = (
  board: BoardState,
  pos: Position,
  color: PieceColor,
  enPassantTarget: Position | null
): Position[] => {
  const moves: Position[] = [];
  const dir = color === "white" ? -1 : 1;
  const startRow = color === "white" ? 6 : 1;
  const { row, col } = pos;

  // One step forward
  if (isInBounds(row + dir, col) && !board[row + dir][col]) {
    moves.push({ row: row + dir, col });
    // Two steps forward from start
    if (row === startRow && !board[row + 2 * dir][col]) {
      moves.push({ row: row + 2 * dir, col });
    }
  }

  // Diagonal captures
  for (const dc of [-1, 1]) {
    const nr = row + dir;
    const nc = col + dc;
    if (isInBounds(nr, nc)) {
      const target = board[nr][nc];
      if (target && target.color !== color) {
        moves.push({ row: nr, col: nc });
      }
      // En passant
      if (enPassantTarget && enPassantTarget.row === nr && enPassantTarget.col === nc) {
        moves.push({ row: nr, col: nc });
      }
    }
  }

  return moves;
};

const getRookMoves = (board: BoardState, pos: Position, color: PieceColor): Position[] => {
  const moves: Position[] = [];
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of directions) {
    let r = pos.row + dr;
    let c = pos.col + dc;
    while (isInBounds(r, c)) {
      const target = board[r][c];
      if (!target) {
        moves.push({ row: r, col: c });
      } else {
        if (target.color !== color) moves.push({ row: r, col: c });
        break;
      }
      r += dr;
      c += dc;
    }
  }
  return moves;
};

const getBishopMoves = (board: BoardState, pos: Position, color: PieceColor): Position[] => {
  const moves: Position[] = [];
  const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  for (const [dr, dc] of directions) {
    let r = pos.row + dr;
    let c = pos.col + dc;
    while (isInBounds(r, c)) {
      const target = board[r][c];
      if (!target) {
        moves.push({ row: r, col: c });
      } else {
        if (target.color !== color) moves.push({ row: r, col: c });
        break;
      }
      r += dr;
      c += dc;
    }
  }
  return moves;
};

const getKnightMoves = (board: BoardState, pos: Position, color: PieceColor): Position[] => {
  const moves: Position[] = [];
  const offsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  for (const [dr, dc] of offsets) {
    const r = pos.row + dr;
    const c = pos.col + dc;
    if (isInBounds(r, c)) {
      const target = board[r][c];
      if (!target || target.color !== color) moves.push({ row: r, col: c });
    }
  }
  return moves;
};

const getQueenMoves = (board: BoardState, pos: Position, color: PieceColor): Position[] => [
  ...getRookMoves(board, pos, color),
  ...getBishopMoves(board, pos, color),
];

const getKingMovesRaw = (board: BoardState, pos: Position, color: PieceColor): Position[] => {
  const moves: Position[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = pos.row + dr;
      const c = pos.col + dc;
      if (isInBounds(r, c)) {
        const target = board[r][c];
        if (!target || target.color !== color) moves.push({ row: r, col: c });
      }
    }
  }
  return moves;
};

export const getRawMoves = (
  board: BoardState,
  pos: Position,
  enPassantTarget: Position | null = null
): Position[] => {
  const piece = board[pos.row][pos.col];
  if (!piece) return [];
  switch (piece.type) {
    case "pawn":   return getPawnMoves(board, pos, piece.color, enPassantTarget);
    case "rook":   return getRookMoves(board, pos, piece.color);
    case "bishop": return getBishopMoves(board, pos, piece.color);
    case "knight": return getKnightMoves(board, pos, piece.color);
    case "queen":  return getQueenMoves(board, pos, piece.color);
    case "king":   return getKingMovesRaw(board, pos, piece.color);
    default:       return [];
  }
};

// ─── Check Detection ───────────────────────────────────────────────────────────

export const findKing = (board: BoardState, color: PieceColor): Position | null => {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.type === "king" && piece.color === color) {
        return { row: r, col: c };
      }
    }
  }
  return null;
};

export const isSquareAttacked = (
  board: BoardState,
  pos: Position,
  byColor: PieceColor
): boolean => {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === byColor) {
        const moves = getRawMoves(board, { row: r, col: c }, null);
        if (moves.some((m) => positionsEqual(m, pos))) return true;
      }
    }
  }
  return false;
};

export const isInCheck = (board: BoardState, color: PieceColor): boolean => {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  const opponent: PieceColor = color === "white" ? "black" : "white";
  return isSquareAttacked(board, kingPos, opponent);
};

// ─── Castling ─────────────────────────────────────────────────────────────────

const getCastlingMoves = (
  board: BoardState,
  pos: Position,
  color: PieceColor
): Position[] => {
  const moves: Position[] = [];
  const king = board[pos.row][pos.col];
  if (!king || king.hasMoved) return moves;

  const opponent: PieceColor = color === "white" ? "black" : "white";
  const row = color === "white" ? 7 : 0;

  if (pos.row !== row || pos.col !== 4) return moves;

  // Kingside
  const kRook = board[row][7];
  if (
    kRook && kRook.type === "rook" && !kRook.hasMoved &&
    !board[row][5] && !board[row][6] &&
    !isSquareAttacked(board, { row, col: 4 }, opponent) &&
    !isSquareAttacked(board, { row, col: 5 }, opponent) &&
    !isSquareAttacked(board, { row, col: 6 }, opponent)
  ) {
    moves.push({ row, col: 6 });
  }

  // Queenside
  const qRook = board[row][0];
  if (
    qRook && qRook.type === "rook" && !qRook.hasMoved &&
    !board[row][1] && !board[row][2] && !board[row][3] &&
    !isSquareAttacked(board, { row, col: 4 }, opponent) &&
    !isSquareAttacked(board, { row, col: 3 }, opponent) &&
    !isSquareAttacked(board, { row, col: 2 }, opponent)
  ) {
    moves.push({ row, col: 2 });
  }

  return moves;
};

// ─── Legal Move Generation ─────────────────────────────────────────────────────

export const getLegalMoves = (
  board: BoardState,
  pos: Position,
  enPassantTarget: Position | null = null
): Position[] => {
  const piece = board[pos.row][pos.col];
  if (!piece) return [];

  let candidates = getRawMoves(board, pos, enPassantTarget);

  // Add castling for king
  if (piece.type === "king") {
    candidates = [...candidates, ...getCastlingMoves(board, pos, piece.color)];
  }

  // Filter moves that leave king in check
  return candidates.filter((to) => {
    const newBoard = cloneBoard(board);
    newBoard[to.row][to.col] = { ...piece, hasMoved: true };
    newBoard[pos.row][pos.col] = null;

    // Handle en passant capture removal
    if (
      piece.type === "pawn" &&
      enPassantTarget &&
      positionsEqual(to, enPassantTarget)
    ) {
      const captureRow = pos.row;
      newBoard[captureRow][to.col] = null;
    }

    return !isInCheck(newBoard, piece.color);
  });
};

// ─── Apply Move ────────────────────────────────────────────────────────────────

export const applyMove = (
  board: BoardState,
  from: Position,
  to: Position,
  enPassantTarget: Position | null = null
): MoveResult => {
  const newBoard = cloneBoard(board);
  const piece = newBoard[from.row][from.col]!;
  let capturedPiece: ChessPiece | null = newBoard[to.row][to.col];
  let isEnPassant = false;
  let isCastling = false;

  // En passant
  if (
    piece.type === "pawn" &&
    enPassantTarget &&
    positionsEqual(to, enPassantTarget)
  ) {
    capturedPiece = newBoard[from.row][to.col];
    newBoard[from.row][to.col] = null;
    isEnPassant = true;
  }

  // Castling
  if (piece.type === "king") {
    const colDiff = to.col - from.col;
    if (Math.abs(colDiff) === 2) {
      isCastling = true;
      const rookFromCol = colDiff > 0 ? 7 : 0;
      const rookToCol = colDiff > 0 ? 5 : 3;
      const rook = newBoard[from.row][rookFromCol]!;
      newBoard[from.row][rookToCol] = { ...rook, hasMoved: true };
      newBoard[from.row][rookFromCol] = null;
    }
  }

  newBoard[to.row][to.col] = { ...piece, hasMoved: true };
  newBoard[from.row][from.col] = null;

  const isPromotion =
    piece.type === "pawn" && (to.row === 0 || to.row === 7);

  return { newBoard, capturedPiece, isPromotion, isCastling, isEnPassant };
};

// ─── Game Status ───────────────────────────────────────────────────────────────

export const hasAnyLegalMoves = (
  board: BoardState,
  color: PieceColor,
  enPassantTarget: Position | null = null
): boolean => {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color) {
        const moves = getLegalMoves(board, { row: r, col: c }, enPassantTarget);
        if (moves.length > 0) return true;
      }
    }
  }
  return false;
};

export const getGameStatus = (
  board: BoardState,
  currentTurn: PieceColor,
  enPassantTarget: Position | null = null
): { isCheck: boolean; isCheckmate: boolean; isStalemate: boolean } => {
  const inCheck = isInCheck(board, currentTurn);
  const hasLegal = hasAnyLegalMoves(board, currentTurn, enPassantTarget);

  return {
    isCheck: inCheck,
    isCheckmate: inCheck && !hasLegal,
    isStalemate: !inCheck && !hasLegal,
  };
};