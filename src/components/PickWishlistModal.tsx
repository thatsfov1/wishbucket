import { useState, useEffect } from "react";
import { hapticFeedback } from "../utils/telegram";
import { useStore } from "../store/useStore";
import { addItemToMultipleWishlists, createWishlist } from "../services/supabase-api";
import "./PickWishlistModal.css";

export interface PrefilledGiftItem {
  name: string;
  description?: string;
  imageUrl?: string;
  emoji?: string;
  price?: number;
  currency?: string;
  url?: string;
}

interface PickWishlistModalProps {
  isOpen: boolean;
  item: PrefilledGiftItem | null;
  onClose: () => void;
  onAdded?: () => void;
}

export default function PickWishlistModal({
  isOpen,
  item,
  onClose,
  onAdded,
}: PickWishlistModalProps) {
  const { wishlists, addWishlist } = useStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isClosing, setIsClosing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [newWishlistName, setNewWishlistName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setSelectedIds([]);
      setShowQuickCreate(false);
      setNewWishlistName("");
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    hapticFeedback.impact("light");
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 250);
  };

  const toggleWishlist = (id: string) => {
    hapticFeedback.selection();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAdd = async () => {
    if (!item || selectedIds.length === 0) return;
    hapticFeedback.notification("success");
    setIsAdding(true);
    try {
      await addItemToMultipleWishlists(selectedIds, {
        name: item.name,
        description: item.description,
        imageUrl: item.imageUrl || item.emoji,
        price: item.price,
        currency: item.currency ?? "$",
        url: item.url ?? "",
        status: "available",
        priority: "medium",
      });
      onAdded?.();
      handleClose();
    } catch (err) {
      console.error("Failed to add item:", err);
      hapticFeedback.notification("error");
    } finally {
      setIsAdding(false);
    }
  };

  const handleQuickCreate = async () => {
    if (!newWishlistName.trim()) return;
    setIsCreating(true);
    try {
      const newWl = await createWishlist({
        name: newWishlistName.trim(),
        description: "",
        isPublic: true,
        isDefault: wishlists.length === 0,
        userId: 0,
      });
      addWishlist(newWl);
      setSelectedIds([newWl.id]);
      setShowQuickCreate(false);
      setNewWishlistName("");
      hapticFeedback.notification("success");
    } catch {
      hapticFeedback.notification("error");
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen && !isClosing) return null;
  if (!item) return null;

  const hasImage = !!item.imageUrl;
  const displayPrice =
    item.price !== undefined
      ? `${item.currency ?? "$"}${item.price}`
      : null;

  return (
    <div
      className={`pwm-overlay ${isClosing ? "closing" : ""}`}
      onClick={handleClose}
    >
      <div
        className={`pwm-sheet ${isClosing ? "closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pwm-handle" />

        {/* Item preview (locked / read-only) */}
        <div className="pwm-preview">
          <div className="pwm-preview-image">
            {hasImage ? (
              <img src={item.imageUrl} alt={item.name} />
            ) : (
              <span className="pwm-preview-emoji">{item.emoji ?? "🎁"}</span>
            )}
          </div>
          <div className="pwm-preview-info">
            <p className="pwm-preview-name">{item.name}</p>
            {item.description && (
              <p className="pwm-preview-desc">{item.description}</p>
            )}
            {displayPrice && (
              <p className="pwm-preview-price">{displayPrice}</p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="pwm-divider" />

        {/* Wishlist picker */}
        <div className="pwm-section">
          <p className="pwm-label">Choose wishlist</p>

          {wishlists.length === 0 && !showQuickCreate ? (
            <div className="pwm-empty">
              <p>No wishlists yet</p>
              <button
                className="pwm-new-btn"
                onClick={() => setShowQuickCreate(true)}
              >
                + Create one
              </button>
            </div>
          ) : showQuickCreate ? (
            <div className="pwm-quick-create">
              <input
                autoFocus
                type="text"
                className="pwm-input"
                placeholder="Wishlist name…"
                value={newWishlistName}
                onChange={(e) => setNewWishlistName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuickCreate()}
              />
              <div className="pwm-quick-actions">
                <button
                  className="pwm-cancel-small"
                  onClick={() => {
                    setShowQuickCreate(false);
                    setNewWishlistName("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="pwm-confirm-small"
                  disabled={!newWishlistName.trim() || isCreating}
                  onClick={handleQuickCreate}
                >
                  {isCreating ? "Creating…" : "Create"}
                </button>
              </div>
            </div>
          ) : (
            <div className="pwm-chips">
              {wishlists.map((wl) => (
                <button
                  key={wl.id}
                  className={`pwm-chip ${selectedIds.includes(wl.id) ? "selected" : ""}`}
                  onClick={() => toggleWishlist(wl.id)}
                >
                  {selectedIds.includes(wl.id) && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                  )}
                  {wl.name}
                </button>
              ))}
              <button
                className="pwm-chip pwm-chip-new"
                onClick={() => setShowQuickCreate(true)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New
              </button>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="pwm-actions">
          <button className="pwm-btn-cancel" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="pwm-btn-add"
            onClick={handleAdd}
            disabled={selectedIds.length === 0 || isAdding}
          >
            {isAdding
              ? "Adding…"
              : selectedIds.length > 1
              ? `Add to ${selectedIds.length} lists`
              : "Add to wishlist"}
          </button>
        </div>
      </div>
    </div>
  );
}
