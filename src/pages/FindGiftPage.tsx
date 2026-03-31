import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { hapticFeedback } from "../utils/telegram";
import BottomNavBar from "../components/BottomNavBar";
import PickWishlistModal from "../components/PickWishlistModal";
import type { PrefilledGiftItem } from "../components/PickWishlistModal";
import { getRecommendations, GiftItem } from "../data/giftCatalog";
import "./FindGiftPage.css";

interface Question {
  id: string;
  question: string;
  subtitle?: string;
  options: { value: string; label: string; icon: string }[];
}

const questions: Question[] = [
  {
    id: "recipient",
    question: "Who is this gift for?",
    options: [
      { value: "partner", label: "Partner", icon: "💕" },
      { value: "friend", label: "Friend", icon: "👋" },
      { value: "parent", label: "Parent", icon: "👨‍👩‍👧" },
      { value: "sibling", label: "Sibling", icon: "🤝" },
      { value: "colleague", label: "Colleague", icon: "💼" },
      { value: "child", label: "Child", icon: "🧒" },
    ],
  },
  {
    id: "occasion",
    question: "What's the occasion?",
    options: [
      { value: "birthday", label: "Birthday", icon: "🎂" },
      { value: "holiday", label: "Holiday", icon: "🎄" },
      { value: "anniversary", label: "Anniversary", icon: "💍" },
      { value: "graduation", label: "Graduation", icon: "🎓" },
      { value: "valentines", label: "Valentine's", icon: "💝" },
      { value: "just-because", label: "Just Because", icon: "🎁" },
    ],
  },
  {
    id: "category",
    question: "What are they into?",
    subtitle: "Pick their main interest",
    options: [
      { value: "tech", label: "Tech", icon: "📱" },
      { value: "fashion", label: "Fashion", icon: "👗" },
      { value: "outdoors", label: "Outdoors", icon: "🏕️" },
      { value: "creative", label: "Creative", icon: "🎨" },
      { value: "food", label: "Food & Drink", icon: "🍽️" },
      { value: "wellness", label: "Wellness", icon: "🧘" },
      { value: "gaming", label: "Gaming", icon: "🎮" },
      { value: "books", label: "Books", icon: "📚" },
    ],
  },
  {
    id: "budget",
    question: "What's your budget?",
    options: [
      { value: "low", label: "Under $50", icon: "💵" },
      { value: "medium", label: "$50–$150", icon: "💰" },
      { value: "high", label: "$150–$300", icon: "💎" },
      { value: "luxury", label: "$300+", icon: "👑" },
    ],
  },
  {
    id: "vibe",
    question: "What's the vibe?",
    subtitle: "How do you want them to feel?",
    options: [
      { value: "practical", label: "Practical", icon: "✅" },
      { value: "cozy", label: "Cozy", icon: "🛋️" },
      { value: "adventurous", label: "Adventurous", icon: "🗺️" },
      { value: "romantic", label: "Romantic", icon: "❤️" },
      { value: "fun", label: "Fun", icon: "🎉" },
      { value: "unique", label: "Unique", icon: "✨" },
    ],
  },
];

export default function FindGiftPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Array<GiftItem & { score: number }>>([]);
  const [showResults, setShowResults] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [pickerItem, setPickerItem] = useState<PrefilledGiftItem | null>(null);
  const [pickerSourceId, setPickerSourceId] = useState<string | null>(null);

  const handleSelect = (questionId: string, value: string) => {
    hapticFeedback.selection();
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    if (currentStep < questions.length - 1) {
      setTimeout(() => setCurrentStep((s) => s + 1), 280);
    } else {
      const recs = getRecommendations(newAnswers, 8);
      setResults(recs);
      setTimeout(() => setShowResults(true), 280);
    }
  };

  const handleBack = () => {
    hapticFeedback.impact("light");
    if (showResults) {
      setShowResults(false);
    } else if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    } else {
      navigate(-1);
    }
  };

  const handleReset = () => {
    hapticFeedback.notification("success");
    setCurrentStep(0);
    setAnswers({});
    setShowResults(false);
    setAddedIds(new Set());
  };

  const handleAdd = (item: GiftItem) => {
    hapticFeedback.impact("medium");
    setPickerSourceId(item.id);
    setPickerItem({
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
      emoji: item.emoji,
      price: item.price,
      currency: "$",
      url: item.url,
    });
  };

  const progress = ((currentStep + (showResults ? 1 : 0)) / questions.length) * 100;

  // ── Results screen ─────────────────────────────────────────────────────────
  if (showResults) {
    return (
      <div className="findgift-container">
        <header className="findgift-header">
          <button className="fg-back-btn" onClick={handleBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6" /></svg>
          </button>
          <h1>Perfect Picks 🎁</h1>
          <button className="fg-reset-btn" onClick={handleReset}>Restart</button>
        </header>

        <div className="fg-results-intro">
          <p className="fg-results-sub">
            {results.length} gifts matched your answers
          </p>
        </div>

        <div className="fg-results-list">
          {results.map((item, i) => (
            <div
              key={item.id}
              className="fg-result-card"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="fg-result-image">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} />
                ) : (
                  <span className="fg-result-emoji">{item.emoji}</span>
                )}
                <div className="fg-match-badge">{item.score}% match</div>
              </div>
              <div className="fg-result-body">
                <div className="fg-result-tags">
                  {item.categories.slice(0, 2).map((c) => (
                    <span key={c} className="fg-tag">{c}</span>
                  ))}
                </div>
                <h3 className="fg-result-name">{item.name}</h3>
                <p className="fg-result-desc">{item.description}</p>
                <div className="fg-result-footer">
                  <span className="fg-result-price">
                    ~${item.price}
                  </span>
                  <button
                    className={`fg-add-btn ${addedIds.has(item.id) ? "added" : ""}`}
                    onClick={() => handleAdd(item)}
                  >
                    {addedIds.has(item.id) ? (
                      <>✓ Added</>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        Add to list
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {results.length === 0 && (
            <div className="fg-no-results">
              <span>🤔</span>
              <p>No gifts matched all filters. Try restarting with different answers!</p>
              <button className="fg-reset-btn-lg" onClick={handleReset}>Try Again</button>
            </div>
          )}
        </div>

        <BottomNavBar />

        <PickWishlistModal
          isOpen={!!pickerItem}
          item={pickerItem}
          onClose={() => { setPickerItem(null); setPickerSourceId(null); }}
          onAdded={() => {
            if (pickerSourceId) setAddedIds((prev) => new Set([...prev, pickerSourceId]));
          }}
        />
      </div>
    );
  }

  // ── Question screen ────────────────────────────────────────────────────────
  const q = questions[currentStep];
  const isWide = q.options.length > 4;

  return (
    <div className="findgift-container">
      <header className="findgift-header">
        <button className="fg-back-btn" onClick={handleBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6" /></svg>
        </button>
        <h1>Find a Gift</h1>
        <span className="fg-step">{currentStep + 1} / {questions.length}</span>
      </header>

      <div className="fg-progress">
        <div className="fg-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="fg-question-section">
        <h2 className="fg-question">{q.question}</h2>
        {q.subtitle && <p className="fg-question-sub">{q.subtitle}</p>}

        <div className={`fg-options ${isWide ? "fg-options-wide" : ""}`}>
          {q.options.map((opt) => (
            <button
              key={opt.value}
              className={`fg-option ${answers[q.id] === opt.value ? "selected" : ""}`}
              onClick={() => handleSelect(q.id, opt.value)}
            >
              <span className="fg-option-icon">{opt.icon}</span>
              <span className="fg-option-label">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <BottomNavBar />
    </div>
  );
}
