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
    notifyFollowers: boolean;
  }) => void;
}

const defaultImages = [
  "🎁", "🎂", "🎄", "💝", "🎉", "✨", "🌟", "💫"
];

export default function CreateWishlistModal({ 
  isOpen, 
  onClose, 
  onCreateWishlist 
}: CreateWishlistModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("🎁");
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [eventDate, setEventDate] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [notifyFollowers, setNotifyFollowers] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setName("");
      setDescription("");
      setSelectedEmoji("🎁");
      setCustomImage(null);
      setEventDate("");
      setIsPublic(true);
      // Load user's notification preference
      const savedNotifyPref = localStorage.getItem("notifyOnAdd");
      setNotifyFollowers(savedNotifyPref !== "false");
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
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
    onCreateWishlist({
      name: name.trim(),
      description: description.trim() || undefined,
      imageUrl: customImage || selectedEmoji,
      eventDate: eventDate || undefined,
      isPublic,
      notifyFollowers: isPublic && notifyFollowers,
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

  if (!isOpen && !isClosing) return null;

  return (
    <div className={`modal-overlay ${isClosing ? "closing" : ""}`} onClick={handleClose}>
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
              className={`image-preview ${customImage ? "has-image" : ""}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {customImage ? (
                <img src={customImage} alt="Cover" />
              ) : selectedEmoji ? (
                <span className="preview-emoji">{selectedEmoji}</span>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21,15 16,10 5,21" />
                </svg>
              )}
              <div className="upload-overlay">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          <label className="form-label">Description <span className="optional">(optional)</span></label>
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
          <label className="form-label">Event Date <span className="optional">(optional)</span></label>
          <input
            type="date"
            className="form-input"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
        </div>

        {/* Privacy */}
        <div className="form-section">
          <label className="form-label">Privacy</label>
          <div className="privacy-options">
            <button
              className={`privacy-btn ${isPublic ? "selected" : ""}`}
              onClick={() => { setIsPublic(true); hapticFeedback.selection(); }}
            >
              <div className="privacy-icon public">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <div className="privacy-text">
                <span className="privacy-title">Public</span>
                <span className="privacy-desc">Anyone can view</span>
              </div>
              {isPublic && <div className="check-mark">✓</div>}
            </button>
            <button
              className={`privacy-btn ${!isPublic ? "selected" : ""}`}
              onClick={() => { setIsPublic(false); hapticFeedback.selection(); }}
            >
              <div className="privacy-icon private">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div className="privacy-text">
                <span className="privacy-title">Private</span>
                <span className="privacy-desc">Only you can view</span>
              </div>
              {!isPublic && <div className="check-mark">✓</div>}
            </button>
          </div>
        </div>

        {/* Notify Toggle - only for public wishlists */}
        {isPublic && (
          <div className="form-section notify-section">
            <div className="notify-toggle">
              <div className="notify-info">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                <span>Notify friends & followers</span>
              </div>
              <button 
                className={`toggle-switch ${notifyFollowers ? "active" : ""}`}
                onClick={() => { setNotifyFollowers(!notifyFollowers); hapticFeedback.selection(); }}
              >
                <div className="toggle-thumb" />
              </button>
            </div>
            <p className="notify-hint">Your followers will be notified about this new wishlist</p>
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
