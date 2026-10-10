import React from "react";

function Snake({ snake, color = "#e7da3d", opacity = 1 }) {
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
          }}
        />
      ))}
    </div>
  );
}

export default Snake;
