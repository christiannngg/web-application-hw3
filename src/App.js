import { useEffect, useRef, useState } from "react";
import "./App.css";
import EffectLabel from "./components/EffectLabel";
import Food from "./components/Food";
import PowerUp from "./components/PowerUp";
import Snake from "./components/Snake";
import StatsPanel from "./components/StatsPanel";
import TimeLabel from "./components/TimeLabel";
import { ACHIEVEMENTS, defaultStats, loadStats, saveStats } from "./stats";

const randomFoodPosition = () => {
  const pos = { x: 0, y: 0 };
  let x = Math.floor(Math.random() * 96);
  let y = Math.floor(Math.random() * 96);
  pos.x = x - (x % 4);
  pos.y = y - (y % 4);
  return pos;
};

const initialSnake = {
  snake: [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 8, y: 0 },
  ],
  direction: "ArrowRight",
  speed: 100,
};

const POWER_UP_CHANCE = 1; // chance a power-up appears after eating food
const POWER_UP_LIFETIME = 8000; // ms before an uncollected power-up vanishes
const EFFECT_DURATION = 5000; // ms the speed effect lasts

const EFFECTS = {
  boost: { speed: 50, color: "#ff8c1a", label: "SPEED BOOST" },
  slow: { speed: 180, color: "#6aa6ff", label: "SLOW MOTION" },
  ghost: {
    speed: initialSnake.speed,
    color: "#ffffff",
    label: "GHOST MODE",
    opacity: 0.45,
  },
};

// Shield: not timed, it stays until it blocks one wall/tail collision.
const SHIELD_COLOR = "#2ee6a6";
const SHIELD_PAUSE = 1000; // ms the snake freezes after the shield blocks a hit

const POWER_UP_TYPES = [...Object.keys(EFFECTS), "shield"];
const powerUpColor = (type) =>
  type === "shield" ? SHIELD_COLOR : EFFECTS[type].color;

// Time Attack: start with TIME_ATTACK_START ms, each food adds TIME_ATTACK_BONUS ms.
const TIME_ATTACK_START = 30000;
const TIME_ATTACK_BONUS = 3000;

// WASD keys -> internal direction names
const KEY_TO_DIRECTION = {
  w: "ArrowUp",
  a: "ArrowLeft",
  s: "ArrowDown",
  d: "ArrowRight",
};

const OPPOSITE = {
  ArrowUp: "ArrowDown",
  ArrowDown: "ArrowUp",
  ArrowLeft: "ArrowRight",
  ArrowRight: "ArrowLeft",
};

const randomPowerUp = (snake, food) => {
  let pos;
  do {
    pos = randomFoodPosition();
  } while (
    pos.x === 0 || // x = 0 is a wall
    (pos.x === food.x && pos.y === food.y) ||
    snake.some((s) => s.x === pos.x && s.y === pos.y)
  );
  return {
    ...pos,
    type: POWER_UP_TYPES[Math.floor(Math.random() * POWER_UP_TYPES.length)],
  };
};

