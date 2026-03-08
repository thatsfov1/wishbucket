import "./LevelBadge.css";
import { Level } from "../config/levels";

interface LevelBadgeProps {
  currentLevel: Level;
  onClick: () => void;
}

export default function LevelBadge({ currentLevel, onClick }: LevelBadgeProps) {
  return (
    <button
      className="level-badge-btn"
      onClick={onClick}
      style={
        {
          "--level-color-start": currentLevel.gradientStart,
          "--level-color-end": currentLevel.gradientEnd,
          "--level-glow": `${currentLevel.gradientStart}40`,
        } as React.CSSProperties
      }
      aria-label={`Level ${currentLevel.level} – ${currentLevel.name}. Tap to view progress.`}
    >
      <span className="level-badge-emoji">{currentLevel.emoji}</span>
      <span className="level-badge-number">Lv.{currentLevel.level}</span>
    </button>
  );
}
