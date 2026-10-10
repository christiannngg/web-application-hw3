import React from "react";

function Snake({ snake, color = "#e7da3d" }) {
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
          }}
        />
      ))}
    </div>
  );
}

export default Snake;
