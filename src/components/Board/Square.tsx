import React from "react";
import "./Board.css";
import Piece from "../Pieces/Piece";
import { Position, ChessPiece } from "../../utils/chessLogic";

interface SquareProps {
  position: Position;
  piece: ChessPiece | null;
  isLight: boolean;
  isSelected: boolean;
  isValidMove: boolean;
  onClick: () => void;
}

const Square: React.FC<SquareProps> = ({
  position,
  piece,
  isLight,
  isSelected,
  isValidMove,
  onClick,
}) => {
  const getSquareClass = (): string => {
    const classes = ["square"];
    classes.push(isLight ? "square--light" : "square--dark");
    if (isSelected) classes.push("square--selected");
    if (isValidMove) classes.push("square--valid-move");
    return classes.join(" ");
  };

  const getColumnLabel = (): string => {
    const columns = ["a", "b", "c", "d", "e", "f", "g", "h"];
    return columns[position.col];
  };

  const getRowLabel = (): string => {
    return String(8 - position.row);
  };

  return (
    <div className={getSquareClass()} onClick={onClick}>
      {position.col === 0 && (
        <span className="square__rank-label">{getRowLabel()}</span>
      )}
      {position.row === 7 && (
        <span className="square__file-label">{getColumnLabel()}</span>
      )}
      {piece && <Piece piece={piece} />}
      {isValidMove && !piece && <div className="square__valid-dot" />}
      {isValidMove && piece && <div className="square__valid-capture" />}
    </div>
  );
};

export default Square;