function App() {
  const [snake, setSnake] = useState(initialSnake.snake);
  const [lastDirection, setLastDirection] = useState(initialSnake.direction);
  const [foodPosition, setFoodPosition] = useState(randomFoodPosition);
  const [isStarted, setIsStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [powerUp, setPowerUp] = useState(null);
  const [effect, setEffect] = useState(null); // { type, endsAt }
  const [hasShield, setHasShield] = useState(false);
  const [mode, setMode] = useState("classic"); // "classic" | "timeAttack"
  const [deadline, setDeadline] = useState(null); // Time Attack end timestamp (ms)
  const [timeUp, setTimeUp] = useState(false);
  const [stats, setStats] = useState(loadStats);
  const [toast, setToast] = useState(null); // name of the achievement just unlocked
  const [showStats, setShowStats] = useState(false);
  const statsRef = useRef(stats); // always-current stats for use inside the game loop
  const powerUpsThisRun = useRef(0);
  const playgroundRef = useRef();
  const frozenUntil = useRef(0); // snake is paused until this timestamp
  const movedDirection = useRef(initialSnake.direction); // direction of the last actual move

  // Uncollected power-ups disappear after a while.
  useEffect(() => {
    if (!powerUp) return;
    const t = setTimeout(() => setPowerUp(null), POWER_UP_LIFETIME);
    return () => clearTimeout(t);
  }, [powerUp]);

  // Active speed effect ends after EFFECT_DURATION.
  useEffect(() => {
    if (!effect) return;
    const t = setTimeout(
      () => setEffect(null),
      Math.max(0, effect.endsAt - Date.now())
    );
    return () => clearTimeout(t);
  }, [effect]);

  // Time Attack: end the game when the clock runs out.
  useEffect(() => {
    if (!deadline || !isStarted || gameOver) return;
    const t = setTimeout(() => {
      setTimeUp(true);
      setGameOver(true);
    }, Math.max(0, deadline - Date.now()));
    return () => clearTimeout(t);
  }, [deadline, isStarted, gameOver]);

  // Hide the achievement popup after a few seconds.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // Save the best score for this mode when a game ends.
  useEffect(() => {
    if (!gameOver) return;
    const score = snake.length - 3;
    const cur = statsRef.current;
    if (score > (cur.best[mode] || 0)) {
      updateStats({ ...cur, best: { ...cur.best, [mode]: score } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOver]);

  useEffect(() => {
    if (!isStarted || gameOver) return;

    const head = snake[snake.length - 1];
    const hitSelf = snake
      .slice(0, -1)
      .some((s) => s.x === head.x && s.y === head.y);
    const isGhost = effect?.type === "ghost"; // ghost mode passes through own body
    if (
      head.x === 100 ||
      head.x === 0 ||
      head.y === 100 ||
      head.y === -4 ||
      (hitSelf && !isGhost)
    ) {
      setGameOver(true);
      return;
    }
    const speed = effect ? EFFECTS[effect.type].speed : initialSnake.speed;
    const interval = setInterval(move, speed);
    return () => clearInterval(interval);
  });

  const updateStats = (next) => {
    statsRef.current = next;
    setStats(next);
    saveStats(next);
  };

  const unlock = (id) => {
    const cur = statsRef.current;
    if (cur.unlocked[id]) return;
    updateStats({ ...cur, unlocked: { ...cur.unlocked, [id]: true } });
    setToast(ACHIEVEMENTS.find((a) => a.id === id).name);
  };

  const checkScoreAchievements = (score) => {
    if (score >= 1) unlock("firstBite");
    if (score >= 10) unlock("score10");
    if (score >= 25) unlock("score25");
    if (mode === "timeAttack" && score >= 15) unlock("timeAttackPro");
  };

  const move = () => {
    if (Date.now() < frozenUntil.current) return; // paused after a shield block

    const tmpSnake = [...snake];
    let x = tmpSnake[tmpSnake.length - 1].x,
      y = tmpSnake[tmpSnake.length - 1].y;
    switch (lastDirection) {
      case "ArrowUp":
        y -= 4;
        break;
      case "ArrowRight":
        x += 4;
        break;
      case "ArrowDown":
        y += 4;
        break;
      case "ArrowLeft":
        x -= 4;
        break;
      default:
        break;
    }

    // Shield absorbs one wall or own-tail collision: cancel the move and pause
    // briefly so the player can steer away.
    const hitWall = x <= 0 || x >= 100 || y < 0 || y >= 100;
    const hitSelf =
      effect?.type !== "ghost" &&
      snake.slice(1).some((s) => s.x === x && s.y === y);
    if (hasShield && (hitWall || hitSelf)) {
      setHasShield(false);
      frozenUntil.current = Date.now() + SHIELD_PAUSE;
      unlock("shieldSave");
      return;
    }

    movedDirection.current = lastDirection;
    tmpSnake.push({
      x,
      y,
    });
    if (powerUp && x === powerUp.x && y === powerUp.y) {
      if (powerUp.type === "shield") {
        setHasShield(true);
      } else {
        setEffect({ type: powerUp.type, endsAt: Date.now() + EFFECT_DURATION });
      }
      setPowerUp(null);
      powerUpsThisRun.current += 1;
      if (powerUpsThisRun.current >= 3) unlock("powerPlayer");
    }
    if (x !== foodPosition.x || y !== foodPosition.y) tmpSnake.shift();
    else {
      const newFood = randomFoodPosition();
      setFoodPosition(newFood);
      if (mode === "timeAttack") setDeadline((d) => d + TIME_ATTACK_BONUS);
      checkScoreAchievements(tmpSnake.length - 3);
      if (Math.random() < POWER_UP_CHANCE) {
        setPowerUp(randomPowerUp(tmpSnake, newFood));
      }
    }
    setSnake(tmpSnake);
  };

  const resetGame = () => {
    setGameOver(false);
    setTimeUp(false);
    setSnake(initialSnake.snake);
    setLastDirection(initialSnake.direction);
    movedDirection.current = initialSnake.direction;
    setPowerUp(null);
    setEffect(null);
    setHasShield(false);
    frozenUntil.current = 0;
    powerUpsThisRun.current = 0;
  };

  const startGame = (selectedMode) => {
    resetGame();
    setMode(selectedMode);
    setDeadline(
      selectedMode === "timeAttack" ? Date.now() + TIME_ATTACK_START : null
    );
    setIsStarted(true);
    playgroundRef.current.focus();
  };

  const backToMenu = () => {
    resetGame();
    setDeadline(null);
    setIsStarted(false);
  };

  return (
    <div
      className="App"
      onKeyDown={(e) => {
        const direction = KEY_TO_DIRECTION[e.key.toLowerCase()];
        if (!direction) return; // ignore keys other than W A S D
        if (direction === OPPOSITE[movedDirection.current]) return; // no 180° turns
        setLastDirection(direction);
      }}
      ref={playgroundRef}
      tabIndex={0}
    >
      {isStarted && (
        <div className="count">
          {" "}
          score: {snake.length - 3} | best:{" "}
          {Math.max(stats.best[mode] || 0, snake.length - 3)}
        </div>
      )}
      {toast && (
        <div
          style={{
            position: "absolute",
            top: "40px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0, 0, 0, 0.85)",
            border: "1px solid #e7da3d",
            borderRadius: "8px",
            color: "#e7da3d",
            padding: "6px 14px",
            fontWeight: 600,
            whiteSpace: "nowrap",
            zIndex: 6,
          }}
        >
          ★ Achievement unlocked: {toast}
        </div>
      )}
      {showStats && (
        <StatsPanel
          stats={stats}
          achievements={ACHIEVEMENTS}
          onClose={() => setShowStats(false)}
          onReset={() => {
            if (window.confirm("Reset all stats and achievements?")) {
              updateStats(defaultStats());
            }
          }}
        />
      )}

      {!isStarted && (
        <>
          <button
            className="mode-btn"
            onClick={() => startGame("classic")}
            type="submit"
          >
            Classic
          </button>
          <button
            className="mode-btn"
            onClick={() => startGame("timeAttack")}
            type="submit"
          >
            Time Attack
          </button>
          <button
            className="mode-btn"
            onClick={() => setShowStats(true)}
            type="submit"
          >
            Stats
          </button>
          <div className="arrow-msg text">Press W A S D to play!</div>
        </>
      )}
      {gameOver && (
        <>
          <div className="game-over text">
            {timeUp ? "Time's up!" : "Game Over!"}
          </div>
          <button
            className="mode-btn"
            onClick={() => startGame(mode)}
            type="submit"
          >
            Restart
          </button>
          <button className="mode-btn" onClick={backToMenu} type="submit">
            Menu
          </button>
        </>
      )}
      {mode === "timeAttack" && isStarted && !gameOver && deadline && (
        <TimeLabel deadline={deadline} />
      )}
      {effect && !gameOver && (
        <EffectLabel
          label={EFFECTS[effect.type].label}
          color={EFFECTS[effect.type].color}
          endsAt={effect.endsAt}
        />
      )}
      {hasShield && !gameOver && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            left: "12px",
            color: SHIELD_COLOR,
            fontSize: "1.2rem",
            fontWeight: 600,
            zIndex: 4,
          }}
        >
          SHIELD
        </div>
      )}
      <Snake
        snake={snake}
        shieldColor={hasShield ? SHIELD_COLOR : undefined}
        lastDirection={lastDirection}
        color={effect ? EFFECTS[effect.type].color : undefined}
        opacity={effect ? EFFECTS[effect.type].opacity : undefined}
      />
      {!gameOver && (
        <>
          <Food position={foodPosition} />
          {powerUp && (
            <PowerUp position={powerUp} color={powerUpColor(powerUp.type)} />
          )}
        </>
      )}
    </div>
  );
}

export default App;
