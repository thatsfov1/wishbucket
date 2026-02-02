import { useNavigate } from "react-router-dom";
import { hapticFeedback } from "../utils/telegram";
import "./ComingSoon.css";

interface ComingSoonProps {
  title: string;
  icon: string;
  description: string;
  features?: string[];
}

export default function ComingSoon({
  title,
  icon,
  description,
  features,
}: ComingSoonProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    hapticFeedback.impact("light");
    navigate(-1);
  };

  return (
    <div className="coming-soon-container">
      <button className="coming-soon-back" onClick={handleBack}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <div className="coming-soon-content">
        <div className="coming-soon-icon-wrapper">
          <span className="coming-soon-icon">{icon}</span>
          <div className="coming-soon-sparkles">
            <span className="sparkle sparkle-1">✨</span>
            <span className="sparkle sparkle-2">⭐</span>
            <span className="sparkle sparkle-3">✨</span>
          </div>
        </div>

        <h1 className="coming-soon-title">{title}</h1>
        <p className="coming-soon-subtitle">Coming Soon</p>

        <p className="coming-soon-description">{description}</p>

        {features && features.length > 0 && (
          <div className="coming-soon-features">
            <p className="features-title">What to expect:</p>
            <ul>
              {features.map((feature, index) => (
                <li key={index}>
                  <span className="feature-check">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="coming-soon-notify">
          <div className="notify-icon">🔔</div>
          <p>We'll notify you when this feature is ready!</p>
        </div>
      </div>

      <button className="coming-soon-home-btn" onClick={() => navigate("/")}>
        Go to Home
      </button>
    </div>
  );
}
