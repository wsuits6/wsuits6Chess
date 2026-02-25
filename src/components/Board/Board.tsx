import React from "react";
import "./Board.css";
import Square from "./Square";
import { useGameContext } from "../../context/GameContext";
import { BoardState, Position } from "../../utils/chessLogic";

const Board: React.FC = () => {
  const { boardState, selectedSquare, selectSquare, validMoves } = useGameContext();

  const handleSquareClick = (position: Position) => {
    selectSquare(position);
  };

  const isSelected = (row: number, col: number): boolean => {
    return selectedSquare?.row === row && selectedSquare?.col === col;
  };

  const isValidMove = (row: number, col: number): boolean => {
    return validMoves.some((move) => move.row === row && move.col === col);
  };

  const isLightSquare = (row: number, col: number): boolean => {
    return (row + col) % 2 === 0;
  };

  return (
    <div className="board">
      {boardState.map((row, rowIndex) =>
        row.map((piece, colIndex) => (
          <Square
            key={`${rowIndex}-${colIndex}`}
            position={{ row: rowIndex, col: colIndex }}
            piece={piece}
            isLight={isLightSquare(rowIndex, colIndex)}
            isSelected={isSelected(rowIndex, colIndex)}
            isValidMove={isValidMove(rowIndex, colIndex)}
            onClick={() => handleSquareClick({ row: rowIndex, col: colIndex })}
          />
        ))
      )}
    </div>
  );
};

export default Board;