"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

// Level configuration with animal themes and speed scaling
const LEVEL_CONFIG = {
  1: {
    stones: 0,
    speed: "Slow",
    label: "Level 1 - Snake",
    nextLevelScore: 10,
    color: "#22c55e",
    speedMs: 300,
    animal: "snake",
    animalEmoji: "🐍",
    animalName: "Snake",
    speedMultiplier: 1
  },
  2: {
    stones: 3,
    speed: "Normal",
    label: "Level 2 - Cat",
    nextLevelScore: 25,
    color: "#f59e0b",
    speedMs: 200,
    animal: "cat",
    animalEmoji: "🐱",
    animalName: "Cat",
    speedMultiplier: 1.5
  },
  3: {
    stones: 6,
    speed: "Fast",
    label: "Level 3 - Dog",
    nextLevelScore: 45,
    color: "#8b5cf6",
    speedMs: 130,
    animal: "dog",
    animalEmoji: "🐶",
    animalName: "Dog",
    speedMultiplier: 2.3
  },
  4: {
    stones: 10,
    speed: "Turbo",
    label: "Level 4 - Fox",
    nextLevelScore: 70,
    color: "#f97316",
    speedMs: 80,
    animal: "fox",
    animalEmoji: "🦊",
    animalName: "Fox",
    speedMultiplier: 3.75
  },
  5: {
    stones: 15,
    speed: "Turbo",
    label: "Level 5 - Dragon",
    nextLevelScore: 100,
    color: "#ef4444",
    speedMs: 50,
    animal: "dragon",
    animalEmoji: "🐉",
    animalName: "Dragon",
    speedMultiplier: 6
  },
  6: {
    stones: 20,
    speed: "Legend",
    label: "Level 6 - Legend",
    nextLevelScore: null,
    color: "#8b5cf6",
    speedMs: 30,
    animal: "legend",
    animalEmoji: "👑",
    animalName: "Legend",
    speedMultiplier: 10
  },
};

