import React from "react";

function Snake({ snake, color = "#e7da3d", opacity = 1, shieldColor }) {
  return (
    <div>
      {snake.map((box, i) => (
        <div
          style={{
            width: "15px",
            height: "15px",
            backgroundColor: color,
            margin: "5px",
            position: "absolute",
            left: `${box.x}%`,
            top: `${box.y}%`,
            zIndex: 1,
            opacity,
            boxShadow: shieldColor ? `0 0 6px 3px ${shieldColor}` : "none",
          }}
        />
      ))}
    </div>
  );
}

export default Snake;
