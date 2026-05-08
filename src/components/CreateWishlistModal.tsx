import { useState, useEffect, useRef } from "react";
import { hapticFeedback } from "../utils/telegram";
import "./CreateWishlistModal.css";

interface CreateWishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateWishlist: (wishlist: {
    name: string;
    description?: string;
    imageUrl?: string;
    eventDate?: string;
    isPublic: boolean;
    visibility: WishlistVisibility;
    notifyFollowers: boolean;
  }) => void;
  /** Level 0 users cannot upload a custom photo */
  isImageUploadLocked?: boolean;
  /** Called when the locked upload area is tapped */
  onUnlockRequest?: () => void;
}

const defaultImages = ["🎁", "🎂", "🎄", "💝", "🎉", "✨", "🌟", "💫"];
type WishlistVisibility = "public" | "link" | "private";

const VISIBILITY_OPTIONS: Array<{
  value: WishlistVisibility;
  title: string;
  description: string;
  icon: string;
}> = [
  {
    value: "public",
    title: "Public",
    description: "Visible to everyone in app and by link",
    icon: "🌍",
  },
  {
    value: "private",
    title: "Private",
    description: "Only you can see this wishlist",
    icon: "🔒",
  },
  {
    value: "link",
    title: "Anyone with link",
    description: "Hidden in app, accessible by shared link",
    icon: "🔗",
  },
];

export default function CreateWishlistModal({
  isOpen,
  onClose,
  onCreateWishlist,
  isImageUploadLocked = false,
  onUnlockRequest,
}: CreateWishlistModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("🎁");
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [eventDate, setEventDate] = useState("");
  const [visibility, setVisibility] = useState<WishlistVisibility>("public");
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
  const [notifyFollowers, setNotifyFollowers] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      document.body.style.overflow = "hidden";
      setName("");
      setDescription("");
      setSelectedEmoji("🎁");
      setCustomImage(null);
      setEventDate("");
      setVisibility("public");
      setShowVisibilityDropdown(false);
      // Load user's notification preference
      const savedNotifyPref = localStorage.getItem("notifyOnAdd");
      setNotifyFollowers(savedNotifyPref !== "false");
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    hapticFeedback.impact("light");
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 250);
  };

  const handleCreate = () => {
    if (!name.trim()) {
      hapticFeedback.notification("error");
      return;
    }

    hapticFeedback.notification("success");
    const isPublic = visibility === "public";
    onCreateWishlist({
      name: name.trim(),
      description: description.trim() || undefined,
      imageUrl: customImage || selectedEmoji,
      eventDate: eventDate || undefined,
      isPublic,
      visibility,
      notifyFollowers: visibility === "public" && notifyFollowers,
    });
    handleClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomImage(event.target?.result as string);
        setSelectedEmoji("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    hapticFeedback.selection();
    setSelectedEmoji(emoji);
    setCustomImage(null);
  };

  const selectedVisibility =
    VISIBILITY_OPTIONS.find((option) => option.value === visibility) ??
    VISIBILITY_OPTIONS[0];

  if (!isOpen && !isClosing) return null;

  return (
    <div
      className={`modal-overlay ${isClosing ? "closing" : ""}`}
      onClick={handleClose}
    >
      <div
        className={`create-wishlist-modal ${isClosing ? "closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-handle" />

        <div className="modal-header">
          <h2>Create Wishlist</h2>
          <p>Set up your new wishlist</p>
        </div>

        {/* Image Selection */}
        <div className="form-section">
          <label className="form-label">Cover Image</label>
          <div className="image-selection">
            <button
              className={`image-preview ${customImage ? "has-image" : ""} ${isImageUploadLocked ? "locked" : ""}`}
              onClick={() => {
                if (isImageUploadLocked) {
                  hapticFeedback.impact("medium");
                  onUnlockRequest?.();
                } else {
                  fileInputRef.current?.click();
                }
              }}
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
              {isImageUploadLocked ? (
                <div className="upload-overlay locked-overlay">
                  <span className="lock-icon">🔒</span>
                  <span className="lock-label">Level 1</span>
                </div>
              ) : (
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
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: "none" }}
            />
            <div className="emoji-options">
              {defaultImages.map((emoji) => (
                <button
                  key={emoji}
                  className={`emoji-btn ${selectedEmoji === emoji && !customImage ? "selected" : ""}`}
                  onClick={() => handleEmojiSelect(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Name */}
        <div className="form-section">
          <label className="form-label">Name *</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g., Birthday Wishlist"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
          />
        </div>

        {/* Description */}
        <div className="form-section">
          <label className="form-label">
            Description <span className="optional">(optional)</span>
          </label>
          <textarea
            className="form-textarea"
            placeholder="Add a description for your wishlist..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
            rows={3}
          />
        </div>

        {/* Event Date */}
        <div className="form-section">
          <label className="form-label">
            Event Date <span className="optional">(optional)</span>
          </label>
          <input
            type="date"
            className="form-input"
            value={eventDate}
            placeholder="ddd"
            onChange={(e) => setEventDate(e.target.value)}
          />
        </div>

        {/* Visibility */}
        <div className="form-section">
          <label className="form-label">Visibility</label>
          <div className={`privacy-dropdown ${showVisibilityDropdown ? "open" : ""}`}>
            <button
              className="privacy-btn selected"
              onClick={() => {
                hapticFeedback.selection();
                setShowVisibilityDropdown(!showVisibilityDropdown);
              }}
              type="button"
            >
              <div
                className={`privacy-icon ${
                  selectedVisibility.value === "private"
                    ? "private"
                    : selectedVisibility.value === "link"
                      ? "link"
                      : "public"
                }`}
              >
                <span className="privacy-icon-emoji">{selectedVisibility.icon}</span>
              </div>
              <div className="privacy-text">
                <span className="privacy-title">{selectedVisibility.title}</span>
                <span className="privacy-desc">
                  {selectedVisibility.description}
                </span>
              </div>
              <div className={`dropdown-chevron ${showVisibilityDropdown ? "open" : ""}`}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6,9 12,15 18,9" />
                </svg>
              </div>
            </button>

            {showVisibilityDropdown && (
              <div className="privacy-menu">
                {VISIBILITY_OPTIONS.filter(
                  (option) => option.value !== visibility,
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="privacy-menu-item"
                    onClick={() => {
                      hapticFeedback.selection();
                      setVisibility(option.value);
                      setShowVisibilityDropdown(false);
                    }}
                  >
                    <span
                      className={`privacy-icon privacy-menu-icon ${
                        option.value === "private"
                          ? "private"
                          : option.value === "link"
                            ? "link"
                            : "public"
                      }`}
                    >
                      <span className="privacy-icon-emoji">{option.icon}</span>
                    </span>
                    <span className="privacy-title">{option.title}</span>
                    <span className="privacy-desc">{option.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Notify Toggle - only for public wishlists */}
        {visibility === "public" && (
          <div className="form-section notify-section">
            <div className="notify-toggle">
              <div className="notify-info">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                <span>Notify friends & followers</span>
              </div>
              <button
                className={`toggle-switch ${notifyFollowers ? "active" : ""}`}
                onClick={() => {
                  setNotifyFollowers(!notifyFollowers);
                  hapticFeedback.selection();
                }}
              >
                <div className="toggle-thumb" />
              </button>
            </div>
            <p className="notify-hint">
              Your followers will be notified about this new wishlist
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="modal-actions">
          <button className="cancel-btn" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="create-btn"
            onClick={handleCreate}
            disabled={!name.trim()}
          >
            Create Wishlist
          </button>
        </div>
      </div>
    </div>
  );
}
