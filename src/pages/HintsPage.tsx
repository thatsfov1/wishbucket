import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import {
  getGiftHints,
  updateHintStatus,
  deleteHint,
  resendHintToChat,
  GiftHint,
} from "../services/supabase-api";
import { hapticFeedback } from "../utils/telegram";
import "./HintsPage.css";

const MESSAGE_TYPE_META: Record<
  GiftHint["messageType"],
  { icon: string; label: string; emptyText: string }
> = {
  text: { icon: "💬", label: "Text", emptyText: "Text message" },
  voice: { icon: "🎤", label: "Voice", emptyText: "Voice message" },
  video: { icon: "🎥", label: "Video", emptyText: "Video message" },
  video_note: { icon: "⭕", label: "Video note", emptyText: "Video note" },
  photo: { icon: "📷", label: "Photo", emptyText: "Photo message" },
  document: { icon: "📄", label: "Document", emptyText: "Document" },
};

export default function HintsPage() {
  const navigate = useNavigate();
  const [hints, setHints] = useState<GiftHint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [expandedHint, setExpandedHint] = useState<string | null>(null);

  useEffect(() => {
    loadHints();
  }, []);

  const loadHints = async () => {
    setLoading(true);
    try {
      const data = await getGiftHints();
      setHints(data.filter((h) => h.status === "active"));
    } catch (error) {
      console.error("Error loading hints:", error);
    } finally {
      setLoading(false);
    }
  };

  // Group hints by person
  const groupedHints = hints.reduce((acc, hint) => {
    const key = hint.aboutName.toLowerCase();
    if (!acc[key]) {
      acc[key] = {
        name: hint.aboutName,
        username: hint.aboutUsername,
        hints: [],
      };
    }
    acc[key].hints.push(hint);
    return acc;
  }, {} as Record<string, { name: string; username?: string; hints: GiftHint[] }>);

  const people = Object.values(groupedHints).sort(
    (a, b) => b.hints.length - a.hints.length
  );

  const handleMarkPurchased = async (hintId: string) => {
    hapticFeedback.impact("medium");
    try {
      await updateHintStatus(hintId, "purchased");
      setHints((prev) => prev.filter((h) => h.id !== hintId));
      setExpandedHint((prev) => (prev === hintId ? null : prev));
    } catch (error) {
      console.error("Error updating hint:", error);
    }
  };

  const handleArchive = async (hintId: string) => {
    hapticFeedback.impact("light");
    try {
      await updateHintStatus(hintId, "archived");
      setHints((prev) => prev.filter((h) => h.id !== hintId));
      setExpandedHint((prev) => (prev === hintId ? null : prev));
    } catch (error) {
      console.error("Error archiving hint:", error);
    }
  };

  const handleDelete = async (hintId: string) => {
    hapticFeedback.notification("warning");
    try {
      await deleteHint(hintId);
      setHints((prev) => prev.filter((h) => h.id !== hintId));
      setExpandedHint((prev) => (prev === hintId ? null : prev));
    } catch (error) {
      console.error("Error deleting hint:", error);
    }
  };

  const handleShowInChat = async (hintId: string) => {
    hapticFeedback.impact("medium");
    try {
      await resendHintToChat(hintId);
      hapticFeedback.notification("success");
      // Optionally close the mini app to show the message
      if (window.Telegram?.WebApp?.close) {
        window.Telegram.WebApp.close();
      }
    } catch (error) {
      console.error("Error showing hint in chat:", error);
      hapticFeedback.notification("error");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Layout title="Gift Hints" showBackButton>
        <div className="hints-loading">
          <div className="loading-spinner"></div>
          <p>Loading hints...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Gift Hints" showBackButton>
      <div className="hints-container">
        {/* Header info */}
        <div className="hints-header">
          <div className="hints-info">
            <span className="hints-icon">💡</span>
            <div>
              <h2>Saved Gift Ideas</h2>
              <p>Forward messages from chats to save hints</p>
            </div>
          </div>
          <div className="hints-stats">
            <span className="stat-number">{hints.length}</span>
            <span className="stat-label">hints</span>
          </div>
        </div>

        {hints.length === 0 ? (
          <div className="hints-empty">
            <div className="empty-icon">📭</div>
            <h3>No hints yet</h3>
            <p>
              When someone mentions they want something, forward that message to
              @wishbucket_bot
            </p>
            <div className="how-to-use">
              <h4>How it works:</h4>
              <ol>
                <li>Someone says "I really want that bag!" in chat</li>
                <li>Long press → Forward → Select wishbucket bot</li>
                <li>The hint is saved automatically!</li>
              </ol>
            </div>
          </div>
        ) : (
          <>
            {/* People filter */}
            <div className="people-filter">
              <button
                className={`filter-btn ${!selectedPerson ? "active" : ""}`}
                onClick={() => setSelectedPerson(null)}
              >
                All ({hints.length})
              </button>
              {people.map((person) => (
                <button
                  key={person.name}
                  className={`filter-btn ${
                    selectedPerson === person.name.toLowerCase() ? "active" : ""
                  }`}
                  onClick={() => {
                    hapticFeedback.selection();
                    setSelectedPerson(
                      selectedPerson === person.name.toLowerCase()
                        ? null
                        : person.name.toLowerCase()
                    );
                  }}
                >
                  {person.name} ({person.hints.length})
                </button>
              ))}
            </div>

            {/* Hints list */}
            <div className="hints-list">
              {people
                .filter(
                  (p) =>
                    !selectedPerson || p.name.toLowerCase() === selectedPerson
                )
                .map((person) => (
                  <div key={person.name} className="person-section">
                    <div className="person-header">
                      <div className="person-avatar">
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="person-info">
                        <span className="person-name">{person.name}</span>
                        {person.username && (
                          <span className="person-username">
                            @{person.username}
                          </span>
                        )}
                      </div>
                      <span className="person-count">
                        {person.hints.length} hints
                      </span>
                    </div>

                    <div className="person-hints">
                      {person.hints.map((hint) => {
                        const typeMeta =
                          MESSAGE_TYPE_META[hint.messageType] ||
                          MESSAGE_TYPE_META.text;
                        const hasText =
                          typeof hint.hintText === "string" &&
                          hint.hintText.trim().length > 0;
                        const hintDisplayText = hasText
                          ? hint.hintText!.trim()
                          : typeMeta.emptyText;

                        return (
                        <div
                          key={hint.id}
                          className={`hint-card ${
                            expandedHint === hint.id ? "expanded" : ""
                          }`}
                          onClick={() => {
                            hapticFeedback.selection();
                            setExpandedHint(
                              expandedHint === hint.id ? null : hint.id
                            );
                          }}
                        >
                          <div className="hint-main">
                            <span className="hint-type-icon">
                              {typeMeta.icon}
                            </span>
                            <div className="hint-content">
                              <p className="hint-text">
                                {hintDisplayText}
                              </p>
                              <div className="hint-meta">
                                <span className="hint-type-pill">
                                  {typeMeta.label}
                                </span>
                                <span className="hint-date">
                                  {formatDate(hint.createdAt)}
                                </span>
                              </div>
                            </div>
                            <span className="hint-expand">
                              {expandedHint === hint.id ? "▲" : "▼"}
                            </span>
                          </div>

                          {expandedHint === hint.id && (
                            <div className="hint-actions">
                              <button
                                className="action-btn show-chat"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShowInChat(hint.id);
                                }}
                                aria-label="Show in chat"
                                title="Show in chat"
                              >
                                💬
                              </button>
                              <button
                                className="action-btn purchased"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkPurchased(hint.id);
                                }}
                                aria-label="Mark as bought"
                                title="Mark as bought"
                              >
                                ✓
                              </button>
                              <button
                                className="action-btn delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(hint.id);
                                }}
                                aria-label="Delete"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
