"use client";

import React, { useState, useEffect, useRef } from "react";

const GRID_SIZE = 25;
const CELL_SIZE = 24;

type Speed = "Slow" | "Normal" | "Fast" | "Turbo";

export default function SnakeGame() {
  const [snake, setSnake] = useState<number[][]>([[Math.floor(GRID_SIZE / 2), Math.floor(GRID_SIZE / 2)]]);
  const [food, setFood] = useState<number[]>([Math.floor(GRID_SIZE / 2) + 3, Math.floor(GRID_SIZE / 2)]);
  const [direction, setDirection] = useState<number[]>([1, 0]);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState<Speed>("Normal");
  const [bestScore, setBestScore] = useState(0);
  const [gameWon, setGameWon] = useState(false);

  const directionRef = useRef(direction);
  const score = snake.length - 1;
  const totalBoxes = GRID_SIZE * GRID_SIZE;

  // Load best score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("snakeBestScore");
    if (saved) {
      setBestScore(parseInt(saved, 10));
    }
  }, []);

  // Update best score
  useEffect(() => {
    if (score > bestScore && !gameOver && !gameWon) {
      setBestScore(score);
      localStorage.setItem("snakeBestScore", String(score));
    }
  }, [score, bestScore, gameOver, gameWon]);

  const getSpeedDelay = () => {
    switch (speed) {
      case "Slow":
        return 200;
      case "Normal":
        return 140;
      case "Fast":
        return 90;
      case "Turbo":
        return 50;
      default:
        return 140;
    }
  };

  const restartGame = () => {
    const center = Math.floor(GRID_SIZE / 2);
    setSnake([[center, center]]);
    setFood([center + 3, center]);
    setDirection([1, 0]);
    setGameOver(false);
    setIsPaused(false);
    setGameWon(false);
    directionRef.current = [1, 0];
  };

  const generateFood = (currentSnake: number[][]) => {
    let newFood;
    let attempts = 0;
    do {
      newFood = [
        Math.floor(Math.random() * GRID_SIZE),
        Math.floor(Math.random() * GRID_SIZE),
      ];
      attempts++;
    } while (
      currentSnake.some(
        (segment) => segment[0] === newFood[0] && segment[1] === newFood[1]
      ) &&
      attempts < 1000
    );
    setFood(newFood);
  };

  const togglePause = () => {
    if (!gameOver && !gameWon) {
      setIsPaused(!isPaused);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === " " || e.key === "Space") {
        e.preventDefault();
        togglePause();
        return;
      }

      if (isPaused || gameOver || gameWon) return;

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
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPaused, gameOver, gameWon]);

  useEffect(() => {
    if (gameOver || isPaused || gameWon) return;

    const interval = setInterval(() => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        const newHead = [
          head[0] + direction[0],
          head[1] + direction[1],
        ];

        // Check if snake has filled the board (win condition)
        if (prevSnake.length === totalBoxes) {
          setGameWon(true);
          return prevSnake;
        }

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
            segment[0] === newHead[0] && segment[1] === newHead[1]
        );

        if (hitSelf) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Food collision
        if (newHead[0] === food[0] && newHead[1] === food[1]) {
          let newFood;
          let attempts = 0;
          do {
            newFood = [
              Math.floor(Math.random() * GRID_SIZE),
              Math.floor(Math.random() * GRID_SIZE),
            ];
            attempts++;
          } while (
            newSnake.some(
              (segment) =>
                segment[0] === newFood[0] && segment[1] === newFood[1]
            ) &&
            attempts < 1000
          );
          setFood(newFood);
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, getSpeedDelay());

    return () => clearInterval(interval);
  }, [direction, food, gameOver, isPaused, speed, gameWon, totalBoxes]);

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
        background: "linear-gradient(135deg,#0f172a,#1e293b,#020617)",
        color: "white",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          padding: 32,
          borderRadius: 28,
          backdropFilter: "blur(20px)",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
          maxWidth: "fit-content",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 20,
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "1.8rem",
              fontWeight: "800",
              background: "linear-gradient(135deg,#4ade80,#22c55e)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            🐍 Snake
          </h1>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div
              style={{
                padding: "6px 14px",
                borderRadius: 10,
                background: "#22c55e",
                fontWeight: "bold",
                fontSize: "0.9rem",
              }}
            >
              🏆 {score}
            </div>

            <div
              style={{
                padding: "6px 14px",
                borderRadius: 10,
                background: "#f59e0b",
                fontWeight: "bold",
                fontSize: "0.9rem",
              }}
            >
              ⭐ Best: {bestScore}
            </div>

            <select
              value={speed}
              onChange={(e) => setSpeed(e.target.value as Speed)}
              style={{
                padding: "6px 12px",
                borderRadius: 10,
                border: "none",
                background: "#334155",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              <option value="Slow">🐢 Slow</option>
              <option value="Normal">⚡ Normal</option>
              <option value="Fast">🔥 Fast</option>
              <option value="Turbo">💨 Turbo</option>
            </select>

            <button
              onClick={togglePause}
              disabled={gameOver || gameWon}
              style={{
                padding: "6px 16px",
                borderRadius: 10,
                border: "none",
                cursor: gameOver || gameWon ? "not-allowed" : "pointer",
                background: isPaused ? "#f59e0b" : "#6366f1",
                color: "white",
                fontWeight: "bold",
                opacity: gameOver || gameWon ? 0.5 : 1,
                transition: "all 0.2s",
                minWidth: 65,
                fontSize: "0.85rem",
              }}
            >
              {isPaused ? "▶ Play" : "⏸ Pause"}
            </button>

            <button
              onClick={restartGame}
              style={{
                padding: "6px 16px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                background: "#ef4444",
                color: "white",
                fontWeight: "bold",
                fontSize: "0.85rem",
                transition: "all 0.2s",
              }}
            >
              🔄 Restart
            </button>
          </div>
        </div>

        {(gameOver || isPaused || gameWon) && (
          <div
            style={{
              textAlign: "center",
              marginBottom: 15,
            }}
          >
            {gameOver && (
              <>
                <h2 style={{ color: "#ef4444", margin: 0 }}>💀 Game Over!</h2>
                <p style={{ opacity: 0.7, marginTop: 4, fontSize: "0.9rem" }}>
                  Final Score: {score} | Best: {bestScore}
                </p>
              </>
            )}
            {gameWon && (
              <>
                <h2 style={{ color: "#4ade80", margin: 0 }}>🎉 You Won!</h2>
                <p style={{ opacity: 0.7, marginTop: 4, fontSize: "0.9rem" }}>
                  Perfect Score: {score} | Best: {bestScore}
                </p>
              </>
            )}
            {isPaused && (
              <h2 style={{ color: "#f59e0b", margin: 0 }}>⏸ Paused</h2>
            )}
          </div>
        )}

        <div
          style={{
            position: "relative",
            width: GRID_SIZE * CELL_SIZE,
            height: GRID_SIZE * CELL_SIZE,
            borderRadius: 16,
            overflow: "hidden",
            border: "2px solid rgba(255,255,255,0.15)",
            backgroundColor: "#0a0f1a",
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
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
                borderRadius: index === 0 ? 8 : 4,
                background:
                  index === 0
                    ? "linear-gradient(135deg,#4ade80,#22c55e)"
                    : `hsl(${140 + index * 0.5}, 70%, ${45 - index * 0.3}%)`,
                boxShadow:
                  index === 0
                    ? "0 0 20px rgba(34,197,94,0.6), inset 0 0 10px rgba(255,255,255,0.2)"
                    : "0 2px 8px rgba(0,0,0,0.3)",
                left: segment[0] * CELL_SIZE + 1,
                top: segment[1] * CELL_SIZE + 1,
                opacity: isPaused ? 0.5 : 1,
                transition: "opacity 0.3s, transform 0.1s",
                transform: index === 0 ? "scale(1.02)" : "scale(1)",
              }}
            >
              {index === 0 && (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    transform: getHeadRotation(),
                    transition: "transform 0.1s ease",
                  }}
                >
                  {/* Eyes */}
                  <div
                    style={{
                      position: "absolute",
                      width: 4,
                      height: 4,
                      background: "#000",
                      borderRadius: "50%",
                      top: 4,
                      left: 4,
                      boxShadow: "0 0 4px rgba(255,255,255,0.3)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      width: 4,
                      height: 4,
                      background: "#000",
                      borderRadius: "50%",
                      top: 4,
                      right: 4,
                      boxShadow: "0 0 4px rgba(255,255,255,0.3)",
                    }}
                  />
                  {/* Eye highlights */}
                  <div
                    style={{
                      position: "absolute",
                      width: 1.5,
                      height: 1.5,
                      background: "white",
                      borderRadius: "50%",
                      top: 5,
                      left: 5.5,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      width: 1.5,
                      height: 1.5,
                      background: "white",
                      borderRadius: "50%",
                      top: 5,
                      right: 5.5,
                    }}
                  />

                  {/* Tongue */}
                  <div
                    style={{
                      position: "absolute",
                      width: 2,
                      height: 12,
                      background: "linear-gradient(to bottom, #ef4444, #dc2626)",
                      left: "50%",
                      top: -10,
                      transform: "translateX(-50%)",
                      borderRadius: "0 0 2px 2px",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      width: 1.5,
                      height: 5,
                      background: "#ef4444",
                      left: "calc(50% - 2.5px)",
                      top: -13,
                      transform: "rotate(-20deg)",
                      borderRadius: "0 0 2px 2px",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      width: 1.5,
                      height: 5,
                      background: "#ef4444",
                      left: "calc(50% + 1px)",
                      top: -13,
                      transform: "rotate(20deg)",
                      borderRadius: "0 0 2px 2px",
                    }}
                  />
                </div>
              )}
            </div>
          ))}

          {/* Food - Perfect Circle with Red Gradient */}
          <div
            style={{
              position: "absolute",
              width: CELL_SIZE - 4,
              height: CELL_SIZE - 4,
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 30%, #fca5a5, #dc2626 60%, #991b1b)",
              boxShadow: `
                0 0 30px rgba(239,68,68,0.8),
                0 0 60px rgba(239,68,68,0.4),
                inset 0 -4px 8px rgba(0,0,0,0.3),
                inset 0 4px 8px rgba(255,255,255,0.2)
              `,
              left: food[0] * CELL_SIZE + 3,
              top: food[1] * CELL_SIZE + 3,
              opacity: isPaused ? 0.5 : 1,
              transition: "opacity 0.3s",
            }}
          >
            {/* Food shine effect */}
            <div
              style={{
                position: "absolute",
                width: "30%",
                height: "25%",
                background: "radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)",
                borderRadius: "50%",
                top: "15%",
                left: "20%",
              }}
            />
            {/* Food inner glow */}
            <div
              style={{
                position: "absolute",
                width: "60%",
                height: "60%",
                background: "radial-gradient(circle, rgba(255,200,200,0.3) 0%, transparent 70%)",
                borderRadius: "50%",
                top: "20%",
                left: "20%",
              }}
            />
          </div>

          {isPaused && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(4px)",
                zIndex: 10,
              }}
            >
              <div
                style={{
                  fontSize: "4rem",
                  fontWeight: "bold",
                  color: "white",
                  textShadow: "0 0 40px rgba(0,0,0,0.9)",
                }}
              >
                ⏸
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 16,
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <p
            style={{
              margin: 0,
              opacity: 0.6,
              fontSize: "0.8rem",
            }}
          >
            ↑ ↓ ← → to move • <strong>Space</strong> to pause
          </p>
          <div
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              fontSize: "0.75rem",
              opacity: 0.5,
            }}
          >
            <span>📦 {snake.length}</span>
            <span>•</span>
            <span>🎯 {totalBoxes - snake.length}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes foodPulse {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 0 0 30px rgba(239,68,68,0.8), 0 0 60px rgba(239,68,68,0.4);
          }
          50% { 
            transform: scale(1.05);
            box-shadow: 0 0 40px rgba(239,68,68,1), 0 0 80px rgba(239,68,68,0.5);
          }
        }
        @keyframes tongue {
          0% { transform: translateX(-50%) scaleY(1); }
          100% { transform: translateX(-50%) scaleY(1.2); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
