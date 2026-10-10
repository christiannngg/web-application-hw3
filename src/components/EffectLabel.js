import React, { useEffect, useState } from "react";

// Shows the active effect name and a countdown in seconds.
// Keeps its own timer so the game loop isn't re-rendered by the countdown.
function EffectLabel({ label, color, endsAt }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(id);
  }, []);

  const secondsLeft = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));

  return (
    <div
      style={{
        position: "absolute",
        top: "8px",
        color,
        fontSize: "1.2rem",
        fontWeight: 600,
        zIndex: 4,
      }}
    >
      {label} {secondsLeft}s
    </div>
  );
}

export default EffectLabel;
