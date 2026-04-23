import { useEffect } from "react";
import { Level, getLevelProgress, LEVELS } from "../config/levels";
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
  const nextLevel =
    currentLevel.level < LEVELS.length - 1
      ? LEVELS[currentLevel.level + 1]
      : null;

  const progress = getLevelProgress(referrals, currentLevel);

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

  const heroGradient = `linear-gradient(135deg, ${currentLevel.gradientStart} 0%, ${currentLevel.gradientEnd} 100%)`;

  const levelJourney = LEVELS;

  return (
    <div
      className="lbm-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Level Board"
    >
      <div className="lbm-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Hero header */}
        <div className="lbm-hero" style={{ background: heroGradient }}>
          <div className="lbm-drag-handle" />
          <button className="lbm-close" onClick={onClose} aria-label="Close">
            ✕
          </button>

          <div
            className="lbm-level-circle"
            style={{
              boxShadow: `0 0 0 4px rgba(255,255,255,0.25), 0 0 0 8px rgba(255,255,255,0.10)`,
            }}
          >
            <span className="lbm-level-num">{currentLevel.level}</span>
          </div>

          <h2 className="lbm-level-name">
            {currentLevel.emoji} {currentLevel.name}
          </h2>
          <p className="lbm-level-desc">{currentLevel.description}</p>
        </div>

        {/* Body */}
        <div className="lbm-body lbm-body--animate">
          {/* Level journey row */}
          <div className="lbm-journey">
            {levelJourney.map((lv) => {
              const done = lv.level <= currentLevel.level;
              const active = lv.level === currentLevel.level;
              return (
                <div key={lv.level} className="lbm-journey-step">
                  <div
                    className={`lbm-journey-dot ${done ? "done" : ""} ${active ? "active" : ""}`}
                    style={
                      done
                        ? {
                            background: `linear-gradient(135deg, ${lv.gradientStart}, ${lv.gradientEnd})`,
                          }
                        : {}
                    }
                  >
                    <span>{done ? lv.emoji : lv.level}</span>
                  </div>
                  {lv.level < levelJourney.length - 1 && (
                    <div
                      className={`lbm-journey-line ${lv.level < currentLevel.level ? "done" : ""}`}
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
                {currentLevel.wishlistLimit === -1
                  ? "Unlimited"
                  : `Up to ${currentLevel.wishlistLimit}`}{" "}
                wishlists
              </strong>
              {nextLevel && (
                <span>
                  Level {nextLevel.level} unlocks{" "}
                  {nextLevel.wishlistLimit === -1
                    ? "unlimited"
                    : nextLevel.wishlistLimit}
                </span>
              )}
            </div>
            <div
              className="lbm-limit-badge"
              style={{
                background: `${currentLevel.gradientStart}22`,
                color: currentLevel.color,
              }}
            >
              Lv.{currentLevel.level}
            </div>
          </div>

          {/* Current level perks */}
          <div className="lbm-perks-section">
            <p className="lbm-perks-title">Your perks</p>
            <div className="lbm-perks-row">
              {currentLevel.perks.map((perk) => (
                <span
                  key={perk}
                  className="lbm-perk-chip"
                  style={{
                    background: `${currentLevel.gradientStart}18`,
                    color: currentLevel.color,
                    borderColor: `${currentLevel.gradientStart}40`,
                  }}
                >
                  ✓ {perk}
                </span>
              ))}
            </div>
          </div>

          {/* Next level perks preview */}
          {nextLevel && (
            <div className="lbm-perks-section lbm-perks-section--next">
              <p className="lbm-perks-title">
                🔓 Unlock at Level {nextLevel.level}
              </p>
              <div className="lbm-perks-row">
                {nextLevel.perks
                  .filter((p) => !currentLevel.perks.includes(p))
                  .map((perk) => (
                    <span
                      key={perk}
                      className="lbm-perk-chip lbm-perk-chip--locked"
                    >
                      🔒 {perk}
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
                  Progress to Level {nextLevel.level} {nextLevel.emoji}
                </span>
                <span
                  className="lbm-progress-pct"
                  style={{ color: currentLevel.color }}
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
                Complete to unlock Level {nextLevel.level}
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
                      <span className="lbm-task-label">{req.label}</span>
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
                        {referrals} / {req.count} friends
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
                        Invite
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
                <span>🔗</span> Share &amp; Invite Friends
              </button>
            </div>
          )}

          {/* Max level reached */}
          {!nextLevel && (
            <div className="lbm-max-level">
              <div className="lbm-max-crown">👑</div>
              <h3>Maximum Level Reached!</h3>
              <p>You're a WishBucket Legend. Enjoy unlimited wishlists!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
