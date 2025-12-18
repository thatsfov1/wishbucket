import { useState } from "react";
import { hapticFeedback } from "../utils/telegram";
import BottomNavBar from "../components/BottomNavBar";
import "./FindGiftPage.css";

interface GiftQuestion {
  id: string;
  question: string;
  options: { value: string; label: string; icon: string }[];
}

interface GiftSuggestion {
  id: string;
  name: string;
  price: number;
  currency: string;
  image: string;
  match: number;
  reason: string;
}

const questions: GiftQuestion[] = [
  {
    id: "recipient",
    question: "Who is this gift for?",
    options: [
      { value: "partner", label: "Partner", icon: "💕" },
      { value: "friend", label: "Friend", icon: "👋" },
      { value: "family", label: "Family", icon: "👨‍👩‍👧" },
      { value: "colleague", label: "Colleague", icon: "💼" },
    ],
  },
  {
    id: "occasion",
    question: "What's the occasion?",
    options: [
      { value: "birthday", label: "Birthday", icon: "🎂" },
      { value: "holiday", label: "Holiday", icon: "🎄" },
      { value: "anniversary", label: "Anniversary", icon: "💍" },
      { value: "just-because", label: "Just Because", icon: "💝" },
    ],
  },
  {
    id: "interests",
    question: "What are they interested in?",
    options: [
      { value: "tech", label: "Technology", icon: "📱" },
      { value: "fashion", label: "Fashion", icon: "👗" },
      { value: "outdoors", label: "Outdoors", icon: "🏕️" },
      { value: "creative", label: "Creative", icon: "🎨" },
    ],
  },
  {
    id: "budget",
    question: "What's your budget?",
    options: [
      { value: "low", label: "Under $50", icon: "💵" },
      { value: "medium", label: "$50-$150", icon: "💰" },
      { value: "high", label: "$150-$300", icon: "💎" },
      { value: "luxury", label: "$300+", icon: "👑" },
    ],
  },
];

const sampleSuggestions: GiftSuggestion[] = [
  {
    id: "1",
    name: "Apple AirPods Pro 2",
    price: 249,
    currency: "$",
    image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQD83?wid=800&hei=800&fmt=jpeg&qlt=90",
    match: 95,
    reason: "Perfect for tech lovers who enjoy music",
  },
  {
    id: "2",
    name: "Ember Smart Mug",
    price: 129,
    currency: "$",
    image: "https://m.media-amazon.com/images/I/61G1m4VZwmL._AC_SL1500_.jpg",
    match: 88,
    reason: "Great for coffee enthusiasts",
  },
  {
    id: "3",
    name: "Polaroid Now Camera",
    price: 119,
    currency: "$",
    image: "https://m.media-amazon.com/images/I/61yrYXrsCvL._AC_SL1500_.jpg",
    match: 82,
    reason: "Fun for capturing memories",
  },
];

export default function FindGiftPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  const handleOptionSelect = (questionId: string, value: string) => {
    hapticFeedback.selection();
    setAnswers((prev) => ({ ...prev, [questionId]: value }));

    if (currentStep < questions.length - 1) {
      setTimeout(() => setCurrentStep((prev) => prev + 1), 300);
    } else {
      setTimeout(() => setShowResults(true), 300);
    }
  };

  const handleBack = () => {
    hapticFeedback.selection();
    if (showResults) {
      setShowResults(false);
    } else if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    hapticFeedback.notification("success");
    setCurrentStep(0);
    setAnswers({});
    setShowResults(false);
  };

  const handleAddToWishlist = (suggestion: GiftSuggestion) => {
    hapticFeedback.notification("success");
    // In real implementation, this would add to wishlist
  };

  if (showResults) {
    return (
      <div className="findgift-container">
        <header className="findgift-header">
          <button className="back-btn" onClick={handleBack}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15,18 9,12 15,6" />
            </svg>
          </button>
          <h1>Gift Suggestions</h1>
          <button className="reset-btn" onClick={handleReset}>
            Start Over
          </button>
        </header>

        <div className="results-intro">
          <span className="results-emoji">🎁</span>
          <h2>We found perfect gifts!</h2>
          <p>Based on your answers, here are our top picks</p>
        </div>

        <div className="suggestions-list">
          {sampleSuggestions.map((suggestion) => (
            <div key={suggestion.id} className="suggestion-card">
              <div className="suggestion-image">
                <img src={suggestion.image} alt={suggestion.name} />
                <div className="match-badge">{suggestion.match}% match</div>
              </div>
              <div className="suggestion-content">
                <h3>{suggestion.name}</h3>
                <p className="suggestion-reason">{suggestion.reason}</p>
                <div className="suggestion-footer">
                  <span className="suggestion-price">{suggestion.currency}{suggestion.price}</span>
                  <button
                    className="add-btn"
                    onClick={() => handleAddToWishlist(suggestion)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <BottomNavBar />
      </div>
    );
  }

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="findgift-container">
      {/* Header */}
      <header className="findgift-header">
        {currentStep > 0 && (
          <button className="back-btn" onClick={handleBack}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15,18 9,12 15,6" />
            </svg>
          </button>
        )}
        <h1>Find Gift</h1>
        <span className="step-indicator">{currentStep + 1}/{questions.length}</span>
      </header>

      {/* Progress Bar */}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Question */}
      <div className="question-section">
        <h2>{currentQuestion.question}</h2>
        <div className="options-grid">
          {currentQuestion.options.map((option) => (
            <button
              key={option.value}
              className={`option-btn ${answers[currentQuestion.id] === option.value ? "selected" : ""}`}
              onClick={() => handleOptionSelect(currentQuestion.id, option.value)}
            >
              <span className="option-icon">{option.icon}</span>
              <span className="option-label">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      <BottomNavBar />
    </div>
  );
}

