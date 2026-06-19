"use client";

import React, { useState, useEffect } from "react";

const GRID_SIZE = 20;
const CELL_SIZE = 20;

export default function SnakeGame() {
  const [snake, setSnake] = useState([[10, 10]]);
  const [food, setFood] = useState([5, 5]);
  const [direction, setDirection] = useState([1, 0]);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const score = snake.length - 1;

  const restartGame = () => {
    setSnake([[10, 10]]);
    setFood([5, 5]);
    setDirection([1, 0]);
    setGameOver(false);
    setIsPaused(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Spacebar Pause / Resume
      if (e.code === "Space") {
        setIsPaused((prev) => !prev);
        return;
      }

      if (isPaused || gameOver) return;

      setDirection((prev) => {
        switch (e.key) {
          case "ArrowUp":
            return prev[1] === 1 ? prev : [0, -1];

          case "ArrowDown":
            return prev[1] === -1 ? prev : [0, 1];

          case "ArrowLeft":
            return prev[0] === 1 ? prev : [-1, 0];

          case "ArrowRight":
            return prev[0] === -1 ? prev : [1, 0];

          default:
            return prev;
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);

    return () =>
      window.removeEventListener("keydown", handleKeyDown);
  }, [isPaused, gameOver]);

  useEffect(() => {
    if (gameOver || isPaused) return;

    const interval = setInterval(() => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];

        const newHead = [
          head[0] + direction[0],
          head[1] + direction[1],
        ];

        // Wall collision
        if (
          newHead[0] < 0 ||
          newHead[0] >= GRID_SIZE ||
          newHead[1] < 0 ||
          newHead[1] >= GRID_SIZE
        ) {
          setGameOver(true);
          return prevSnake;
        }

        // Self collision
        const hitSelf = prevSnake.some(
          (segment) =>
            segment[0] === newHead[0] &&
            segment[1] === newHead[1]
        );

        if (hitSelf) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Food collision
        if (
          newHead[0] === food[0] &&
          newHead[1] === food[1]
        ) {
          let newFood;

          do {
            newFood = [
              Math.floor(Math.random() * GRID_SIZE),
              Math.floor(Math.random() * GRID_SIZE),
            ];
          } while (
            newSnake.some(
              (segment) =>
                segment[0] === newFood[0] &&
                segment[1] === newFood[1]
            )
          );

          setFood(newFood);
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [direction, food, gameOver, isPaused]);

  const getHeadRotation = () => {
    if (direction[0] === 1) return "rotate(90deg)";
    if (direction[0] === -1) return "rotate(-90deg)";
    if (direction[1] === 1) return "rotate(180deg)";
    return "rotate(0deg)";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:
          "linear-gradient(135deg,#0f172a,#1e293b,#020617)",
        color: "white",
      }}
    >
      <div
        style={{
          padding: 24,
          borderRadius: 24,
          backdropFilter: "blur(20px)",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 20,
            alignItems: "center",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "2rem",
              fontWeight: "700",
            }}
          >
            🐍 Snake Game
          </h1>

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <div
              style={{
                padding: "8px 14px",
                borderRadius: 12,
                background: "#22c55e",
                fontWeight: "bold",
              }}
            >
              Score: {score}
            </div>

            {!gameOver && (
              <button
                onClick={() => setIsPaused(!isPaused)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                  background: isPaused
                    ? "#22c55e"
                    : "#f59e0b",
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                {isPaused ? "▶ Resume" : "⏸ Pause"}
              </button>
            )}
          </div>
        </div>

        {gameOver && (
          <div
            style={{
              textAlign: "center",
              marginBottom: 15,
            }}
          >
            <h2 style={{ color: "#ef4444" }}>
              Game Over!
            </h2>

            <button
              onClick={restartGame}
              style={{
                padding: "10px 20px",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                background: "#3b82f6",
                color: "white",
                fontWeight: "bold",
              }}
            >
              Restart
            </button>
          </div>
        )}

        {isPaused && !gameOver && (
          <div
            style={{
              textAlign: "center",
              marginBottom: 15,
            }}
          >
            <h2 style={{ color: "#f59e0b" }}>
              ⏸ Game Paused
            </h2>
          </div>
        )}

        <div
          style={{
            position: "relative",
            width: GRID_SIZE * CELL_SIZE,
            height: GRID_SIZE * CELL_SIZE,
            borderRadius: 16,
            overflow: "hidden",
            border: "2px solid rgba(255,255,255,0.2)",
            backgroundColor: "#111827",
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
          }}
        >
          {snake.map((segment, index) => (
            <div
              key={index}
              style={{
                position: "absolute",
                width: CELL_SIZE - 2,
                height: CELL_SIZE - 2,
                borderRadius: 6,
                background:
                  index === 0
                    ? "linear-gradient(135deg,#4ade80,#22c55e)"
                    : "#16a34a",
                boxShadow:
                  "0 0 12px rgba(34,197,94,0.8)",
                left: segment[0] * CELL_SIZE,
                top: segment[1] * CELL_SIZE,
              }}
            />
          ))}

          <div
            style={{
              position: "absolute",
              width: CELL_SIZE,
              height: CELL_SIZE,
              borderRadius: "50%",
              background: "#ef4444",
              boxShadow:
                "0 0 20px rgba(239,68,68,0.9)",
              left: food[0] * CELL_SIZE,
              top: food[1] * CELL_SIZE,
            }}
          />
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: 15,
            opacity: 0.7,
          }}
        >
          Use ↑ ↓ ← → keys to move • Press Space to
          Pause/Resume
        </p>
      </div>
    </div>
  );
}
