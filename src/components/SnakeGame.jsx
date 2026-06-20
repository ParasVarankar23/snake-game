"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

const GRID_SIZE = 25;
const CELL_SIZE = 24;

export default function SnakeGame() {
  // Game State
  const [snake, setSnake] = useState([[Math.floor(GRID_SIZE / 2), Math.floor(GRID_SIZE / 2)]]);
  const [food, setFood] = useState([Math.floor(GRID_SIZE / 2) + 3, Math.floor(GRID_SIZE / 2)]);
  const [direction, setDirection] = useState([1, 0]);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState("Normal");
  const [bestScore, setBestScore] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [stones, setStones] = useState([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [showRules, setShowRules] = useState(false);
  const [unlockedLevels, setUnlockedLevels] = useState([1]);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [nextLevelScore, setNextLevelScore] = useState(10);

  // Power-Ups
  const [powerUp, setPowerUp] = useState(null);
  const [powerUpTimer, setPowerUpTimer] = useState(0);
  const [powerUpActive, setPowerUpActive] = useState(null);

  // Achievements
  const [achievements, setAchievements] = useState([]);
  const [showAchievement, setShowAchievement] = useState(null);
  const [stats, setStats] = useState({
    totalGames: 0,
    totalScore: 0,
    totalFood: 0,
    stonesAvoided: 0,
    levelsCompleted: 0,
    timePlayed: 0,
  });

  // Theme
  const [theme, setTheme] = useState("dark");
  const [snakeSkin, setSnakeSkin] = useState("classic");
  const [foodSkin, setFoodSkin] = useState("classic");

  // Touch Controls
  const [touchStart, setTouchStart] = useState(null);
  const [showTouchControls, setShowTouchControls] = useState(false);

  // Responsive
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [gridSize, setGridSize] = useState(25);
  const [cellSize, setCellSize] = useState(24);

  // Sound
  const audioContext = useRef(null);

  const directionRef = useRef(direction);
  const totalBoxes = GRID_SIZE * GRID_SIZE;
  const gameLoopRef = useRef(null);

  // Responsive grid sizing
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      
      // Adjust grid size based on screen width
      if (width < 400) {
        setGridSize(20);
        setCellSize(16);
      } else if (width < 500) {
        setGridSize(22);
        setCellSize(18);
      } else if (width < 768) {
        setGridSize(25);
        setCellSize(20);
      } else {
        setGridSize(25);
        setCellSize(24);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Level configuration based on score
  const getLevelConfig = (score) => {
    if (score < 10) {
      return { 
        level: 1, 
        stones: 0, 
        speed: "Slow", 
        label: "🌱 Beginner",
        nextLevelScore: 10,
        color: "#22c55e"
      };
    } else if (score < 20) {
      return { 
        level: 2, 
        stones: 3, 
        speed: "Normal", 
        label: "🌿 Easy",
        nextLevelScore: 20,
        color: "#84cc16"
      };
    } else if (score < 50) {
      return { 
        level: 3, 
        stones: 6, 
        speed: "Normal", 
        label: "🔥 Medium",
        nextLevelScore: 50,
        color: "#f59e0b"
      };
    } else if (score < 75) {
      return { 
        level: 4, 
        stones: 10, 
        speed: "Fast", 
        label: "⚡ Hard",
        nextLevelScore: 75,
        color: "#f97316"
      };
    } else if (score < 100) {
      return { 
        level: 5, 
        stones: 15, 
        speed: "Turbo", 
        label: "💀 Expert",
        nextLevelScore: 100,
        color: "#ef4444"
      };
    } else {
      return { 
        level: 6, 
        stones: 20, 
        speed: "Turbo", 
        label: "👑 Legend",
        nextLevelScore: null,
        color: "#8b5cf6"
      };
    }
  };

  // Achievement definitions
  const ACHIEVEMENTS = {
    FIRST_BITE: { id: 'first_bite', name: 'First Bite', desc: 'Eat your first food', icon: '🍎', unlocked: false },
    SNAKE_CHARMER: { id: 'snake_charmer', name: 'Snake Charmer', desc: 'Reach length 10', icon: '🐍', unlocked: false },
    STONE_DODGER: { id: 'stone_dodger', name: 'Stone Dodger', desc: 'Avoid 10 stones', icon: '🪨', unlocked: false },
    SPEED_DEMON: { id: 'speed_demon', name: 'Speed Demon', desc: 'Complete on Turbo', icon: '⚡', unlocked: false },
    MASTER_OF_SNAKE: { id: 'master_of_snake', name: 'Master of Snake', desc: 'Reach score 100', icon: '👑', unlocked: false },
    PERFECT_SCORE: { id: 'perfect_score', name: 'Perfect Score', desc: 'Complete without losing', icon: '⭐', unlocked: false },
    POWER_USER: { id: 'power_user', name: 'Power User', desc: 'Collect 5 power-ups', icon: '💪', unlocked: false },
    LEVEL_MASTER: { id: 'level_master', name: 'Level Master', desc: 'Reach Level 6', icon: '🏆', unlocked: false },
  };

  // Load progress
  useEffect(() => {
    const savedBest = localStorage.getItem("snakeBestScore");
    if (savedBest) setBestScore(parseInt(savedBest, 10));
    
    const savedUnlocked = localStorage.getItem("snakeUnlockedLevels");
    if (savedUnlocked) {
      try {
        const parsed = JSON.parse(savedUnlocked);
        if (Array.isArray(parsed) && parsed.length > 0) setUnlockedLevels(parsed);
      } catch (e) {}
    }

    const savedAchievements = localStorage.getItem("snakeAchievements");
    if (savedAchievements) {
      try {
        setAchievements(JSON.parse(savedAchievements));
      } catch (e) {}
    }

    const savedStats = localStorage.getItem("snakeStats");
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (e) {}
    }

    const savedTheme = localStorage.getItem("snakeTheme");
    if (savedTheme) setTheme(savedTheme);

    const savedSkin = localStorage.getItem("snakeSkin");
    if (savedSkin) setSnakeSkin(savedSkin);

    // Check if touch device
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      setShowTouchControls(true);
    }
  }, []);

  // Save progress
  useEffect(() => {
    localStorage.setItem("snakeUnlockedLevels", JSON.stringify(unlockedLevels));
    localStorage.setItem("snakeAchievements", JSON.stringify(achievements));
    localStorage.setItem("snakeStats", JSON.stringify(stats));
    localStorage.setItem("snakeTheme", theme);
    localStorage.setItem("snakeSkin", snakeSkin);
  }, [unlockedLevels, achievements, stats, theme, snakeSkin]);

  // Update best score
  useEffect(() => {
    if (score > bestScore && !gameOver && !gameWon) {
      setBestScore(score);
      localStorage.setItem("snakeBestScore", String(score));
    }
  }, [score, bestScore, gameOver, gameWon]);

  // Update level based on score
  useEffect(() => {
    const config = getLevelConfig(score);
    const newLevel = config.level;
    
    if (newLevel !== level && !gameOver) {
      setLevel(newLevel);
      setNextLevelScore(config.nextLevelScore);
      
      if (!unlockedLevels.includes(newLevel)) {
        setUnlockedLevels(prev => [...prev, newLevel]);
        setShowLevelComplete(true);
        playSound('levelcomplete');
        
        setStats(prev => ({
          ...prev,
          levelsCompleted: prev.levelsCompleted + 1,
        }));
        
        checkAchievements('level', { perfect: !gameOver });
      }
      
      const center = Math.floor(gridSize / 2);
      const initialSnake = [[center, center]];
      generateStones(initialSnake, food, newLevel);
    }
  }, [score]);

  // Power-up timer
  useEffect(() => {
    if (powerUpActive) {
      const timer = setInterval(() => {
        setPowerUpTimer(prev => {
          if (prev <= 0) {
            setPowerUpActive(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [powerUpActive]);

  // Initialize Audio
  useEffect(() => {
    audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
    return () => {
      if (audioContext.current) audioContext.current.close();
    };
  }, []);

  // Sound functions
  const playSound = useCallback((type) => {
    try {
      const ctx = audioContext.current;
      if (!ctx) return;

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      switch(type) {
        case 'eat':
          oscillator.frequency.setValueAtTime(800, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.1);
          break;
        case 'gameover':
          oscillator.frequency.setValueAtTime(500, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.5);
          gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.5);
          break;
        case 'levelcomplete':
          [523, 659, 784, 1047].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
            gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.3);
            osc.start(ctx.currentTime + i * 0.15);
            osc.stop(ctx.currentTime + i * 0.15 + 0.3);
          });
          break;
        case 'powerup':
          oscillator.frequency.setValueAtTime(600, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.3);
          gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.3);
          break;
        default:
          break;
      }
    } catch (e) {}
  }, []);

  // Generate stones
  const generateStones = (snakePositions, foodPosition, currentLevel) => {
    const config = getLevelConfig(score);
    const numStones = config.stones;
    const newStones = [];
    let attempts = 0;
    
    while (newStones.length < numStones && attempts < 2000) {
      attempts++;
      const stone = [
        Math.floor(Math.random() * gridSize),
        Math.floor(Math.random() * gridSize),
      ];
      
      const isOnSnake = snakePositions.some(
        (seg) => seg[0] === stone[0] && seg[1] === stone[1]
      );
      const isOnFood = stone[0] === foodPosition[0] && stone[1] === foodPosition[1];
      const isOnStone = newStones.some(
        (s) => s[0] === stone[0] && s[1] === stone[1]
      );
      
      if (!isOnSnake && !isOnFood && !isOnStone) {
        newStones.push(stone);
      }
    }
    setStones(newStones);
  };

  // Generate power-ups
  const generatePowerUp = (snakePos, foodPos, currentStones) => {
    if (Math.random() > 0.15 || powerUp) return;
    
    const types = ['⭐', '🛡️', '⚡', '💫'];
    const type = types[Math.floor(Math.random() * types.length)];
    let position;
    let attempts = 0;
    
    do {
      position = [
        Math.floor(Math.random() * gridSize),
        Math.floor(Math.random() * gridSize),
      ];
      attempts++;
    } while (
      (snakePos.some(seg => seg[0] === position[0] && seg[1] === position[1]) ||
       (position[0] === foodPos[0] && position[1] === foodPos[1]) ||
       currentStones.some(stone => stone[0] === position[0] && stone[1] === position[1])) &&
      attempts < 1000
    );
    
    setPowerUp({ type, position, spawnTime: Date.now() });
  };

  const getSpeedDelay = () => {
    const config = getLevelConfig(score);
    if (powerUpActive === 'speed') return 50;
    if (powerUpActive === 'slow') return 300;
    
    switch (config.speed) {
      case "Slow": return 250;
      case "Normal": return 160;
      case "Fast": return 100;
      case "Turbo": return 60;
      default: return 160;
    }
  };

  // Check achievements
  const checkAchievements = (type, data) => {
    const newAchievements = [...achievements];
    let unlocked = false;

    switch(type) {
      case 'food':
        if (score === 1 && !newAchievements.find(a => a.id === 'first_bite')) {
          newAchievements.push({ ...ACHIEVEMENTS.FIRST_BITE, unlocked: true, unlockedAt: new Date().toISOString() });
          unlocked = true;
        }
        if (snake.length >= 10 && !newAchievements.find(a => a.id === 'snake_charmer')) {
          newAchievements.push({ ...ACHIEVEMENTS.SNAKE_CHARMER, unlocked: true, unlockedAt: new Date().toISOString() });
          unlocked = true;
        }
        break;
      case 'stone':
        if (stats.stonesAvoided >= 10 && !newAchievements.find(a => a.id === 'stone_dodger')) {
          newAchievements.push({ ...ACHIEVEMENTS.STONE_DODGER, unlocked: true, unlockedAt: new Date().toISOString() });
          unlocked = true;
        }
        break;
      case 'level':
        if (level === 6 && !newAchievements.find(a => a.id === 'master_of_snake')) {
          newAchievements.push({ ...ACHIEVEMENTS.MASTER_OF_SNAKE, unlocked: true, unlockedAt: new Date().toISOString() });
          unlocked = true;
        }
        if (data.perfect && !newAchievements.find(a => a.id === 'perfect_score')) {
          newAchievements.push({ ...ACHIEVEMENTS.PERFECT_SCORE, unlocked: true, unlockedAt: new Date().toISOString() });
          unlocked = true;
        }
        if (level === 6 && !newAchievements.find(a => a.id === 'level_master')) {
          newAchievements.push({ ...ACHIEVEMENTS.LEVEL_MASTER, unlocked: true, unlockedAt: new Date().toISOString() });
          unlocked = true;
        }
        break;
      case 'powerup':
        const powerCount = newAchievements.filter(a => a.id === 'power_user').length;
        if (powerCount >= 5 && !newAchievements.find(a => a.id === 'power_user')) {
          newAchievements.push({ ...ACHIEVEMENTS.POWER_USER, unlocked: true, unlockedAt: new Date().toISOString() });
          unlocked = true;
        }
        break;
      default:
        break;
    }

    if (unlocked) {
      setAchievements(newAchievements);
      const lastUnlocked = newAchievements[newAchievements.length - 1];
      setShowAchievement(lastUnlocked);
      setTimeout(() => setShowAchievement(null), 3000);
      playSound('levelcomplete');
    }
  };

  const restartGame = () => {
    const center = Math.floor(gridSize / 2);
    const initialSnake = [[center, center]];
    const initialFood = [center + 3, center];
    setSnake(initialSnake);
    setFood(initialFood);
    setDirection([1, 0]);
    setGameOver(false);
    setIsPaused(false);
    setGameWon(false);
    setScore(0);
    setLevel(1);
    setNextLevelScore(10);
    setPowerUp(null);
    setPowerUpActive(null);
    setPowerUpTimer(0);
    setShowLevelComplete(false);
    directionRef.current = [1, 0];
    generateStones(initialSnake, initialFood, 1);
    setStats(prev => ({ ...prev, totalGames: prev.totalGames + 1 }));
    playSound('move');
  };

  const generateFood = (currentSnake, currentStones) => {
    let newFood;
    let attempts = 0;
    do {
      newFood = [
        Math.floor(Math.random() * gridSize),
        Math.floor(Math.random() * gridSize),
      ];
      attempts++;
    } while (
      (currentSnake.some(
        (segment) => segment[0] === newFood[0] && segment[1] === newFood[1]
      ) ||
      currentStones.some(
        (stone) => stone[0] === newFood[0] && stone[1] === newFood[1]
      ) ||
      (powerUp && powerUp.position[0] === newFood[0] && powerUp.position[1] === newFood[1])) &&
      attempts < 1000
    );
    setFood(newFood);
  };

  const togglePause = () => {
    if (!gameOver && !gameWon && !showLevelComplete) {
      setIsPaused(!isPaused);
    }
  };

  // Touch controls
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (!touchStart || isPaused || gameOver || gameWon) return;

    const touch = e.touches[0];
    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;

    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      setDirection(prev => dx > 0 ? (prev[0] === -1 ? prev : [1, 0]) : (prev[0] === 1 ? prev : [-1, 0]));
    } else {
      setDirection(prev => dy > 0 ? (prev[1] === -1 ? prev : [0, 1]) : (prev[1] === 1 ? prev : [0, -1]));
    }
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === " " || e.key === "Space") {
        e.preventDefault();
        togglePause();
        return;
      }

      if (isPaused || gameOver || gameWon || showLevelComplete) return;

      setDirection((prev) => {
        switch (e.key) {
          case "ArrowUp": return prev[1] === 1 ? prev : [0, -1];
          case "ArrowDown": return prev[1] === -1 ? prev : [0, 1];
          case "ArrowLeft": return prev[0] === 1 ? prev : [-1, 0];
          case "ArrowRight": return prev[0] === -1 ? prev : [1, 0];
          default: return prev;
        }
      });
      playSound('move');
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPaused, gameOver, gameWon, showLevelComplete]);

  // Initialize
  useEffect(() => {
    const center = Math.floor(gridSize / 2);
    generateStones([[center, center]], [center + 3, center], 1);
  }, [gridSize]);

  // Game loop
  useEffect(() => {
    if (gameOver || isPaused || gameWon || showLevelComplete) {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    gameLoopRef.current = setInterval(() => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        const newHead = [
          head[0] + direction[0],
          head[1] + direction[1],
        ];

        const totalObstacles = stones.length;
        if (prevSnake.length === gridSize * gridSize - totalObstacles) {
          setGameWon(true);
          return prevSnake;
        }

        // Wall collision
        if (
          newHead[0] < 0 || newHead[0] >= gridSize ||
          newHead[1] < 0 || newHead[1] >= gridSize
        ) {
          setGameOver(true);
          playSound('gameover');
          return prevSnake;
        }

        // Stone collision
        const hitStone = stones.some(
          (stone) => stone[0] === newHead[0] && stone[1] === newHead[1]
        );

        if (hitStone && powerUpActive !== 'invincible') {
          setGameOver(true);
          playSound('gameover');
          return prevSnake;
        }

        // Self collision
        const hitSelf = prevSnake.some(
          (segment) => segment[0] === newHead[0] && segment[1] === newHead[1]
        );

        if (hitSelf && powerUpActive !== 'invincible') {
          setGameOver(true);
          playSound('gameover');
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Food collision
        if (newHead[0] === food[0] && newHead[1] === food[1]) {
          setScore(prev => prev + 1);
          setStats(prev => ({
            ...prev,
            totalScore: prev.totalScore + 1,
            totalFood: prev.totalFood + 1,
          }));
          playSound('eat');
          generateFood(newSnake, stones);
          generatePowerUp(newSnake, food, stones);
          checkAchievements('food', {});
        } else {
          newSnake.pop();
        }

        // Power-up collision
        if (powerUp && newHead[0] === powerUp.position[0] && newHead[1] === powerUp.position[1]) {
          playSound('powerup');
          const type = powerUp.type;
          setPowerUpActive(type);
          setPowerUpTimer(type === '⭐' ? 5 : type === '🛡️' ? 8 : 3);
          setPowerUp(null);
          setStats(prev => ({ ...prev, powerUpsCollected: (prev.powerUpsCollected || 0) + 1 }));
          checkAchievements('powerup', {});
        }

        return newSnake;
      });
    }, getSpeedDelay());

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [direction, food, gameOver, isPaused, gameWon, stones, showLevelComplete, powerUp, powerUpActive, gridSize]);

  const getHeadRotation = () => {
    if (direction[0] === 1) return "rotate(90deg)";
    if (direction[0] === -1) return "rotate(-90deg)";
    if (direction[1] === 1) return "rotate(180deg)";
    return "rotate(0deg)";
  };

  const getLevelColor = (lvl) => {
    switch(lvl) {
      case 1: return "#22c55e";
      case 2: return "#84cc16";
      case 3: return "#f59e0b";
      case 4: return "#f97316";
      case 5: return "#ef4444";
      case 6: return "#8b5cf6";
      default: return "#22c55e";
    }
  };

  const getSnakeColor = () => {
    switch(snakeSkin) {
      case 'neon': return 'linear-gradient(135deg,#8b5cf6,#ec4899)';
      case 'gold': return 'linear-gradient(135deg,#fbbf24,#f59e0b)';
      case 'fire': return 'linear-gradient(135deg,#f97316,#dc2626)';
      case 'ice': return 'linear-gradient(135deg,#38bdf8,#0284c7)';
      case 'galaxy': return 'linear-gradient(135deg,#6d28d9,#be185d)';
      default: return 'linear-gradient(135deg,#4ade80,#22c55e)';
    }
  };

  const getFoodEmoji = () => {
    switch(foodSkin) {
      case 'candy': return '🍬';
      case 'fruit': return '🍎';
      case 'star': return '⭐';
      case 'heart': return '❤️';
      default: return '🍎';
    }
  };

  const config = getLevelConfig(score);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: theme === 'dark' 
          ? "linear-gradient(135deg,#0f172a,#1e293b,#020617)"
          : "linear-gradient(135deg,#f0fdf4,#dcfce7,#fefce8)",
        color: theme === 'dark' ? "white" : "#0f172a",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        padding: windowWidth < 500 ? "10px" : "20px",
        transition: "all 0.3s ease",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        style={{
          padding: windowWidth < 500 ? "16px" : windowWidth < 768 ? "20px" : "32px",
          borderRadius: windowWidth < 500 ? "16px" : "28px",
          backdropFilter: "blur(20px)",
          background: theme === 'dark' 
            ? "rgba(255,255,255,0.06)"
            : "rgba(255,255,255,0.8)",
          border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
          maxWidth: "100%",
          width: "100%",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: windowWidth < 500 ? "12px" : "20px",
            alignItems: "center",
            gap: windowWidth < 500 ? "8px" : "16px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: windowWidth < 500 ? "6px" : "12px" }}>
            <h1
              style={{
                margin: 0,
                fontSize: windowWidth < 500 ? "1.2rem" : windowWidth < 768 ? "1.5rem" : "2rem",
                fontWeight: "800",
                background: getSnakeColor(),
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              🐍 Snake
            </h1>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={{
                padding: windowWidth < 500 ? "2px 6px" : "4px 10px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                background: theme === 'dark' ? "#f59e0b" : "#1e293b",
                color: theme === 'dark' ? "#1e293b" : "white",
                fontSize: windowWidth < 500 ? "0.8rem" : "1.2rem",
              }}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>

          <div style={{ 
            display: "flex", 
            gap: windowWidth < 500 ? "4px" : "10px", 
            alignItems: "center", 
            flexWrap: "wrap",
            fontSize: windowWidth < 500 ? "0.7rem" : "0.9rem",
          }}>
            <div
              style={{
                padding: windowWidth < 500 ? "4px 8px" : "6px 14px",
                borderRadius: 10,
                background: "#22c55e",
                fontWeight: "bold",
                boxShadow: "0 4px 12px rgba(34,197,94,0.3)",
              }}
            >
              🏆 {score}
            </div>

            <div
              style={{
                padding: windowWidth < 500 ? "4px 8px" : "6px 14px",
                borderRadius: 10,
                background: "linear-gradient(135deg,#f59e0b,#d97706)",
                fontWeight: "bold",
                boxShadow: "0 4px 12px rgba(245,158,11,0.3)",
              }}
            >
              ⭐ {bestScore}
            </div>

            <div
              style={{
                padding: windowWidth < 500 ? "4px 8px" : "6px 14px",
                borderRadius: 10,
                background: `linear-gradient(135deg, ${getLevelColor(level)}, ${getLevelColor(level)}dd)`,
                fontWeight: "bold",
                boxShadow: `0 4px 12px ${getLevelColor(level)}44`,
              }}
            >
              Level {level}
            </div>

            {nextLevelScore && (
              <div
                style={{
                  padding: windowWidth < 500 ? "4px 8px" : "6px 14px",
                  borderRadius: 10,
                  background: "rgba(99,102,241,0.3)",
                  fontWeight: "bold",
                  fontSize: windowWidth < 500 ? "0.6rem" : "0.85rem",
                  border: "1px solid rgba(99,102,241,0.5)",
                }}
              >
                ➜ {nextLevelScore}
              </div>
            )}

            {powerUpActive && (
              <div
                style={{
                  padding: windowWidth < 500 ? "4px 8px" : "6px 14px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg,#8b5cf6,#6d28d9)",
                  fontWeight: "bold",
                  fontSize: windowWidth < 500 ? "0.6rem" : "0.9rem",
                  animation: "pulse 1s ease-in-out infinite",
                  boxShadow: "0 4px 12px rgba(139,92,246,0.3)",
                }}
              >
                {powerUpActive === 'invincible' && '⭐'}
                {powerUpActive === 'shield' && '🛡️'}
                {powerUpActive === 'speed' && '⚡'}
                {powerUpActive === 'slow' && '🐢'}
                ⏱️ {powerUpTimer}s
              </div>
            )}

            {windowWidth > 500 && (
              <>
                <select
                  value={snakeSkin}
                  onChange={(e) => setSnakeSkin(e.target.value)}
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
                  <option value="classic">🐍 Classic</option>
                  <option value="neon">💜 Neon</option>
                  <option value="gold">✨ Gold</option>
                  <option value="fire">🔥 Fire</option>
                  <option value="ice">❄️ Ice</option>
                  <option value="galaxy">🌌 Galaxy</option>
                </select>

                <select
                  value={foodSkin}
                  onChange={(e) => setFoodSkin(e.target.value)}
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
                  <option value="classic">🍎 Classic</option>
                  <option value="candy">🍬 Candy</option>
                  <option value="fruit">🍎 Fruit</option>
                  <option value="star">⭐ Star</option>
                  <option value="heart">❤️ Heart</option>
                </select>
              </>
            )}

            <button
              onClick={() => setShowRules(!showRules)}
              style={{
                padding: windowWidth < 500 ? "4px 10px" : "6px 12px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                background: "#6366f1",
                color: "white",
                fontWeight: "bold",
                fontSize: windowWidth < 500 ? "0.7rem" : "0.85rem",
                boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
              }}
            >
              📖
            </button>

            <button
              onClick={togglePause}
              disabled={gameOver || gameWon || showLevelComplete}
              style={{
                padding: windowWidth < 500 ? "4px 10px" : "6px 16px",
                borderRadius: 10,
                border: "none",
                cursor: gameOver || gameWon || showLevelComplete ? "not-allowed" : "pointer",
                background: isPaused ? "linear-gradient(135deg,#f59e0b,#d97706)" : "linear-gradient(135deg,#6366f1,#4f46e5)",
                color: "white",
                fontWeight: "bold",
                opacity: gameOver || gameWon || showLevelComplete ? 0.5 : 1,
                transition: "all 0.3s",
                minWidth: windowWidth < 500 ? "40px" : "65px",
                fontSize: windowWidth < 500 ? "0.7rem" : "0.85rem",
                boxShadow: isPaused ? "0 4px 12px rgba(245,158,11,0.3)" : "0 4px 12px rgba(99,102,241,0.3)",
              }}
            >
              {isPaused ? "▶" : "⏸"}
            </button>

            <button
              onClick={restartGame}
              style={{
                padding: windowWidth < 500 ? "4px 10px" : "6px 16px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                background: "linear-gradient(135deg,#ef4444,#dc2626)",
                color: "white",
                fontWeight: "bold",
                fontSize: windowWidth < 500 ? "0.7rem" : "0.85rem",
                transition: "all 0.3s",
                boxShadow: "0 4px 12px rgba(239,68,68,0.3)",
              }}
            >
              🔄
            </button>
          </div>
        </div>

        {/* Achievement Notification */}
        {showAchievement && (
          <div
            style={{
              position: "fixed",
              top: windowWidth < 500 ? "10px" : "20px",
              right: windowWidth < 500 ? "10px" : "20px",
              background: "linear-gradient(135deg,#facc15,#f59e0b)",
              color: "#1e293b",
              padding: windowWidth < 500 ? "12px 16px" : "16px 24px",
              borderRadius: 16,
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              zIndex: 2000,
              animation: "slideIn 0.5s ease",
              maxWidth: windowWidth < 500 ? "200px" : "300px",
              fontSize: windowWidth < 500 ? "0.8rem" : "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: windowWidth < 500 ? "1.5rem" : "2rem" }}>{showAchievement.icon}</span>
              <div>
                <div style={{ fontWeight: "bold" }}>🏆 Achievement!</div>
                <div style={{ fontSize: windowWidth < 500 ? "0.7rem" : "0.9rem" }}>{showAchievement.name}</div>
              </div>
            </div>
          </div>
        )}

        {/* Rules Modal */}
        {showRules && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(10px)",
              zIndex: 1000,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              animation: "fadeIn 0.3s ease",
              padding: "20px",
            }}
            onClick={() => setShowRules(false)}
          >
            <div
              style={{
                background: theme === 'dark' ? "#1e293b" : "white",
                padding: windowWidth < 500 ? "24px" : "40px",
                borderRadius: 24,
                maxWidth: 500,
                width: "100%",
                maxHeight: "80vh",
                overflowY: "auto",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
                color: theme === 'dark' ? "white" : "#0f172a",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ marginTop: 0, color: "#4ade80", fontSize: windowWidth < 500 ? "1.2rem" : "1.5rem" }}>
                📖 Game Rules
              </h2>
              
              <div style={{ marginBottom: 16, fontSize: windowWidth < 500 ? "0.85rem" : "1rem" }}>
                <h3 style={{ color: "#f59e0b", fontSize: windowWidth < 500 ? "1rem" : "1.1rem" }}>🎯 Level System</h3>
                <div style={{ opacity: 0.8 }}>
                  <p><strong>Level 1:</strong> Score 0-9 • No stones • Slow</p>
                  <p><strong>Level 2:</strong> Score 10-19 • 3 stones • Normal</p>
                  <p><strong>Level 3:</strong> Score 20-49 • 6 stones • Normal</p>
                  <p><strong>Level 4:</strong> Score 50-74 • 10 stones • Fast</p>
                  <p><strong>Level 5:</strong> Score 75-99 • 15 stones • Turbo</p>
                  <p><strong style={{ color: "#8b5cf6" }}>Level 6:</strong> Score 100+ • 20 stones • Legend</p>
                </div>
              </div>

              <div style={{ marginBottom: 16, fontSize: windowWidth < 500 ? "0.85rem" : "1rem" }}>
                <h3 style={{ color: "#f59e0b", fontSize: windowWidth < 500 ? "1rem" : "1.1rem" }}>💪 Power-Ups</h3>
                <div style={{ opacity: 0.8 }}>
                  <p><strong>⭐ Invincible:</strong> Pass through stones for 5s</p>
                  <p><strong>🛡️ Shield:</strong> Block one collision</p>
                  <p><strong>⚡ Speed:</strong> Double speed for 3s</p>
                  <p><strong>💫 Slow:</strong> Slow down time for 3s</p>
                </div>
              </div>

              <div style={{ marginBottom: 16, fontSize: windowWidth < 500 ? "0.85rem" : "1rem" }}>
                <h3 style={{ color: "#f59e0b", fontSize: windowWidth < 500 ? "1rem" : "1.1rem" }}>🎮 Controls</h3>
                <ul style={{ opacity: 0.8, paddingLeft: 20 }}>
                  <li>↑ ↓ ← → or WASD to move</li>
                  <li>Space to pause</li>
                  <li>Swipe on mobile</li>
                </ul>
              </div>

              <button
                onClick={() => setShowRules(false)}
                style={{
                  marginTop: 20,
                  padding: "10px 24px",
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                  background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "1rem",
                  width: "100%",
                  boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
                }}
              >
                Got it! ✨
              </button>
            </div>
          </div>
        )}

        {/* Level Complete Modal */}
        {showLevelComplete && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(10px)",
              zIndex: 1000,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              animation: "fadeIn 0.5s ease",
              padding: "20px",
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #1e293b, #0f172a)",
                padding: windowWidth < 500 ? "24px" : "40px",
                borderRadius: 24,
                maxWidth: 450,
                width: "100%",
                textAlign: "center",
                border: "2px solid rgba(74, 222, 128, 0.3)",
                boxShadow: "0 30px 60px rgba(0,0,0,0.5), 0 0 60px rgba(74, 222, 128, 0.1)",
              }}
            >
              <div style={{ fontSize: windowWidth < 500 ? "3rem" : "4rem", marginBottom: 10 }}>🎉</div>
              <h2 style={{ color: "#4ade80", margin: "10px 0", fontSize: windowWidth < 500 ? "1.5rem" : "2rem" }}>
                Level {level} Complete!
              </h2>
              <p style={{ opacity: 0.8, fontSize: windowWidth < 500 ? "0.9rem" : "1.1rem" }}>
                Score: {score} | {config.label}
              </p>
              
              {level < 6 && (
                <div style={{ 
                  margin: "20px 0", 
                  padding: "16px", 
                  background: "rgba(74, 222, 128, 0.1)",
                  borderRadius: 12,
                  border: "1px solid rgba(74, 222, 128, 0.2)"
                }}>
                  <p style={{ margin: 0, color: "#4ade80" }}>
                    🔓 Next Level: {level + 1}
                  </p>
                  <p style={{ margin: "4px 0 0 0", opacity: 0.6, fontSize: "0.9rem" }}>
                    Need {nextLevelScore} points
                  </p>
                </div>
              )}

              {level === 6 && (
                <div style={{ 
                  margin: "20px 0", 
                  padding: "16px", 
                  background: "rgba(250, 204, 21, 0.1)",
                  borderRadius: 12,
                  border: "1px solid rgba(250, 204, 21, 0.2)"
                }}>
                  <p style={{ margin: 0, color: "#facc15", fontSize: "1.2rem" }}>
                    👑 You're a Snake Master!
                  </p>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
                <button
                  onClick={() => {
                    setShowLevelComplete(false);
                    restartGame();
                  }}
                  style={{
                    flex: 1,
                    padding: "12px 20px",
                    borderRadius: 12,
                    border: "none",
                    cursor: "pointer",
                    background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: windowWidth < 500 ? "0.85rem" : "1rem",
                    boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
                    minWidth: "100px",
                  }}
                >
                  Continue ➜
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Game Status */}
        {(gameOver || isPaused || gameWon) && !showLevelComplete && (
          <div
            style={{
              textAlign: "center",
              marginBottom: windowWidth < 500 ? "10px" : "15px",
              animation: "fadeIn 0.3s ease",
            }}
          >
            {gameOver && (
              <>
                <h2 style={{ color: "#ef4444", margin: 0, fontSize: windowWidth < 500 ? "1.2rem" : "1.8rem" }}>
                  💀 Game Over!
                </h2>
                <p style={{ opacity: 0.7, marginTop: 4, fontSize: windowWidth < 500 ? "0.8rem" : "0.9rem" }}>
                  Score: {score} | Best: {bestScore} | Level: {level}
                </p>
              </>
            )}
            {gameWon && !showLevelComplete && (
              <>
                <h2 style={{ color: "#4ade80", margin: 0, fontSize: windowWidth < 500 ? "1.2rem" : "1.8rem" }}>
                  🎉 Level Complete!
                </h2>
                <p style={{ opacity: 0.7, marginTop: 4, fontSize: windowWidth < 500 ? "0.8rem" : "0.9rem" }}>
                  Score: {score} | {config.label}
                </p>
              </>
            )}
            {isPaused && (
              <h2 style={{ color: "#f59e0b", margin: 0, fontSize: windowWidth < 500 ? "1.2rem" : "1.8rem" }}>
                ⏸ Paused
              </h2>
            )}
          </div>
        )}

        {/* Game Board */}
        <div
          style={{
            position: "relative",
            width: gridSize * cellSize,
            height: gridSize * cellSize,
            borderRadius: 16,
            overflow: "hidden",
            border: `2px solid ${theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
            backgroundColor: theme === 'dark' ? "#0a0f1a" : "#e2e8f0",
            backgroundImage: `
              linear-gradient(${theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px),
              linear-gradient(90deg, ${theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px)
            `,
            backgroundSize: `${cellSize}px ${cellSize}px`,
            margin: "0 auto",
          }}
        >
          {/* Snake */}
          {snake.map((segment, index) => (
            <div
              key={index}
              style={{
                position: "absolute",
                width: cellSize - 2,
                height: cellSize - 2,
                borderRadius: index === 0 ? Math.max(6, cellSize * 0.4) : Math.max(3, cellSize * 0.2),
                background: index === 0 ? getSnakeColor() : 
                  snakeSkin === 'neon' ? '#8b5cf6' :
                  snakeSkin === 'gold' ? '#fbbf24' :
                  snakeSkin === 'fire' ? '#f97316' :
                  snakeSkin === 'ice' ? '#38bdf8' :
                  snakeSkin === 'galaxy' ? '#6d28d9' :
                  `hsl(${140 + index * 0.5}, 70%, ${45 - index * 0.3}%)`,
                boxShadow: index === 0
                  ? `0 0 ${cellSize}px ${powerUpActive === 'invincible' ? 'rgba(251,191,36,0.8)' : 'rgba(34,197,94,0.6)'}, inset 0 0 ${cellSize * 0.5}px rgba(255,255,255,0.2)`
                  : `0 ${cellSize * 0.1}px ${cellSize * 0.3}px rgba(0,0,0,0.3)`,
                left: segment[0] * cellSize + 1,
                top: segment[1] * cellSize + 1,
                opacity: isPaused ? 0.5 : 1,
                transition: "opacity 0.3s, transform 0.15s",
                transform: index === 0 ? "scale(1.05)" : "scale(1)",
                zIndex: 2,
                border: index === 0 && powerUpActive === 'invincible' ? `2px solid #facc15` : "none",
              }}
            >
              {index === 0 && (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    transform: getHeadRotation(),
                    transition: "transform 0.15s ease",
                  }}
                >
                  {/* Eyes */}
                  <div
                    style={{
                      position: "absolute",
                      width: Math.max(3, cellSize * 0.2),
                      height: Math.max(3, cellSize * 0.2),
                      background: "white",
                      borderRadius: "50%",
                      top: Math.max(2, cellSize * 0.12),
                      left: Math.max(2, cellSize * 0.12),
                      boxShadow: "0 0 6px rgba(255,255,255,0.5)",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        width: Math.max(2, cellSize * 0.12),
                        height: Math.max(2, cellSize * 0.12),
                        background: "#1a1a1a",
                        borderRadius: "50%",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      width: Math.max(3, cellSize * 0.2),
                      height: Math.max(3, cellSize * 0.2),
                      background: "white",
                      borderRadius: "50%",
                      top: Math.max(2, cellSize * 0.12),
                      right: Math.max(2, cellSize * 0.12),
                      boxShadow: "0 0 6px rgba(255,255,255,0.5)",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        width: Math.max(2, cellSize * 0.12),
                        height: Math.max(2, cellSize * 0.12),
                        background: "#1a1a1a",
                        borderRadius: "50%",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                  </div>

                  {/* Tongue */}
                  {!gameOver && !isPaused && cellSize > 12 && (
                    <>
                      <div
                        style={{
                          position: "absolute",
                          width: Math.max(1, cellSize * 0.08),
                          height: Math.max(8, cellSize * 0.5),
                          background: "linear-gradient(to bottom, #ef4444, #dc2626)",
                          left: "50%",
                          top: -Math.max(8, cellSize * 0.5),
                          transform: "translateX(-50%)",
                          borderRadius: "0 0 3px 3px",
                          animation: "tongueMove 0.4s ease-in-out infinite alternate",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          width: Math.max(1, cellSize * 0.06),
                          height: Math.max(4, cellSize * 0.25),
                          background: "#ef4444",
                          left: `calc(50% - ${Math.max(2, cellSize * 0.12)}px)`,
                          top: -Math.max(10, cellSize * 0.6),
                          transform: "rotate(-25deg)",
                          borderRadius: "0 0 2px 2px",
                          animation: "tongueFork 0.4s ease-in-out infinite alternate",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          width: Math.max(1, cellSize * 0.06),
                          height: Math.max(4, cellSize * 0.25),
                          background: "#ef4444",
                          left: `calc(50% + ${Math.max(1, cellSize * 0.06)}px)`,
                          top: -Math.max(10, cellSize * 0.6),
                          transform: "rotate(25deg)",
                          borderRadius: "0 0 2px 2px",
                          animation: "tongueFork 0.4s ease-in-out infinite alternate 0.05s",
                        }}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Stones */}
          {stones.map((stone, index) => (
            <div
              key={`stone-${index}`}
              style={{
                position: "absolute",
                width: cellSize - 4,
                height: cellSize - 4,
                borderRadius: "40% 40% 50% 50%",
                background: "linear-gradient(145deg, #64748b, #334155)",
                boxShadow: `
                  inset -${Math.max(2, cellSize * 0.12)}px -${Math.max(2, cellSize * 0.12)}px ${Math.max(4, cellSize * 0.2)}px rgba(0,0,0,0.6),
                  inset ${Math.max(2, cellSize * 0.12)}px ${Math.max(2, cellSize * 0.12)}px ${Math.max(4, cellSize * 0.2)}px rgba(255,255,255,0.1),
                  0 ${Math.max(2, cellSize * 0.12)}px ${Math.max(8, cellSize * 0.4)}px rgba(0,0,0,0.4)
                `,
                left: stone[0] * cellSize + 2,
                top: stone[1] * cellSize + 2,
                opacity: isPaused ? 0.5 : 1,
                transition: "opacity 0.3s",
                zIndex: 1,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  width: "30%",
                  height: "20%",
                  background: "linear-gradient(135deg, rgba(255,255,255,0.1), transparent)",
                  borderRadius: "50%",
                  top: "15%",
                  left: "20%",
                }}
              />
            </div>
          ))}

          {/* Food */}
          <div
            style={{
              position: "absolute",
              width: cellSize - 4,
              height: cellSize - 4,
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 30%, #fca5a5, #dc2626 60%, #991b1b)",
              boxShadow: `
                0 0 ${Math.max(20, cellSize * 1)}px rgba(239,68,68,0.8),
                0 0 ${Math.max(40, cellSize * 2)}px rgba(239,68,68,0.4),
                inset 0 -${Math.max(2, cellSize * 0.12)}px ${Math.max(6, cellSize * 0.25)}px rgba(0,0,0,0.3),
                inset 0 ${Math.max(2, cellSize * 0.12)}px ${Math.max(6, cellSize * 0.25)}px rgba(255,255,255,0.2)
              `,
              left: food[0] * cellSize + 2,
              top: food[1] * cellSize + 2,
              opacity: isPaused ? 0.5 : 1,
              transition: "opacity 0.3s",
              animation: "foodPulse 1s ease-in-out infinite",
              zIndex: 2,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: Math.max(8, cellSize * 0.4),
            }}
          >
            {getFoodEmoji()}
          </div>

          {/* Power-Up */}
          {powerUp && (
            <div
              style={{
                position: "absolute",
                width: cellSize - 4,
                height: cellSize - 4,
                borderRadius: "50%",
                background: powerUp.type === '⭐' ? 'radial-gradient(circle, #fbbf24, #f59e0b)' :
                           powerUp.type === '🛡️' ? 'radial-gradient(circle, #60a5fa, #3b82f6)' :
                           powerUp.type === '⚡' ? 'radial-gradient(circle, #f472b6, #ec4899)' :
                           'radial-gradient(circle, #a78bfa, #8b5cf6)',
                boxShadow: `0 0 ${Math.max(20, cellSize * 1)}px ${powerUp.type === '⭐' ? 'rgba(251,191,36,0.8)' :
                              powerUp.type === '🛡️' ? 'rgba(96,165,250,0.8)' :
                              powerUp.type === '⚡' ? 'rgba(244,114,182,0.8)' :
                              'rgba(167,139,250,0.8)'}`,
                left: powerUp.position[0] * cellSize + 2,
                top: powerUp.position[1] * cellSize + 2,
                opacity: isPaused ? 0.5 : 1,
                transition: "opacity 0.3s",
                animation: "powerUpPulse 1s ease-in-out infinite",
                zIndex: 3,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: Math.max(10, cellSize * 0.5),
              }}
            >
              {powerUp.type}
            </div>
          )}

          {/* Pause Overlay */}
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
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(6px)",
                zIndex: 10,
              }}
            >
              <div
                style={{
                  fontSize: Math.max(40, cellSize * 2),
                  fontWeight: "bold",
                  color: "white",
                  textShadow: "0 0 40px rgba(0,0,0,0.9)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              >
                ⏸
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: windowWidth < 500 ? "12px" : "16px",
            gap: windowWidth < 500 ? "8px" : "12px",
            flexWrap: "wrap",
          }}
        >
          <p
            style={{
              margin: 0,
              opacity: 0.6,
              fontSize: windowWidth < 500 ? "0.6rem" : "0.8rem",
            }}
          >
            {windowWidth < 500 ? '↑↓←→ • Space' : '↑ ↓ ← → to move • Space to pause'}
          </p>
          <div
            style={{
              display: "flex",
              gap: windowWidth < 500 ? "4px" : "8px",
              alignItems: "center",
              fontSize: windowWidth < 500 ? "0.6rem" : "0.75rem",
              opacity: 0.5,
              flexWrap: "wrap",
            }}
          >
            <span>📦 {snake.length}</span>
            <span>•</span>
            <span>🪨 {stones.length}</span>
            <span>•</span>
            <span>🎯 {gridSize * gridSize - snake.length - stones.length}</span>
            <span>•</span>
            <span>🔓 {unlockedLevels.length}/6</span>
            <span>•</span>
            <span>🏆 {achievements.length}</span>
          </div>
        </div>

        {/* Touch Controls */}
        {showTouchControls && windowWidth < 768 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: windowWidth < 500 ? "10px" : "20px",
              marginTop: windowWidth < 500 ? "12px" : "16px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: windowWidth < 500 ? "40px 40px 40px" : "50px 50px 50px", 
              gap: "4px" 
            }}>
              <div></div>
              <button
                onTouchStart={() => setDirection(prev => prev[1] === 1 ? prev : [0, -1])}
                style={{
                  padding: windowWidth < 500 ? "8px" : "12px",
                  borderRadius: 8,
                  border: "none",
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontSize: windowWidth < 500 ? "1rem" : "1.5rem",
                  cursor: "pointer",
                  backdropFilter: "blur(10px)",
                  touchAction: "none",
                }}
              >
                ⬆️
              </button>
              <div></div>
              <button
                onTouchStart={() => setDirection(prev => prev[0] === 1 ? prev : [-1, 0])}
                style={{
                  padding: windowWidth < 500 ? "8px" : "12px",
                  borderRadius: 8,
                  border: "none",
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontSize: windowWidth < 500 ? "1rem" : "1.5rem",
                  cursor: "pointer",
                  backdropFilter: "blur(10px)",
                  touchAction: "none",
                }}
              >
                ⬅️
              </button>
              <button
                onTouchStart={() => setDirection(prev => prev[1] === -1 ? prev : [0, 1])}
                style={{
                  padding: windowWidth < 500 ? "8px" : "12px",
                  borderRadius: 8,
                  border: "none",
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontSize: windowWidth < 500 ? "1rem" : "1.5rem",
                  cursor: "pointer",
                  backdropFilter: "blur(10px)",
                  touchAction: "none",
                }}
              >
                ⬇️
              </button>
              <button
                onTouchStart={() => setDirection(prev => prev[0] === -1 ? prev : [1, 0])}
                style={{
                  padding: windowWidth < 500 ? "8px" : "12px",
                  borderRadius: 8,
                  border: "none",
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontSize: windowWidth < 500 ? "1rem" : "1.5rem",
                  cursor: "pointer",
                  backdropFilter: "blur(10px)",
                  touchAction: "none",
                }}
              >
                ➡️
              </button>
            </div>
          </div>
        )}
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
            transform: scale(1.08);
            box-shadow: 0 0 40px rgba(239,68,68,1), 0 0 80px rgba(239,68,68,0.5);
          }
        }
        @keyframes powerUpPulse {
          0%, 100% { 
            transform: scale(1) rotate(0deg);
          }
          50% { 
            transform: scale(1.2) rotate(180deg);
          }
        }
        @keyframes tongueMove {
          0% { transform: translateX(-50%) scaleY(1); }
          100% { transform: translateX(-50%) scaleY(1.3); }
        }
        @keyframes tongueFork {
          0% { transform: rotate(-25deg) scaleY(1); }
          100% { transform: rotate(-30deg) scaleY(1.2); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
