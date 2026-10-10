import React, { useEffect, useState } from "react";

// Time Attack countdown. Keeps its own timer so the game loop isn't
// re-rendered by the display ticking.
function TimeLabel({ deadline }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(id);
  }, []);

  const secondsLeft = Math.max(0, (deadline - Date.now()) / 1000);

  return (
    <div
      style={{
        position: "absolute",
        top: "8px",
        right: "12px",
        color: secondsLeft <= 5 ? "#eb2d2d" : "#ffffff",
        fontSize: "1.5rem",
        fontWeight: 600,
        zIndex: 4,
      }}
    >
      {secondsLeft.toFixed(1)}s
    </div>
  );
}

export default TimeLabel;
