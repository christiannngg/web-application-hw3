// Stats + achievements, saved in the browser's localStorage.
const STORAGE_KEY = "snake-game-stats";

export const ACHIEVEMENTS = [
  { id: "firstBite", name: "First Bite", description: "Eat your first food" },
  { id: "score10", name: "Growing Up", description: "Reach a score of 10" },
  { id: "score25", name: "Big Snake", description: "Reach a score of 25" },
  {
    id: "powerPlayer",
    name: "Power Player",
    description: "Collect 3 power-ups in one game",
  },
  {
    id: "shieldSave",
    name: "Shield Save",
    description: "Block a collision with a shield",
  },
  {
    id: "timeAttackPro",
    name: "Time Attack Pro",
    description: "Score 15 in Time Attack",
  },
];

export const defaultStats = () => ({
  best: { classic: 0, timeAttack: 0 }, // best score per mode
  unlocked: {}, // { [achievementId]: true }
});

export const loadStats = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const base = defaultStats();
    return {
      best: { ...base.best, ...(saved && saved.best) },
      unlocked: { ...base.unlocked, ...(saved && saved.unlocked) },
    };
  } catch (e) {
    return defaultStats();
  }
};

export const saveStats = (stats) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    // storage unavailable (private mode, etc.): stats just won't persist
  }
};
