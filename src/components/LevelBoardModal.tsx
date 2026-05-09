import { useEffect, useState } from "react";
import { Level, getLevelProgress, LEVELS } from "../config/levels";
import { translateText } from "../utils/localization";
import "./LevelBoardModal.css";

interface LevelBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: Level;
  referrals: number;
  onInviteFriends: () => void;
}

export default function LevelBoardModal({
  isOpen,
  onClose,
  currentLevel,
  referrals,
  onInviteFriends,
}: LevelBoardModalProps) {
  const [selectedLevelIndex, setSelectedLevelIndex] = useState(currentLevel.level);

  useEffect(() => {
    if (isOpen) {
      setSelectedLevelIndex(currentLevel.level);
    }
  }, [isOpen, currentLevel.level]);

  const selectedLevel = LEVELS[selectedLevelIndex] || currentLevel;
  const nextLevel =
    selectedLevel.level < LEVELS.length - 1
      ? LEVELS[selectedLevel.level + 1]
      : null;
  const progress = getLevelProgress(referrals, selectedLevel);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const heroGradient = `linear-gradient(135deg, ${selectedLevel.gradientStart} 0%, ${selectedLevel.gradientEnd} 100%)`;

  const levelJourney = LEVELS;

  return (
    <div
      className="lbm-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={translateText("Level Board")}
    >
      <div className="lbm-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Hero header */}
        <div className="lbm-hero" style={{ background: heroGradient }}>
          <div className="lbm-drag-handle" />
          <button
            className="lbm-close"
            onClick={onClose}
            aria-label={translateText("Close")}
          >
            ✕
          </button>

          <div
            className="lbm-level-circle"
            style={{
              boxShadow: `0 0 0 4px rgba(255,255,255,0.25), 0 0 0 8px rgba(255,255,255,0.10)`,
            }}
          >
            <span className="lbm-level-num">{selectedLevel.level}</span>
          </div>

          <h2 className="lbm-level-name">
            {selectedLevel.emoji} {translateText(selectedLevel.name)}
          </h2>
          <p className="lbm-level-desc">
            {translateText(selectedLevel.description)}
          </p>
        </div>

        {/* Body */}
        <div className="lbm-body lbm-body--animate">
          {/* Level journey row */}
          <div className="lbm-journey">
            {levelJourney.map((lv) => {
              const done = lv.level <= currentLevel.level;
              const active = lv.level === selectedLevel.level;
              return (
                <div key={lv.level} className="lbm-journey-step">
                  <button
                    type="button"
                    className={`lbm-journey-dot ${done ? "done" : ""} ${active ? "active" : ""}`}
                    style={
                      done
                        ? {
                            background: `linear-gradient(135deg, ${lv.gradientStart}, ${lv.gradientEnd})`,
                          }
                        : {}
                    }
                    onClick={() => setSelectedLevelIndex(lv.level)}
                    aria-pressed={active}
                    aria-label={translateText(
                      `Level ${lv.level} – ${lv.name}. Tap to view progress.`,
                    )}
                  >
                    <span>{done ? lv.emoji : lv.level}</span>
                  </button>
                  {lv.level < levelJourney.length - 1 && (
                    <div
                      className={`lbm-journey-line ${lv.level < selectedLevel.level ? "done" : ""}`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Wishlist limit chip */}
          <div
            className="lbm-limit-banner"
            style={{
              borderColor: `${currentLevel.gradientStart}55`,
              background: `${currentLevel.gradientStart}12`,
            }}
          >
            <span className="lbm-limit-icon">🗂️</span>
            <div className="lbm-limit-text">
              <strong>
                {selectedLevel.wishlistLimit === -1
                  ? translateText("Unlimited")
                  : `${translateText("Up to")} ${selectedLevel.wishlistLimit}`}{" "}
                {translateText("wishlists")}
              </strong>
              {nextLevel && (
                <span>
                  {translateText(`Level ${nextLevel.level} unlocks`)}{" "}
                  {nextLevel.wishlistLimit === -1
                    ? translateText("Unlimited")
                    : nextLevel.wishlistLimit}
                </span>
              )}
            </div>
            <div
              className="lbm-limit-badge"
              style={{
                background: `${currentLevel.gradientStart}22`,
                color: selectedLevel.color,
              }}
            >
              Lv.{selectedLevel.level}
            </div>
          </div>

          {/* Current level perks */}
          <div className="lbm-perks-section">
            <p className="lbm-perks-title">{translateText("Your perks")}</p>
            <div className="lbm-perks-row">
              {selectedLevel.perks.map((perk) => (
                <span
                  key={perk}
                  className="lbm-perk-chip"
                  style={{
                    background: `${selectedLevel.gradientStart}18`,
                    color: selectedLevel.color,
                    borderColor: `${selectedLevel.gradientStart}40`,
                  }}
                >
                  ✓ {translateText(perk)}
                </span>
              ))}
            </div>
          </div>

          {/* Next level perks preview */}
          {nextLevel && (
            <div className="lbm-perks-section lbm-perks-section--next">
              <p className="lbm-perks-title">
                {translateText(`🔓 Unlock at Level ${nextLevel.level}`)}
              </p>
              <div className="lbm-perks-row">
                {nextLevel.perks
                  .filter((p) => !selectedLevel.perks.includes(p))
                  .map((perk) => (
                    <span
                      key={perk}
                      className="lbm-perk-chip lbm-perk-chip--locked"
                    >
                      🔒 {translateText(perk)}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Progress to next level */}
          {nextLevel && (
            <div className="lbm-progress-section">
              <div className="lbm-progress-header">
                <span>
                  {translateText(`Progress to Level ${nextLevel.level}`)}{" "}
                  {nextLevel.emoji}
                </span>
                <span
                  className="lbm-progress-pct"
                  style={{ color: selectedLevel.color }}
                >
                  {progress}%
                </span>
              </div>
              <div className="lbm-progress-track">
                <div
                  className="lbm-progress-fill"
                  style={{
                    width: `${progress}%`,
                    background: heroGradient,
                  }}
                />
              </div>
            </div>
          )}

          {/* Task to reach next level */}
          {nextLevel && nextLevel.requirement && (
            <div className="lbm-tasks-section">
              <h3 className="lbm-tasks-title">
                {translateText(`Complete to unlock Level ${nextLevel.level}`)}
              </h3>

              {(() => {
                const req = nextLevel.requirement;
                const done = referrals >= req.count;
                const pct = Math.min(
                  Math.round((referrals / req.count) * 100),
                  100,
                );
                return (
                  <div className={`lbm-task-card ${done ? "done" : ""}`}>
                    <div className="lbm-task-icon">👥</div>
                    <div className="lbm-task-info">
                      <span className="lbm-task-label">
                        {translateText(req.label)}
                      </span>
                      <div className="lbm-task-sub-track">
                        <div
                          className="lbm-task-sub-fill"
                          style={{
                            width: `${pct}%`,
                            background: heroGradient,
                          }}
                        />
                      </div>
                      <span className="lbm-task-progress-text">
                        {translateText(`${referrals} / ${req.count} friends`)}
                      </span>
                    </div>
                    {done ? (
                      <div className="lbm-task-check">✓</div>
                    ) : (
                      <button
                        className="lbm-task-action"
                        style={{ background: heroGradient }}
                        onClick={onInviteFriends}
                      >
                        {translateText("Invite")}
                      </button>
                    )}
                  </div>
                );
              })()}

              <button
                className="lbm-invite-btn"
                style={{ background: heroGradient }}
                onClick={onInviteFriends}
              >
                <span>🔗</span> {translateText("Share & Invite Friends")}
              </button>
            </div>
          )}

          {/* Max level reached */}
          {!nextLevel && (
            <div className="lbm-max-level">
              <div className="lbm-max-crown">👑</div>
              <h3>{translateText("Maximum Level Reached!")}</h3>
              <p>
                {translateText(
                  "You're a wishbucket Legend. Enjoy unlimited wishlists!",
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