// Animal theme colors
const ANIMAL_COLORS = {
  snake: { background: 'linear-gradient(135deg,#4ade80,#22c55e)', color: '#22c55e' },
  cat: { background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', color: '#f59e0b' },
  dog: { background: 'linear-gradient(135deg,#a78bfa,#8b5cf6)', color: '#8b5cf6' },
  fox: { background: 'linear-gradient(135deg,#fb923c,#f97316)', color: '#f97316' },
  dragon: { background: 'linear-gradient(135deg,#f87171,#ef4444)', color: '#ef4444' },
  legend: { background: 'linear-gradient(135deg,#facc15,#f59e0b)', color: '#f59e0b' },
};

export default function SnakeGame() {
  // Game State
  const [snake, setSnake] = useState([]);
  const [food, setFood] = useState([]);
  const [direction, setDirection] = useState([1, 0]);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [stones, setStones] = useState([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [showRules, setShowRules] = useState(false);
  const [unlockedLevels, setUnlockedLevels] = useState([1]);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [nextLevelScore, setNextLevelScore] = useState(10);
  const [currentAnimal, setCurrentAnimal] = useState("snake");
  const [currentSpeed, setCurrentSpeed] = useState(300);

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
  const [foodSkin, setFoodSkin] = useState("classic");

  // Touch Controls
  const [touchStart, setTouchStart] = useState(null);
  const [showTouchControls, setShowTouchControls] = useState(false);

  // Responsive - Dynamic sizing
  const [windowWidth, setWindowWidth] = useState(1024);
  const [windowHeight, setWindowHeight] = useState(768);
  const [gridSize, setGridSize] = useState(25);
  const [cellSize, setCellSize] = useState(24);
  const [isMobile, setIsMobile] = useState(false);

  // Sound
  const audioContext = useRef(null);

  const directionRef = useRef(direction);
  const gameLoopRef = useRef(null);

  // Responsive grid sizing - OPTIMIZED FOR DESKTOP
  useEffect(() => {
    const calculateSizes = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setWindowWidth(width);
      setWindowHeight(height);

      // Determine if mobile
      const mobile = width < 768;
      setIsMobile(mobile);

      // Calculate available space
      const headerHeight = mobile ? 50 : 100;
      const footerHeight = mobile ? 30 : 60;
      const padding = mobile ? 12 : 40;
      const controlsHeight = mobile && showTouchControls ? 50 : 0;
      const modalBuffer = 20;

      const availableHeight = height - headerHeight - footerHeight - padding * 2 - controlsHeight - modalBuffer;
      const availableWidth = width - padding * 2 - 40;

      // Max board size - LARGER FOR DESKTOP
      let maxBoardSize;
      if (mobile) {
        maxBoardSize = Math.min(availableWidth, availableHeight, 400);
      } else {
        maxBoardSize = Math.min(availableWidth, availableHeight, 650);
      }

      // Determine grid and cell sizes based on device
      let newGridSize, newCellSize;

      if (mobile) {
        // Mobile: smaller grids
        if (width < 360) {
          newGridSize = 14;
        } else if (width < 400) {
          newGridSize = 16;
        } else if (width < 450) {
          newGridSize = 18;
        } else if (width < 550) {
          newGridSize = 20;
        } else {
          newGridSize = 22;
        }
      } else {
        // Desktop: larger grids
        if (width < 768) {
          newGridSize = 22;
        } else if (width < 1024) {
          newGridSize = 24;
        } else {
          newGridSize = 25;
        }
      }

      // Calculate cell size based on available space
      newCellSize = Math.floor((maxBoardSize - 10) / newGridSize);

      // Ensure minimum and maximum sizes
      newCellSize = Math.max(14, Math.min(newCellSize, 32));

      // Adjust grid size if cell size is too small
      while (newCellSize < 14 && newGridSize > 10) {
        newGridSize--;
        newCellSize = Math.floor((maxBoardSize - 10) / newGridSize);
      }

      setGridSize(newGridSize);
      setCellSize(newCellSize);
    };

    calculateSizes();
    window.addEventListener('resize', calculateSizes);

    // Detect touch device
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      setShowTouchControls(true);
    }

    return () => window.removeEventListener('resize', calculateSizes);
  }, []);

  // Initialize game on mount and when grid changes
  useEffect(() => {
    if (gridSize > 0) {
      const center = Math.floor(gridSize / 2);
      const initialSnake = [[center, center]];
      const initialFood = [center + 3, center];
      setSnake(initialSnake);
      setFood(initialFood);
      setDirection([1, 0]);
      directionRef.current = [1, 0];
      setScore(0);
      setLevel(1);
      setGameOver(false);
      setGameWon(false);
      setIsPaused(false);
      setShowLevelComplete(false);
      setNextLevelScore(10);
      setCurrentAnimal("snake");
      setCurrentSpeed(300);
      setPowerUp(null);
      setPowerUpActive(null);
      setPowerUpTimer(0);
      generateStones(initialSnake, initialFood, 1);
    }
  }, [gridSize]);

  // Get current level config based on score
  const getLevelConfig = useCallback((scoreValue) => {
    if (scoreValue < 10) return { ...LEVEL_CONFIG[1], level: 1 };
    if (scoreValue < 25) return { ...LEVEL_CONFIG[2], level: 2 };
    if (scoreValue < 45) return { ...LEVEL_CONFIG[3], level: 3 };
    if (scoreValue < 70) return { ...LEVEL_CONFIG[4], level: 4 };
    if (scoreValue < 100) return { ...LEVEL_CONFIG[5], level: 5 };
    return { ...LEVEL_CONFIG[6], level: 6 };
  }, []);

  // Get animal emoji for current level
  const getAnimalEmoji = () => {
    const config = getLevelConfig(score);
    return config.animalEmoji || "🐍";
  };

  const getAnimalName = () => {
    const config = getLevelConfig(score);
    return config.animalName || "Snake";
  };

  const getAnimalColor = () => {
    const config = getLevelConfig(score);
    return ANIMAL_COLORS[config.animal] || ANIMAL_COLORS.snake;
  };

  const getSpeedDisplay = () => {
    const config = getLevelConfig(score);
    return config.speed || "Slow";
  };

  const getSpeedMultiplier = () => {
    const config = getLevelConfig(score);
    return config.speedMultiplier || 1;
  };

  // Achievement definitions
  const ACHIEVEMENTS = {
    FIRST_BITE: { id: 'first_bite', name: 'First Bite', desc: 'Eat your first food', icon: '🍎', unlocked: false },
    SNAKE_CHARMER: { id: 'snake_charmer', name: 'Snake Charmer', desc: 'Reach length 10', icon: '🐍', unlocked: false },
    STONE_DODGER: { id: 'stone_dodger', name: 'Stone Dodger', desc: 'Avoid 10 stones', icon: '🪨', unlocked: false },
    MASTER_OF_SNAKE: { id: 'master_of_snake', name: 'Master of Snake', desc: 'Reach score 100', icon: '👑', unlocked: false },
    POWER_USER: { id: 'power_user', name: 'Power User', desc: 'Collect 5 power-ups', icon: '💪', unlocked: false },
    LEVEL_MASTER: { id: 'level_master', name: 'Level Master', desc: 'Reach Level 6', icon: '🏆', unlocked: false },
    ANIMAL_COLLECTOR: { id: 'animal_collector', name: 'Animal Collector', desc: 'Collect all animal themes', icon: '🐾', unlocked: false },
    SPEED_DEMON: { id: 'speed_demon', name: 'Speed Demon', desc: 'Reach Level 6 speed', icon: '⚡', unlocked: false },
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
      } catch (e) { }
    }

    const savedAchievements = localStorage.getItem("snakeAchievements");
    if (savedAchievements) {
      try {
        setAchievements(JSON.parse(savedAchievements));
      } catch (e) { }
    }

    const savedStats = localStorage.getItem("snakeStats");
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (e) { }
    }

    const savedTheme = localStorage.getItem("snakeTheme");
    if (savedTheme) setTheme(savedTheme);

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
  }, [unlockedLevels, achievements, stats, theme]);

  // Update best score
  useEffect(() => {
    if (score > bestScore && !gameOver && !gameWon) {
      setBestScore(score);
      localStorage.setItem("snakeBestScore", String(score));
    }
  }, [score, bestScore, gameOver, gameWon]);

  // Generate stones
  const generateStones = useCallback((snakePositions, foodPosition, currentLevel) => {
    const config = getLevelConfig(currentLevel === 1 ? 0 : (currentLevel - 1) * 15 + 5);
    const numStones = config.stones || 0;
    const newStones = [];

    if (numStones === 0) {
      setStones([]);
      return;
    }

    const occupied = new Set();
    snakePositions.forEach(pos => occupied.add(`${pos[0]},${pos[1]}`));
    occupied.add(`${foodPosition[0]},${foodPosition[1]}`);

    let attempts = 0;
    const maxAttempts = 5000;

    while (newStones.length < numStones && attempts < maxAttempts) {
      attempts++;
      const stone = [
        Math.floor(Math.random() * gridSize),
        Math.floor(Math.random() * gridSize),
      ];
      const key = `${stone[0]},${stone[1]}`;

      if (!occupied.has(key)) {
        newStones.push(stone);
        occupied.add(key);
      }
    }

    setStones(newStones);
  }, [gridSize, getLevelConfig]);

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

      switch (type) {
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
    } catch (e) { }
  }, []);

  // Generate power-ups
  const generatePowerUp = (snakePos, foodPos, currentStones) => {
    if (Math.random() > 0.15 || powerUp) return;

    const types = ['⭐', '🛡️', '⚡', '💫'];
    const type = types[Math.floor(Math.random() * types.length)];
    let position;
    let attempts = 0;

    const occupied = new Set();
    snakePos.forEach(pos => occupied.add(`${pos[0]},${pos[1]}`));
    occupied.add(`${foodPos[0]},${foodPos[1]}`);
    currentStones.forEach(stone => occupied.add(`${stone[0]},${stone[1]}`));

    do {
      position = [
        Math.floor(Math.random() * gridSize),
        Math.floor(Math.random() * gridSize),
      ];
      attempts++;
    } while (
      occupied.has(`${position[0]},${position[1]}`) &&
      attempts < 1000
    );

    if (!occupied.has(`${position[0]},${position[1]}`)) {
      setPowerUp({ type, position, spawnTime: Date.now() });
    }
  };

  const getSpeedDelay = useCallback(() => {
    const config = getLevelConfig(score);
    let baseSpeed = config.speedMs || 300;

    if (powerUpActive === 'speed') return Math.max(20, baseSpeed * 0.3);
    if (powerUpActive === 'slow') return Math.min(400, baseSpeed * 2);

    return baseSpeed;
  }, [score, getLevelConfig, powerUpActive]);

  // Check achievements
  const checkAchievements = useCallback((type, data) => {
    const newAchievements = [...achievements];
    let unlocked = false;

    switch (type) {
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
      case 'animal':
        if (!newAchievements.find(a => a.id === 'animal_collector')) {
          newAchievements.push({ ...ACHIEVEMENTS.ANIMAL_COLLECTOR, unlocked: true, unlockedAt: new Date().toISOString() });
          unlocked = true;
        }
        break;
      case 'speed':
        if (!newAchievements.find(a => a.id === 'speed_demon')) {
          newAchievements.push({ ...ACHIEVEMENTS.SPEED_DEMON, unlocked: true, unlockedAt: new Date().toISOString() });
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
  }, [achievements, score, snake.length, stats.stonesAvoided, level, playSound]);

  const restartGame = useCallback(() => {
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
    setCurrentAnimal("snake");
    setCurrentSpeed(300);
    setPowerUp(null);
    setPowerUpActive(null);
    setPowerUpTimer(0);
    setShowLevelComplete(false);
    directionRef.current = [1, 0];
    generateStones(initialSnake, initialFood, 1);
    setStats(prev => ({ ...prev, totalGames: prev.totalGames + 1 }));
  }, [gridSize, generateStones]);

  const generateFood = useCallback((currentSnake, currentStones) => {
    let newFood;
    let attempts = 0;
    const occupied = new Set();
    currentSnake.forEach(seg => occupied.add(`${seg[0]},${seg[1]}`));
    currentStones.forEach(stone => occupied.add(`${stone[0]},${stone[1]}`));
    if (powerUp) occupied.add(`${powerUp.position[0]},${powerUp.position[1]}`);

    do {
      newFood = [
        Math.floor(Math.random() * gridSize),
        Math.floor(Math.random() * gridSize),
      ];
      attempts++;
    } while (
      occupied.has(`${newFood[0]},${newFood[1]}`) &&
      attempts < 1000
    );
    setFood(newFood);
  }, [gridSize, powerUp]);

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
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPaused, gameOver, gameWon, showLevelComplete]);

  // Update level based on score - NO POPUP VERSION
  useEffect(() => {
    if (snake.length === 0) return;

    const config = getLevelConfig(score);
    const newLevel = config.level || 1;
    const newSpeed = config.speedMs || 300;

    if (newLevel !== level && !gameOver) {
      setLevel(newLevel);
      setNextLevelScore(config.nextLevelScore);
      setCurrentAnimal(config.animal);
      setCurrentSpeed(newSpeed);

      if (newLevel === 6) {
        checkAchievements('speed', {});
      }

      // Check if level is newly unlocked - NO POPUP
      if (!unlockedLevels.includes(newLevel)) {
        setUnlockedLevels(prev => [...prev, newLevel]);
        // Removed: setShowLevelComplete(true);
        // Removed: playSound('levelcomplete');

        setStats(prev => ({
          ...prev,
          levelsCompleted: prev.levelsCompleted + 1,
        }));

        checkAchievements('level', { perfect: !gameOver });

        // Check animal collector achievement
        const animals = new Set();
        [...unlockedLevels, newLevel].forEach(lvl => {
          if (LEVEL_CONFIG[lvl]) animals.add(LEVEL_CONFIG[lvl].animal);
        });
        if (animals.size >= 5) {
          checkAchievements('animal', {});
        }
      }

      // Regenerate stones for new level
      const currentSnake = snake.length > 0 ? snake : [[Math.floor(gridSize / 2), Math.floor(gridSize / 2)]];
      const currentFood = food || [Math.floor(gridSize / 2) + 3, Math.floor(gridSize / 2)];
      generateStones(currentSnake, currentFood, newLevel);
    }
  }, [score, level, gameOver, unlockedLevels, gridSize, food, snake, generateStones, checkAchievements, getLevelConfig]);

  // Game loop
  useEffect(() => {
    if (gameOver || isPaused || gameWon || showLevelComplete || snake.length === 0 || gridSize === 0) {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    gameLoopRef.current = setInterval(() => {
      setSnake((prevSnake) => {
        if (prevSnake.length === 0) return prevSnake;

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
          (segment, index) => index > 0 && segment[0] === newHead[0] && segment[1] === newHead[1]
        );

        if (hitSelf && powerUpActive !== 'invincible') {
          setGameOver(true);
          playSound('gameover');
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Food collision - ONLY +1 point
        if (food && newHead[0] === food[0] && newHead[1] === food[1]) {
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
  }, [direction, food, gameOver, isPaused, gameWon, stones, showLevelComplete, powerUp, powerUpActive, gridSize, playSound, checkAchievements, getSpeedDelay, generateFood, generatePowerUp]);

  const getHeadRotation = () => {
    if (direction[0] === 1) return "rotate(90deg)";
    if (direction[0] === -1) return "rotate(-90deg)";
    if (direction[1] === 1) return "rotate(180deg)";
    return "rotate(0deg)";
  };

  const getLevelColor = (lvl) => {
    const config = LEVEL_CONFIG[lvl];
    return config ? config.color : "#22c55e";
  };

  const getFoodEmoji = () => {
    switch (foodSkin) {
      case 'candy': return '🍬';
      case 'fruit': return '🍎';
      case 'star': return '⭐';
      case 'heart': return '❤️';
      case 'fish': return '🐟';
      default: return '🍎';
    }
  };

  const config = getLevelConfig(score);
  const animalColors = getAnimalColor();

  // Render animal head with realistic features
  const renderAnimalHead = (segment, index) => {
    const isHead = index === 0;
    const animal = getAnimalConfig();

    if (!isHead) {
      return (
        <div
          key={index}
          style={{
            position: "absolute",
            width: cellSize - 2,
            height: cellSize - 2,
            borderRadius: Math.max(3, cellSize * 0.2),
            background: getBodyColor(index),
            boxShadow: `0 ${cellSize * 0.1}px ${cellSize * 0.3}px rgba(0,0,0,0.3)`,
            left: segment[0] * cellSize + 1,
            top: segment[1] * cellSize + 1,
            opacity: isPaused ? 0.5 : 1,
            transition: "opacity 0.3s, transform 0.15s",
            zIndex: 2,
          }}
        />
      );
    }

    return (
      <div
        key={index}
        style={{
          position: "absolute",
          width: cellSize - 2,
          height: cellSize - 2,
          borderRadius: Math.max(6, cellSize * 0.4),
          background: animalColors.background,
          boxShadow: `0 0 ${cellSize}px rgba(34,197,94,0.6), inset 0 0 ${cellSize * 0.5}px rgba(255,255,255,0.2)`,
          left: segment[0] * cellSize + 1,
          top: segment[1] * cellSize + 1,
          opacity: isPaused ? 0.5 : 1,
          transition: "opacity 0.3s, transform 0.15s",
          transform: "scale(1.05)",
          zIndex: 2,
          border: powerUpActive === 'invincible' ? `2px solid #facc15` : "none",
          overflow: "visible",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            transform: getHeadRotation(),
            transition: "transform 0.15s ease",
          }}
        >
          {renderAnimalFeatures(animal)}

          {/* Eyes */}
          <div
            style={{
              position: "absolute",
              width: Math.max(4, cellSize * 0.25),
              height: Math.max(4, cellSize * 0.25),
              background: "white",
              borderRadius: "50%",
              top: Math.max(2, cellSize * 0.1),
              left: Math.max(2, cellSize * 0.1),
              boxShadow: "0 0 6px rgba(255,255,255,0.5)",
              border: "1px solid rgba(0,0,0,0.1)",
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
              width: Math.max(4, cellSize * 0.25),
              height: Math.max(4, cellSize * 0.25),
              background: "white",
              borderRadius: "50%",
              top: Math.max(2, cellSize * 0.1),
              right: Math.max(2, cellSize * 0.1),
              boxShadow: "0 0 6px rgba(255,255,255,0.5)",
              border: "1px solid rgba(0,0,0,0.1)",
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
        </div>
      </div>
    );
  };

  const getAnimalConfig = () => {
    const config = getLevelConfig(score);
    return config.animal;
  };

  const getBodyColor = (index) => {
    const animal = getAnimalConfig();
    const baseColors = {
      snake: `hsl(${140 + index * 0.5}, 70%, ${45 - index * 0.3}%)`,
      cat: `hsl(${45 + index * 0.3}, 80%, ${55 - index * 0.3}%)`,
      dog: `hsl(${260 + index * 0.3}, 70%, ${50 - index * 0.3}%)`,
      fox: `hsl(${25 + index * 0.3}, 80%, ${50 - index * 0.3}%)`,
      dragon: `hsl(${0 + index * 0.3}, 80%, ${45 - index * 0.3}%)`,
      legend: `hsl(${45 + index * 0.3}, 90%, ${55 - index * 0.3}%)`,
    };
    return baseColors[animal] || baseColors.snake;
  };

  const renderAnimalFeatures = (animal) => {
    const size = cellSize;

    switch (animal) {
      case 'cat':
        return (
          <>
            <div style={{
              position: 'absolute',
              width: size * 0.35,
              height: size * 0.35,
              background: '#f59e0b',
              top: -size * 0.15,
              left: -size * 0.05,
              clipPath: 'polygon(0% 100%, 50% 0%, 100% 100%)',
              transform: 'rotate(-15deg)',
              boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.2)',
            }}>
              <div style={{
                position: 'absolute',
                width: '40%',
                height: '40%',
                background: '#fcd34d',
                bottom: '20%',
                left: '30%',
                clipPath: 'polygon(0% 100%, 50% 0%, 100% 100%)',
              }} />
            </div>
            <div style={{
              position: 'absolute',
              width: size * 0.35,
              height: size * 0.35,
              background: '#f59e0b',
              top: -size * 0.15,
              right: -size * 0.05,
              clipPath: 'polygon(0% 100%, 50% 0%, 100% 100%)',
              transform: 'rotate(15deg)',
              boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.2)',
            }}>
              <div style={{
                position: 'absolute',
                width: '40%',
                height: '40%',
                background: '#fcd34d',
                bottom: '20%',
                right: '30%',
                clipPath: 'polygon(0% 100%, 50% 0%, 100% 100%)',
              }} />
            </div>
            <div style={{
              position: 'absolute',
              width: size * 0.3,
              height: 1,
              background: '#92400e',
              top: '40%',
              left: -size * 0.1,
              transform: 'rotate(-10deg)',
              opacity: 0.5,
            }} />
            <div style={{
              position: 'absolute',
              width: size * 0.3,
              height: 1,
              background: '#92400e',
              top: '50%',
              left: -size * 0.1,
              opacity: 0.5,
            }} />
            <div style={{
              position: 'absolute',
              width: size * 0.3,
              height: 1,
              background: '#92400e',
              top: '60%',
              left: -size * 0.1,
              transform: 'rotate(10deg)',
              opacity: 0.5,
            }} />
            <div style={{
              position: 'absolute',
              width: size * 0.3,
              height: 1,
              background: '#92400e',
              top: '40%',
              right: -size * 0.1,
              transform: 'rotate(10deg)',
              opacity: 0.5,
            }} />
            <div style={{
              position: 'absolute',
              width: size * 0.3,
              height: 1,
              background: '#92400e',
              top: '50%',
              right: -size * 0.1,
              opacity: 0.5,
            }} />
            <div style={{
              position: 'absolute',
              width: size * 0.3,
              height: 1,
              background: '#92400e',
              top: '60%',
              right: -size * 0.1,
              transform: 'rotate(-10deg)',
              opacity: 0.5,
            }} />
            <div style={{
              position: 'absolute',
              width: size * 0.1,
              height: size * 0.08,
              background: '#ef4444',
              borderRadius: '50%',
              bottom: '20%',
              left: '50%',
              transform: 'translateX(-50%)',
            }} />
          </>
        );

      case 'dog':
        return (
          <>
            <div style={{
              position: 'absolute',
              width: size * 0.3,
              height: size * 0.4,
              background: '#7c3aed',
              top: -size * 0.05,
              left: -size * 0.1,
              borderRadius: '0 0 50% 50%',
              transform: 'rotate(-20deg)',
              boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.2)',
            }}>
              <div style={{
                position: 'absolute',
                width: '60%',
                height: '30%',
                background: '#8b5cf6',
                bottom: '10%',
                left: '20%',
                borderRadius: '50%',
              }} />
            </div>
            <div style={{
              position: 'absolute',
              width: size * 0.3,
              height: size * 0.4,
              background: '#7c3aed',
              top: -size * 0.05,
              right: -size * 0.1,
              borderRadius: '0 0 50% 50%',
              transform: 'rotate(20deg)',
              boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.2)',
            }}>
              <div style={{
                position: 'absolute',
                width: '60%',
                height: '30%',
                background: '#8b5cf6',
                bottom: '10%',
                right: '20%',
                borderRadius: '50%',
              }} />
            </div>
            <div style={{
              position: 'absolute',
              width: size * 0.25,
              height: size * 0.15,
              background: '#7c3aed',
              borderRadius: '50%',
              bottom: '15%',
              left: '50%',
              transform: 'translateX(-50%)',
              boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2)',
            }}>
              <div style={{
                position: 'absolute',
                width: size * 0.06,
                height: size * 0.05,
                background: '#1a1a1a',
                borderRadius: '50%',
                bottom: '20%',
                left: '30%',
              }} />
              <div style={{
                position: 'absolute',
                width: size * 0.06,
                height: size * 0.05,
                background: '#1a1a1a',
                borderRadius: '50%',
                bottom: '20%',
                right: '30%',
              }} />
            </div>
            {!gameOver && !isPaused && cellSize > 12 && (
              <div style={{
                position: 'absolute',
                width: size * 0.08,
                height: size * 0.15,
                background: '#ef4444',
                borderRadius: '0 0 50% 50%',
                bottom: -size * 0.05,
                left: '50%',
                transform: 'translateX(-50%)',
                animation: 'tongueWag 0.5s ease-in-out infinite alternate',
              }} />
            )}
          </>
        );

      case 'fox':
        return (
          <>
            <div style={{
              position: 'absolute',
              width: size * 0.3,
              height: size * 0.5,
              background: '#f97316',
              top: -size * 0.25,
              left: -size * 0.05,
              clipPath: 'polygon(0% 100%, 50% 0%, 100% 100%)',
              transform: 'rotate(-20deg)',
              boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.2)',
            }}>
              <div style={{
                position: 'absolute',
                width: '50%',
                height: '30%',
                background: '#fbbf24',
                bottom: '20%',
                left: '25%',
                clipPath: 'polygon(0% 100%, 50% 0%, 100% 100%)',
              }} />
            </div>
            <div style={{
              position: 'absolute',
              width: size * 0.3,
              height: size * 0.5,
              background: '#f97316',
              top: -size * 0.25,
              right: -size * 0.05,
              clipPath: 'polygon(0% 100%, 50% 0%, 100% 100%)',
              transform: 'rotate(20deg)',
              boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.2)',
            }}>
              <div style={{
                position: 'absolute',
                width: '50%',
                height: '30%',
                background: '#fbbf24',
                bottom: '20%',
                right: '25%',
                clipPath: 'polygon(0% 100%, 50% 0%, 100% 100%)',
              }} />
            </div>
            <div style={{
              position: 'absolute',
              width: size * 0.2,
              height: size * 0.12,
              background: '#fb923c',
              borderRadius: '50%',
              bottom: '20%',
              left: '50%',
              transform: 'translateX(-50%)',
            }}>
              <div style={{
                position: 'absolute',
                width: size * 0.05,
                height: size * 0.04,
                background: '#1a1a1a',
                borderRadius: '50%',
                bottom: '20%',
                left: '30%',
              }} />
              <div style={{
                position: 'absolute',
                width: size * 0.05,
                height: size * 0.04,
                background: '#1a1a1a',
                borderRadius: '50%',
                bottom: '20%',
                right: '30%',
              }} />
            </div>
            <div style={{
              position: 'absolute',
              width: size * 0.4,
              height: size * 0.2,
              background: '#fef3c7',
              borderRadius: '50%',
              bottom: '10%',
              left: '50%',
              transform: 'translateX(-50%)',
              opacity: 0.4,
            }} />
          </>
        );

      case 'dragon':
        return (
          <>
            <div style={{
              position: 'absolute',
              width: size * 0.15,
              height: size * 0.4,
              background: '#dc2626',
              top: -size * 0.2,
              left: -size * 0.05,
              clipPath: 'polygon(0% 0%, 100% 100%, 0% 100%)',
              transform: 'rotate(-30deg)',
              boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.2)',
            }} />
            <div style={{
              position: 'absolute',
              width: size * 0.15,
              height: size * 0.4,
              background: '#dc2626',
              top: -size * 0.2,
              right: -size * 0.05,
              clipPath: 'polygon(100% 0%, 0% 100%, 100% 100%)',
              transform: 'rotate(30deg)',
              boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.2)',
            }} />
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`spike-${i}`}
                style={{
                  position: 'absolute',
                  width: size * 0.08,
                  height: size * 0.15,
                  background: '#ef4444',
                  clipPath: 'polygon(0% 0%, 50% 100%, 100% 0%)',
                  top: -size * 0.05,
                  left: `${20 + i * 30}%`,
                  transform: `rotate(${(i - 1) * 10}deg)`,
                  boxShadow: 'inset -1px -1px 2px rgba(0,0,0,0.2)',
                }}
              />
            ))}
            <div style={{
              position: 'absolute',
              width: size * 0.25,
              height: size * 0.12,
              background: '#f87171',
              borderRadius: '50%',
              bottom: '15%',
              left: '50%',
              transform: 'translateX(-50%)',
              boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2)',
            }}>
              <div style={{
                position: 'absolute',
                width: size * 0.05,
                height: size * 0.04,
                background: '#1a1a1a',
                borderRadius: '50%',
                bottom: '20%',
                left: '30%',
              }} />
              <div style={{
                position: 'absolute',
                width: size * 0.05,
                height: size * 0.04,
                background: '#1a1a1a',
                borderRadius: '50%',
                bottom: '20%',
                right: '30%',
              }} />
            </div>
          </>
        );

      case 'legend':
        return (
          <>
            <div style={{
              position: 'absolute',
              width: size * 0.7,
              height: size * 0.3,
              background: 'linear-gradient(180deg, #fbbf24, #f59e0b)',
              top: -size * 0.1,
              left: '50%',
              transform: 'translateX(-50%)',
              clipPath: 'polygon(0% 100%, 10% 0%, 30% 40%, 50% 0%, 70% 40%, 90% 0%, 100% 100%)',
              boxShadow: '0 0 20px rgba(251,191,36,0.6)',
            }}>
              <div style={{
                position: 'absolute',
                width: '20%',
                height: '30%',
                background: '#fcd34d',
                top: '20%',
                left: '40%',
                borderRadius: '50%',
                boxShadow: '0 0 10px rgba(251,191,36,0.8)',
              }} />
            </div>
            <div style={{
              position: 'absolute',
              width: '120%',
              height: '120%',
              top: '-10%',
              left: '-10%',
              background: 'radial-gradient(circle, rgba(251,191,36,0.3), transparent)',
              borderRadius: '50%',
              animation: 'legendPulse 1s ease-in-out infinite',
            }} />
          </>
        );

      default:
        return (
          <>
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
          </>
        );
    }
  };

  // Don't render if grid isn't ready
  if (gridSize === 0 || snake.length === 0) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#0f172a",
        color: "white",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🐍</div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

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
        padding: isMobile ? "4px" : "24px",
        transition: "all 0.3s ease",
        overflow: "hidden",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        style={{
          padding: isMobile ? "6px" : "28px",
          borderRadius: isMobile ? "8px" : "24px",
          backdropFilter: "blur(20px)",
          background: theme === 'dark'
            ? "rgba(255,255,255,0.06)"
            : "rgba(255,255,255,0.8)",
          border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
          maxWidth: "100%",
          width: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Header - Desktop Optimized */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: isMobile ? "4px" : "16px",
            alignItems: "center",
            gap: isMobile ? "2px" : "12px",
            flexWrap: "wrap",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "2px" : "10px", flexWrap: "wrap" }}>
            <h1
              style={{
                margin: 0,
                fontSize: isMobile ? "0.8rem" : windowWidth < 500 ? "1rem" : windowWidth < 768 ? "1.3rem" : "2rem",
                fontWeight: "800",
                backgroundImage: animalColors.background,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                whiteSpace: "nowrap",
              }}
            >
              {isMobile ? getAnimalEmoji() : `${getAnimalEmoji()} ${getAnimalName()}`}
            </h1>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={{
                padding: isMobile ? "2px 4px" : "6px 12px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                background: theme === 'dark' ? "#f59e0b" : "#1e293b",
                color: theme === 'dark' ? "#1e293b" : "white",
                fontSize: isMobile ? "0.6rem" : "1.2rem",
              }}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>

          <div style={{
            display: "flex",
            gap: isMobile ? "2px" : "8px",
            alignItems: "center",
            flexWrap: "wrap",
            fontSize: isMobile ? "0.5rem" : windowWidth < 500 ? "0.7rem" : "0.9rem",
          }}>
            <div
              style={{
                padding: isMobile ? "2px 6px" : "6px 14px",
                borderRadius: 8,
                background: "#22c55e",
                fontWeight: "bold",
                boxShadow: "0 4px 12px rgba(34,197,94,0.3)",
                fontSize: "inherit",
              }}
            >
              🏆 {score}
            </div>

            <div
              style={{
                padding: isMobile ? "2px 6px" : "6px 14px",
                borderRadius: 8,
                background: "linear-gradient(135deg,#f59e0b,#d97706)",
                fontWeight: "bold",
                boxShadow: "0 4px 12px rgba(245,158,11,0.3)",
                fontSize: "inherit",
              }}
            >
              ⭐ {bestScore}
            </div>

            <div
              style={{
                padding: isMobile ? "2px 6px" : "6px 14px",
                borderRadius: 8,
                background: `linear-gradient(135deg, ${getLevelColor(level)}, ${getLevelColor(level)}dd)`,
                fontWeight: "bold",
                boxShadow: `0 4px 12px ${getLevelColor(level)}44`,
                fontSize: "inherit",
              }}
            >
              L{level}
            </div>

            {!isMobile && (
              <div
                style={{
                  padding: "4px 12px",
                  borderRadius: 8,
                  background: "rgba(59,130,246,0.3)",
                  fontWeight: "bold",
                  border: "1px solid rgba(59,130,246,0.5)",
                  color: "#60a5fa",
                  fontSize: "inherit",
                }}
              >
                ⚡ {getSpeedDisplay()}
              </div>
            )}

            {nextLevelScore && !isMobile && (
              <div
                style={{
                  padding: "4px 12px",
                  borderRadius: 8,
                  background: "rgba(99,102,241,0.3)",
                  fontWeight: "bold",
                  fontSize: "0.8rem",
                  border: "1px solid rgba(99,102,241,0.5)",
                }}
              >
                ➜ {nextLevelScore}
              </div>
            )}

            {powerUpActive && (
              <div
                style={{
                  padding: isMobile ? "2px 6px" : "6px 14px",
                  borderRadius: 8,
                  background: "linear-gradient(135deg,#8b5cf6,#6d28d9)",
                  fontWeight: "bold",
                  fontSize: isMobile ? "0.5rem" : "0.9rem",
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

            {!isMobile && (
              <select
                value={foodSkin}
                onChange={(e) => setFoodSkin(e.target.value)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
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
                <option value="fish">🐟 Fish</option>
              </select>
            )}

            <button
              onClick={() => setShowRules(!showRules)}
              style={{
                padding: isMobile ? "2px 6px" : "6px 12px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                background: "#6366f1",
                color: "white",
                fontWeight: "bold",
                fontSize: isMobile ? "0.6rem" : "0.9rem",
                boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
              }}
            >
              📖
            </button>

            <button
              onClick={togglePause}
              disabled={gameOver || gameWon || showLevelComplete}
              style={{
                padding: isMobile ? "2px 6px" : "6px 16px",
                borderRadius: 8,
                border: "none",
                cursor: gameOver || gameWon || showLevelComplete ? "not-allowed" : "pointer",
                background: isPaused ? "linear-gradient(135deg,#f59e0b,#d97706)" : "linear-gradient(135deg,#6366f1,#4f46e5)",
                color: "white",
                fontWeight: "bold",
                opacity: gameOver || gameWon || showLevelComplete ? 0.5 : 1,
                transition: "all 0.3s",
                minWidth: isMobile ? "28px" : "65px",
                fontSize: isMobile ? "0.6rem" : "0.9rem",
                boxShadow: isPaused ? "0 4px 12px rgba(245,158,11,0.3)" : "0 4px 12px rgba(99,102,241,0.3)",
              }}
            >
              {isPaused ? "▶" : "⏸"}
            </button>

            <button
              onClick={restartGame}
              style={{
                padding: isMobile ? "2px 6px" : "6px 16px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                background: "linear-gradient(135deg,#ef4444,#dc2626)",
                color: "white",
                fontWeight: "bold",
                fontSize: isMobile ? "0.6rem" : "0.9rem",
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
              top: isMobile ? "8px" : "20px",
              right: isMobile ? "8px" : "20px",
              background: "linear-gradient(135deg,#facc15,#f59e0b)",
              color: "#1e293b",
              padding: isMobile ? "8px 12px" : "16px 24px",
              borderRadius: 16,
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              zIndex: 2000,
              animation: "slideIn 0.5s ease",
              maxWidth: isMobile ? "180px" : "300px",
              fontSize: isMobile ? "0.7rem" : "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: isMobile ? "1.2rem" : "2rem" }}>{showAchievement.icon}</span>
              <div>
                <div style={{ fontWeight: "bold" }}>🏆 Achievement!</div>
                <div style={{ fontSize: isMobile ? "0.6rem" : "0.9rem" }}>{showAchievement.name}</div>
              </div>
            </div>
          </div>
        )}

        {/* Rules Modal - Mobile Responsive */}
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
              padding: isMobile ? "8px" : "20px",
            }}
            onClick={() => setShowRules(false)}
          >
            <div
              style={{
                background: theme === 'dark' ? "#1e293b" : "white",
                padding: isMobile ? "16px" : "40px",
                borderRadius: 20,
                maxWidth: isMobile ? "95%" : 500,
                width: "100%",
                maxHeight: "80vh",
                overflowY: "auto",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
                color: theme === 'dark' ? "white" : "#0f172a",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ marginTop: 0, color: "#4ade80", fontSize: isMobile ? "1rem" : "1.5rem" }}>
                📖 Game Rules
              </h2>

              <div style={{ marginBottom: 12, fontSize: isMobile ? "0.75rem" : "1rem" }}>
                <h3 style={{ color: "#f59e0b", fontSize: isMobile ? "0.85rem" : "1.1rem" }}>🎯 Level System</h3>
                <div style={{ opacity: 0.8 }}>
                  <p><strong>Level 1:</strong> 🐍 Snake • 0 stones • 🐢 Slow</p>
                  <p><strong>Level 2:</strong> 🐱 Cat • 3 stones • 🚶 Normal</p>
                  <p><strong>Level 3:</strong> 🐶 Dog • 6 stones • 🏃 Fast</p>
                  <p><strong>Level 4:</strong> 🦊 Fox • 10 stones • 💨 Turbo</p>
                  <p><strong>Level 5:</strong> 🐉 Dragon • 15 stones • ⚡ Turbo</p>
                  <p><strong style={{ color: "#8b5cf6" }}>Level 6:</strong> 👑 Legend • 20 stones • 🚀 Legend</p>
                </div>
              </div>

              <div style={{ marginBottom: 12, fontSize: isMobile ? "0.75rem" : "1rem" }}>
                <h3 style={{ color: "#f59e0b", fontSize: isMobile ? "0.85rem" : "1.1rem" }}>💪 Power-Ups</h3>
                <div style={{ opacity: 0.8 }}>
                  <p><strong>⭐ Invincible:</strong> Pass through stones for 5s</p>
                  <p><strong>🛡️ Shield:</strong> Block one collision</p>
                  <p><strong>⚡ Speed:</strong> Double speed for 3s</p>
                  <p><strong>💫 Slow:</strong> Slow down time for 3s</p>
                </div>
              </div>

              <button
                onClick={() => setShowRules(false)}
                style={{
                  marginTop: 12,
                  padding: "10px 24px",
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                  background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: isMobile ? "0.85rem" : "1rem",
                  width: "100%",
                  boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
                }}
              >
                Got it! ✨
              </button>
            </div>
          </div>
        )}

        {/* Game Status */}
        {(gameOver || isPaused || gameWon) && !showLevelComplete && (
          <div
            style={{
              textAlign: "center",
              marginBottom: isMobile ? "4px" : "12px",
              animation: "fadeIn 0.3s ease",
            }}
          >
            {gameOver && (
              <>
                <h2 style={{ color: "#ef4444", margin: 0, fontSize: isMobile ? "1rem" : "2rem" }}>
                  💀 Game Over!
                </h2>
                <p style={{ opacity: 0.7, marginTop: 2, fontSize: isMobile ? "0.7rem" : "1rem" }}>
                  Score: {score} | Best: {bestScore} | Level: {level}
                </p>
              </>
            )}
            {gameWon && !showLevelComplete && (
              <>
                <h2 style={{ color: "#4ade80", margin: 0, fontSize: isMobile ? "1rem" : "2rem" }}>
                  🎉 {getAnimalName()} Level Complete!
                </h2>
                <p style={{ opacity: 0.7, marginTop: 2, fontSize: isMobile ? "0.7rem" : "1rem" }}>
                  Score: {score} | {config.label}
                </p>
              </>
            )}
            {isPaused && (
              <h2 style={{ color: "#f59e0b", margin: 0, fontSize: isMobile ? "1rem" : "2rem" }}>
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
            borderRadius: 12,
            overflow: "hidden",
            border: `2px solid ${theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
            backgroundColor: theme === 'dark' ? "#0a0f1a" : "#e2e8f0",
            backgroundImage: `
              linear-gradient(${theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px),
              linear-gradient(90deg, ${theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px)
            `,
            backgroundSize: `${cellSize}px ${cellSize}px`,
            margin: "0 auto",
            flexShrink: 0,
          }}
        >
          {/* Render Snake with realistic animal heads */}
          {snake.map((segment, index) => renderAnimalHead(segment, index))}

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
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  width: "30%",
                  height: "20%",
                  background: "linear-gradient(135deg, rgba(255,255,255,0.15), transparent)",
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
                  fontSize: Math.max(30, cellSize * 2),
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

        {/* Footer - Desktop Optimized */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: isMobile ? "4px" : "16px",
            gap: isMobile ? "4px" : "12px",
            flexWrap: "wrap",
            width: "100%",
          }}
        >
          <p
            style={{
              margin: 0,
              opacity: 0.6,
              fontSize: isMobile ? "0.5rem" : "0.85rem",
            }}
          >
            {isMobile ? '⬆⬇⬅➡ • ⏸' : '↑ ↓ ← → to move • Space to pause'}
          </p>
          <div
            style={{
              display: "flex",
              gap: isMobile ? "3px" : "8px",
              alignItems: "center",
              fontSize: isMobile ? "0.5rem" : "0.8rem",
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
            <span>•</span>
            <span>⚡ {getSpeedDisplay()}</span>
          </div>
        </div>

        {/* Touch Controls - Mobile Only */}
        {showTouchControls && isMobile && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "6px",
              marginTop: "6px",
              flexWrap: "wrap",
            }}
          >
            <div style={{
              display: "grid",
              gridTemplateColumns: "32px 32px 32px",
              gap: "2px"
            }}>
              <div></div>
              <button
                onTouchStart={() => setDirection(prev => prev[1] === 1 ? prev : [0, -1])}
                style={{
                  padding: "5px",
                  borderRadius: 6,
                  border: "none",
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontSize: "0.8rem",
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
                  padding: "5px",
                  borderRadius: 6,
                  border: "none",
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontSize: "0.8rem",
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
                  padding: "5px",
                  borderRadius: 6,
                  border: "none",
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontSize: "0.8rem",
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
                  padding: "5px",
                  borderRadius: 6,
                  border: "none",
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontSize: "0.8rem",
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
        @keyframes tongueWag {
          0% { transform: translateX(-50%) scaleX(1); }
          100% { transform: translateX(-50%) scaleX(0.7); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes legendPulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}