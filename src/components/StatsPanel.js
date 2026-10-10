import React from "react";

function StatsPanel({ stats, achievements, onClose, onReset }) {
  const unlockedCount = achievements.filter((a) => stats.unlocked[a.id]).length;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "#000",
        borderRadius: "10px",
        zIndex: 10,
        color: "#fff",
        padding: "16px 24px",
        boxSizing: "border-box",
        overflowY: "auto",
      }}
    >
      <h2 style={{ margin: "0 0 8px" }}>Stats</h2>
      <div>Best score (Classic): {stats.best.classic}</div>
      <div>Best score (Time Attack): {stats.best.timeAttack}</div>

      <h2 style={{ margin: "16px 0 8px" }}>
        Achievements ({unlockedCount}/{achievements.length})
      </h2>
      {achievements.map((a) => {
        const done = stats.unlocked[a.id];
        return (
          <div
            key={a.id}
            style={{ margin: "6px 0", opacity: done ? 1 : 0.45 }}
          >
            <span style={{ color: done ? "#e7da3d" : "#fff" }}>
              {done ? "★" : "☆"} {a.name}
            </span>
            <span> - {a.description}</span>
          </div>
        );
      })}

      <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
        <button
          className="mode-btn"
          style={{ marginTop: 0 }}
          onClick={onClose}
          type="button"
        >
          Back
        </button>
        <button
          className="mode-btn"
          style={{ marginTop: 0 }}
          onClick={onReset}
          type="button"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export default StatsPanel;
