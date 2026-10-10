import React from "react";

function PowerUp({ position, color }) {
  return (
    <div
      style={{
        width: "15px",
        height: "15px",
        backgroundColor: color,
        margin: "3px",
        borderRadius: "50%",
        position: "absolute",
        left: `${position.x}%`,
        top: `${position.y}%`,
        zIndex: 0,
      }}
    />
  );
}

export default PowerUp;
