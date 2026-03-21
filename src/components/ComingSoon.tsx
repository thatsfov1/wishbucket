import { useNavigate } from "react-router-dom";
import { hapticFeedback } from "../utils/telegram";
import "./ComingSoon.css";

interface ComingSoonProps {
  emoji: string;
  title: string;
  description?: string;
}

export default function ComingSoon({ emoji, title, description }: ComingSoonProps) {
  const navigate = useNavigate();

  const handleGoBack = () => {
    hapticFeedback.impact("light");
    navigate(-1);
  };

  return (
    <div className="coming-soon-container">
      <div className="coming-soon-content">
        <div className="floating-emoji">
          <span>{emoji}</span>
        </div>
        <h1 className="coming-soon-title">Coming Soon</h1>
        <h2 className="feature-title">{title}</h2>
        {description && <p className="feature-description">{description}</p>}
        <div className="sparkles">
          <span className="sparkle">✨</span>
          <span className="sparkle">✨</span>
          <span className="sparkle">✨</span>
        </div>
        <button className="go-back-btn" onClick={handleGoBack}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="15,18 9,12 15,6" />
          </svg>
          Go Back
        </button>
      </div>
    </div>
  );
}
