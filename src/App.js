import { useEffect, useRef, useState } from "react";
import "./App.css";
import EffectLabel from "./components/EffectLabel";
import Food from "./components/Food";
import PowerUp from "./components/PowerUp";
import Snake from "./components/Snake";

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

const POWER_UP_CHANCE = 0.2; // chance a power-up appears after eating food
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
  const types = Object.keys(EFFECTS);
  return { ...pos, type: types[Math.floor(Math.random() * types.length)] };
};

function App() {
  const [snake, setSnake] = useState(initialSnake.snake);
  const [lastDirection, setLastDirection] = useState(initialSnake.direction);
  const [foodPosition, setFoodPosition] = useState(randomFoodPosition);
  const [isStarted, setIsStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [powerUp, setPowerUp] = useState(null);
  const [effect, setEffect] = useState(null); // { type, endsAt }
  const playgroundRef = useRef();
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

  useEffect(() => {
    if (!isStarted) return;

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

  const move = () => {
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

    movedDirection.current = lastDirection;
    tmpSnake.push({
      x,
      y,
    });
    if (powerUp && x === powerUp.x && y === powerUp.y) {
      setEffect({ type: powerUp.type, endsAt: Date.now() + EFFECT_DURATION });
      setPowerUp(null);
    }
    if (x !== foodPosition.x || y !== foodPosition.y) tmpSnake.shift();
    else {
      const newFood = randomFoodPosition();
      setFoodPosition(newFood);
      if (Math.random() < POWER_UP_CHANCE) {
        setPowerUp(randomPowerUp(tmpSnake, newFood));
      }
    }
    setSnake(tmpSnake);
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
      {isStarted && <div className="count"> score: {snake.length - 3}</div>}

      {!isStarted && (
        <>
          <button
            onClick={() => {
              setIsStarted(true);
              playgroundRef.current.focus();
            }}
            type="submit"
          >
            Start
          </button>
          <div className="arrow-msg text">Press W A S D to play!</div>
        </>
      )}
      {gameOver && (
        <>
          <div className="game-over text">Game Over!</div>
          <button
            onClick={() => {
              setIsStarted(true);
              setGameOver(false);
              setSnake(initialSnake.snake);
              setLastDirection(initialSnake.direction);
              movedDirection.current = initialSnake.direction;
              setPowerUp(null);
              setEffect(null);
              playgroundRef.current.focus();
            }}
            type="submit"
          >
            Restart
          </button>
        </>
      )}
      {effect && !gameOver && (
        <EffectLabel
          label={EFFECTS[effect.type].label}
          color={EFFECTS[effect.type].color}
          endsAt={effect.endsAt}
        />
      )}
      <Snake
        snake={snake}
        lastDirection={lastDirection}
        color={effect ? EFFECTS[effect.type].color : undefined}
        opacity={effect ? EFFECTS[effect.type].opacity : undefined}
      />
      {!gameOver && (
        <>
          <Food position={foodPosition} />
          {powerUp && (
            <PowerUp position={powerUp} color={EFFECTS[powerUp.type].color} />
          )}
        </>
      )}
    </div>
  );
}

export default App;
