import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Button from "../components/Button";
import { Input, Textarea } from "../components/Input";
import { getWishlist, updateWishlist } from "../services/supabase-api";
import { showTelegramAlert, hapticFeedback } from "../utils/telegram";
import "./EditWishlistPage.css";

const defaultImages = ["🎁", "🎂", "🎄", "💝", "🎉", "✨", "🌟", "💫"];

export default function EditWishlistPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState("");
  const [customImage, setCustomImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    eventDate: "",
    isPublic: true,
  });

  useEffect(() => {
    if (!id) return;

    const loadWishlist = async () => {
      try {
        setLoading(true);
        const wishlist = await getWishlist(id);
        const img = wishlist.imageUrl || "";
        // Detect if imageUrl is an emoji or a real image URL
        if (img && !img.startsWith("http") && !img.startsWith("data:")) {
          setSelectedEmoji(img);
          setCustomImage(null);
        } else if (img) {
          setCustomImage(img);
          setSelectedEmoji("");
        } else {
          setSelectedEmoji("🎁");
          setCustomImage(null);
        }
        setFormData({
          name: wishlist.name,
          description: wishlist.description || "",
          imageUrl: img,
          eventDate: wishlist.eventDate || "",
          isPublic: wishlist.isPublic,
        });
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
        imageUrl: customImage || selectedEmoji || undefined,
        eventDate: formData.eventDate || undefined,
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

          {/* Cover Image */}
          <div className="form-section">
            <label className="form-label">Cover Image</label>
            <div className="image-selection">
              <button
                type="button"
                className={`image-preview ${customImage ? "has-image" : ""}`}
                onClick={() => fileInputRef.current?.click()}
              >
                {customImage ? (
                  <img src={customImage} alt="Cover" />
                ) : selectedEmoji ? (
                  <span className="preview-emoji">{selectedEmoji}</span>
                ) : (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21,15 16,10 5,21" />
                  </svg>
                )}
                <div className="upload-overlay">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17,8 12,3 7,8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      setCustomImage(event.target?.result as string);
                      setSelectedEmoji("");
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                style={{ display: "none" }}
              />
              <div className="emoji-options">
                {defaultImages.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={`emoji-btn ${selectedEmoji === emoji && !customImage ? "selected" : ""}`}
                    onClick={() => {
                      hapticFeedback.selection();
                      setSelectedEmoji(emoji);
                      setCustomImage(null);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Input
            label="Event Date"
            type="date"
            value={formData.eventDate}
            onChange={(e) =>
              setFormData({ ...formData, eventDate: e.target.value })
            }
          />

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
