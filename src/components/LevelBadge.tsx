import "./LevelBadge.css";
import { Level } from "../config/levels";

interface LevelBadgeProps {
  currentLevel: Level;
  onClick: () => void;
  isLoading?: boolean;
}

export default function LevelBadge({
  currentLevel,
  onClick,
  isLoading = false,
}: LevelBadgeProps) {
  return (
    <button
      className={`level-badge-btn ${isLoading ? "is-loading" : ""}`}
      onClick={onClick}
      disabled={isLoading}
      style={
        {
          "--level-color-start": currentLevel.gradientStart,
          "--level-color-end": currentLevel.gradientEnd,
          "--level-glow": `${currentLevel.gradientStart}40`,
        } as React.CSSProperties
      }
      aria-busy={isLoading}
      aria-label={`Level ${currentLevel.level} – ${currentLevel.name}. Tap to view progress.`}
    >
      {isLoading ? (
        <>
          <span className="level-badge-skeleton level-badge-skeleton-emoji" />
          <span className="level-badge-skeleton level-badge-skeleton-number" />
        </>
      ) : (
        <>
          <span className="level-badge-emoji">{currentLevel.emoji}</span>
          <span className="level-badge-number">Lv.{currentLevel.level}</span>
        </>
      )}
    </button>
  );
}
