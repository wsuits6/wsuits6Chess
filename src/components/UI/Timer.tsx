import React from "react";
import type { PieceColor } from "../../utils/chessLogic";
import { useTimer } from "../../hooks/useTimer";
import { useGameContext } from "../../context/GameContext";

// ─── Props ────────────────────────────────────────────────────────────────────

interface TimerProps {
  color: PieceColor;
}

// ─── Component ────────────────────────────────────────────────────────────────

const Timer: React.FC<TimerProps> = ({ color }) => {
  const { currentTurn, isGameOver } = useGameContext();
  const { whiteTime, blackTime, formatTime } = useTimer();

  const time = color === "white" ? whiteTime : blackTime;
  const isActive = currentTurn === color && !isGameOver;
  const isLow = time <= 30;
  const isDanger = time <= 10;

  const getTimerClass = (): string => {
    const classes = ["timer"];
    classes.push(`timer--${color}`);
    if (isActive) classes.push("timer--active");
    if (isLow) classes.push("timer--low");
    if (isDanger) classes.push("timer--danger");
    return classes.join(" ");
  };

  return (
    <div className={getTimerClass()}>
      <div className="timer__label">
        {color === "white" ? "⬜ White" : "⬛ Black"}
      </div>
      <div className="timer__display">
        {formatTime(time)}
      </div>
      {isActive && !isGameOver && (
        <div className="timer__pulse" />
      )}
    </div>
  );
};

export default Timer;
