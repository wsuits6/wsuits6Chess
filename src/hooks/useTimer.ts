import { useEffect, useRef, useCallback } from "react";
import { useGameContext } from "../context/GameContext";
import { PieceColor } from "../utils/chessLogic";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TimerHook {
  whiteTime: number;
  blackTime: number;
  formatTime: (seconds: number) => string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useTimer = (): TimerHook => {
  const {
    currentTurn,
    isGameOver,
    isCheckmate,
    isStalemate,
    whiteTime,
    blackTime,
    setWhiteTime,
    setBlackTime,
    handleTimeout,
  } = useGameContext();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Clear interval helper ─────────────────────────────────────────────────

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // ── Start/stop timer based on game state ──────────────────────────────────

  useEffect(() => {
    // Stop timer if game is over
    if (isGameOver || isCheckmate || isStalemate) {
      clearTimer();
      return;
    }

    clearTimer();

    intervalRef.current = setInterval(() => {
      if (currentTurn === "white") {
        setWhiteTime((prev) => {
          if (prev <= 1) {
            clearTimer();
            handleTimeout("white");
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) {
            clearTimer();
            handleTimeout("black");
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearTimer();
  }, [
    currentTurn,
    isGameOver,
    isCheckmate,
    isStalemate,
    setWhiteTime,
    setBlackTime,
    handleTimeout,
    clearTimer,
  ]);

  // ── Format seconds to mm:ss ───────────────────────────────────────────────

  const formatTime = useCallback((seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, []);

  return {
    whiteTime,
    blackTime,
    formatTime,
  };
};