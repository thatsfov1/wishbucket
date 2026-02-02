import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Button from "../components/Button";
import { Input, Textarea } from "../components/Input";
import { getWishlist, updateWishlist } from "../services/supabase-api";
import { showTelegramAlert, hapticFeedback } from "../utils/telegram";
import "./EditWishlistPage.css";

const COVER_EMOJIS = [
  "🎁",
  "🎂",
  "🎄",
  "💝",
  "🌟",
  "✨",
  "🎉",
  "🎊",
  "💎",
  "👑",
  "🦋",
  "🌸",
  "🌺",
  "🌻",
  "🍀",
  "🌈",
  "🏠",
  "✈️",
  "🎸",
  "📚",
  "🎮",
  "⚽",
  "🎨",
  "🎭",
  "💄",
  "👗",
  "👟",
  "⌚",
  "💻",
  "📱",
  "🎧",
  "📷",
];

export default function EditWishlistPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState("🎁");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPublic: true,
  });

  useEffect(() => {
    if (!id) return;

    const loadWishlist = async () => {
      try {
        setLoading(true);
        const wishlist = await getWishlist(id);
        setFormData({
          name: wishlist.name,
          description: wishlist.description || "",
          isPublic: wishlist.isPublic,
        });
        // Try to extract emoji from existing imageUrl if it looks like an emoji
        if (wishlist.imageUrl && COVER_EMOJIS.includes(wishlist.imageUrl)) {
          setSelectedEmoji(wishlist.imageUrl);
        }
      } catch (error) {
        console.error("Error loading wishlist:", error);
        showTelegramAlert("Failed to load wishlist");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    if (!formData.name.trim()) {
      showTelegramAlert("Please enter a wishlist name");
      return;
    }

    try {
      setSaving(true);
      await updateWishlist(id, {
        name: formData.name,
        description: formData.description,
        isPublic: formData.isPublic,
      });
      hapticFeedback.notification("success");
      navigate(`/wishlists/${id}`);
    } catch (error) {
      console.error("Error updating wishlist:", error);
      showTelegramAlert("Failed to update wishlist");
      hapticFeedback.notification("error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Edit Wishlist" showBackButton>
        <div className="edit-wishlist-loading">
          <div className="loading-spinner" />
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Edit Wishlist" showBackButton>
      <div className="edit-wishlist-page">
        <form onSubmit={handleSubmit}>
          <Input
            label="Wishlist Name *"
            placeholder="e.g., Birthday Wishlist"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Textarea
            label="Description"
            placeholder="What's this wishlist for?"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />

          <div className="emoji-picker-section">
            <label className="emoji-picker-label">Cover Icon</label>
            <div className="emoji-grid">
              {COVER_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={`emoji-option ${selectedEmoji === emoji ? "selected" : ""}`}
                  onClick={() => {
                    hapticFeedback.selection();
                    setSelectedEmoji(emoji);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="visibility-toggle">
            <div className="toggle-info">
              <span className="toggle-label">Public Wishlist</span>
              <span className="toggle-desc">Anyone with the link can view</span>
            </div>
            <button
              type="button"
              className={`toggle-btn ${formData.isPublic ? "active" : ""}`}
              onClick={() => {
                hapticFeedback.selection();
                setFormData({ ...formData, isPublic: !formData.isPublic });
              }}
            >
              <span className="toggle-knob" />
            </button>
          </div>

          <div className="form-actions">
            <Button
              type="submit"
              fullWidth
              size="large"
              loading={saving}
              variant="primary"
            >
              💾 Save Changes
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => navigate(`/wishlists/${id}`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
