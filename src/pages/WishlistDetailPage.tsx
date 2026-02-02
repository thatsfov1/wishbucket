import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import {
  getWishlist,
  deleteWishlist,
  getShareLink,
  addItem,
  deleteItem,
  updateItem,
} from "../services/supabase-api";
import {
  openTelegramLink,
  hapticFeedback,
  showTelegramConfirm,
} from "../utils/telegram";
import BottomNavBar from "../components/BottomNavBar";
import AddItemModal from "../components/AddItemModal";
import "./WishlistDetailPage.css";

const DELETE_REASONS = [
  {
    id: "received",
    label: "Yes, I received this gift!",
    emoji: "🎁",
    action: "mark_received",
  },
  { id: "remove", label: "No, just remove it", emoji: "🗑️", action: "delete" },
];

export default function WishlistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentWishlist, setCurrentWishlist, setLoading, isLoading } =
    useStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showReceivedSection, setShowReceivedSection] = useState(false);
  const [selectedItem, setSelectedItem] = useState<
    (typeof currentWishlist.items)[0] | null
  >(null);
  const [deleteItemModal, setDeleteItemModal] = useState<{
    isOpen: boolean;
    itemId: string | null;
    itemName: string;
  }>({
    isOpen: false,
    itemId: null,
    itemName: "",
  });

  useEffect(() => {
    if (!id) return;

    const loadWishlist = async () => {
      try {
        setLoading(true);
        const wishlist = await getWishlist(id);
        setCurrentWishlist(wishlist);
      } catch (error) {
        console.error("Error loading wishlist:", error);
        navigate("/wishlists");
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
  }, [id, setCurrentWishlist, setLoading, navigate]);

  const handleShare = async () => {
    if (!id) return;
    try {
      hapticFeedback.impact("light");
      const shareLink = await getShareLink(id);
      openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(`Check out my wishlist: ${currentWishlist?.name || ""}`)}`,
      );
      hapticFeedback.notification("success");
    } catch (error) {
      console.error("Error sharing wishlist:", error);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const confirmed = await showTelegramConfirm(
      "Are you sure you want to delete this wishlist?",
    );
    if (!confirmed) return;

    try {
      await deleteWishlist(id);
      hapticFeedback.notification("success");
      navigate("/wishlists");
    } catch (error) {
      console.error("Error deleting wishlist:", error);
    }
  };

  const handleAddItem = async (itemData: {
    name: string;
    description?: string;
    imageUrl?: string;
    price?: number;
    currency: string;
    url?: string;
    wishlistIds: string[];
    notifyFollowers: boolean;
  }) => {
    try {
      setLoading(true);
      // Add item to all selected wishlists with notifyFollowers flag
      for (const wishlistId of itemData.wishlistIds) {
        await addItem(
          wishlistId,
          {
            wishlistId,
            name: itemData.name,
            description: itemData.description,
            url: itemData.url || "",
            originalUrl: itemData.url || "",
            imageUrl: itemData.imageUrl,
            price: itemData.price,
            currency: itemData.currency,
            priority: "medium",
            status: "available",
          },
          itemData.notifyFollowers,
        );
      }
      // Reload current wishlist if it was in the selected list
      if (id && itemData.wishlistIds.includes(id)) {
        const wishlist = await getWishlist(id);
        setCurrentWishlist(wishlist);
      }
      hapticFeedback.notification("success");
    } catch (error) {
      console.error("Error adding item:", error);
      hapticFeedback.notification("error");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    hapticFeedback.impact("light");
    navigate(-1);
  };

  const openDeleteItemModal = (itemId: string, itemName: string) => {
    hapticFeedback.impact("medium");
    setDeleteItemModal({ isOpen: true, itemId, itemName });
  };

  const handleDeleteItem = async (reasonId: string) => {
    if (!deleteItemModal.itemId || !id) return;

    try {
      const reason = DELETE_REASONS.find((r) => r.id === reasonId);

      if (reason?.action === "mark_received") {
        // Mark as purchased/received instead of deleting
        await updateItem(deleteItemModal.itemId, { status: "purchased" });
        hapticFeedback.notification("success");
      } else {
        // Actually delete the item
        await deleteItem(deleteItemModal.itemId);
        hapticFeedback.notification("success");
      }

      // Reload wishlist to update items
      const wishlist = await getWishlist(id);
      setCurrentWishlist(wishlist);
      setDeleteItemModal({ isOpen: false, itemId: null, itemName: "" });
    } catch (error) {
      console.error("Error updating item:", error);
      hapticFeedback.notification("error");
    }
  };

  if (isLoading || !currentWishlist) {
    return (
      <div className="wishlist-detail-container">
        <header className="detail-header">
          <button className="back-btn" onClick={handleBack}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1>Loading...</h1>
        </header>
        <div className="loading-state">
          <div className="loading-spinner" />
        </div>
        <BottomNavBar />
      </div>
    );
  }

  return (
    <div className="wishlist-detail-container">
      {/* Header */}
      <header className="detail-header">
        <button className="back-btn" onClick={handleBack}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1>{currentWishlist.name}</h1>
        <button
          className="menu-btn"
          onClick={() => {
            hapticFeedback.impact("light");
            setShowMenu(!showMenu);
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="6" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="18" r="2" />
          </svg>
        </button>
      </header>

      {/* Menu Dropdown */}
      {showMenu && (
        <div className="menu-dropdown" onClick={() => setShowMenu(false)}>
          <div className="menu-content" onClick={(e) => e.stopPropagation()}>
            <button onClick={handleShare}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                <polyline points="16,6 12,2 8,6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              Share Wishlist
            </button>
            <button onClick={() => navigate(`/wishlists/${id}/edit`)}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Wishlist
            </button>
            <button className="danger" onClick={handleDelete}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3,6 5,6 21,6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              Delete Wishlist
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="detail-stats">
        <div className="detail-stat">
          <span className="stat-value">
            {
              currentWishlist.items.filter((i) => i.status === "available")
                .length
            }
          </span>
          <span className="stat-label">Active</span>
        </div>
        <div className="stat-divider" />
        <div className="detail-stat">
          <span className="stat-value">
            {
              currentWishlist.items.filter((i) => i.status === "reserved")
                .length
            }
          </span>
          <span className="stat-label">Reserved</span>
        </div>
        <div className="stat-divider" />
        <div
          className="detail-stat clickable"
          onClick={() => {
            hapticFeedback.selection();
            setShowReceivedSection(!showReceivedSection);
          }}
        >
          <span className="stat-value">
            {
              currentWishlist.items.filter((i) => i.status === "purchased")
                .length
            }
          </span>
          <span className="stat-label">Received ⤵</span>
        </div>
      </div>

      {/* Description */}
      {currentWishlist.description && (
        <div className="detail-description">
          <p>{currentWishlist.description}</p>
        </div>
      )}

      {/* Received Items History */}
      {showReceivedSection &&
        currentWishlist.items.filter((i) => i.status === "purchased").length >
          0 && (
          <div className="received-section">
            <div className="received-header">
              <span className="received-icon">🎁</span>
              <h3>Received Gifts</h3>
              <button
                className="close-received-btn"
                onClick={() => setShowReceivedSection(false)}
              >
                ✕
              </button>
            </div>
            <div className="received-list">
              {currentWishlist.items
                .filter((i) => i.status === "purchased")
                .map((item) => (
                  <div key={item.id} className="received-item">
                    <div className="received-item-image">
                      {item.imageUrl ? (
                        item.imageUrl.length <= 2 ? (
                          <span>{item.imageUrl}</span>
                        ) : (
                          <img src={item.imageUrl} alt={item.name} />
                        )
                      ) : (
                        <span>🎁</span>
                      )}
                    </div>
                    <div className="received-item-info">
                      <span className="received-item-name">{item.name}</span>
                      {item.price && (
                        <span className="received-item-price">
                          {item.currency || "$"}
                          {item.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <span className="received-badge">✓ Received</span>
                  </div>
                ))}
            </div>
          </div>
        )}

      {/* Items Section */}
      <div className="items-section">
        <div className="section-header">
          <h2>Items</h2>
          <button
            className="add-item-btn"
            onClick={() => {
              hapticFeedback.impact("medium");
              setShowAddItemModal(true);
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Item
          </button>
        </div>

        {currentWishlist.items.length === 0 ? (
          <div className="empty-items">
            <div className="empty-emoji">🎁</div>
            <h3>No items yet</h3>
            <p>Add your first item to this wishlist</p>
          </div>
        ) : (
          <div className="items-list">
            {currentWishlist.items
              .filter((i) => i.status !== "purchased")
              .map((item, index) => (
                <div
                  key={item.id}
                  className="item-card animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={() => {
                    hapticFeedback.selection();
                    setSelectedItem(item);
                  }}
                >
                  <div className="item-image">
                    {item.imageUrl ? (
                      item.imageUrl.length <= 2 ? (
                        <span className="item-emoji">{item.imageUrl}</span>
                      ) : (
                        <img src={item.imageUrl} alt={item.name} />
                      )
                    ) : (
                      <span className="item-emoji">🎁</span>
                    )}
                  </div>
                  <div className="item-info">
                    <h3>{item.name}</h3>
                    {item.description && (
                      <p className="item-desc">{item.description}</p>
                    )}
                    {item.price && (
                      <span className="item-price">
                        {item.currency || "$"}
                        {item.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="item-actions">
                    <span className={`item-status status-${item.status}`}>
                      {item.status === "available" && "✓"}
                      {item.status === "reserved" && "⏳"}
                      {item.status === "purchased" && "✓✓"}
                    </span>
                    <button
                      className="item-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteItemModal(item.id, item.name);
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="3,6 5,6 21,6" />
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div
          className="item-detail-overlay"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="item-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-detail-btn"
              onClick={() => setSelectedItem(null)}
            >
              ✕
            </button>

            {selectedItem.imageUrl && selectedItem.imageUrl.length > 2 && (
              <div className="detail-image-container">
                <img src={selectedItem.imageUrl} alt={selectedItem.name} />
              </div>
            )}

            <div className="detail-content">
              <h2>{selectedItem.name}</h2>

              {selectedItem.price && (
                <div className="detail-price">
                  {selectedItem.currency || "$"}
                  {selectedItem.price.toFixed(2)}
                </div>
              )}

              {selectedItem.description && (
                <p className="detail-desc">{selectedItem.description}</p>
              )}

              <div className="detail-meta">
                <span className={`detail-status status-${selectedItem.status}`}>
                  {selectedItem.status === "available" && "✓ Available"}
                  {selectedItem.status === "reserved" && "⏳ Reserved"}
                  {selectedItem.status === "purchased" && "🎁 Received"}
                </span>
                <span className="detail-priority priority-${selectedItem.priority}">
                  Priority: {selectedItem.priority}
                </span>
              </div>

              {selectedItem.url && (
                <a
                  href={selectedItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="detail-link-btn"
                  onClick={() => hapticFeedback.impact("light")}
                >
                  🔗 View Product
                </a>
              )}

              <div className="detail-actions">
                <button
                  className="detail-delete-btn"
                  onClick={() => {
                    openDeleteItemModal(selectedItem.id, selectedItem.name);
                    setSelectedItem(null);
                  }}
                >
                  🗑️ Remove Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Modal */}
      {deleteItemModal.isOpen && (
        <div
          className="delete-modal-overlay"
          onClick={() =>
            setDeleteItemModal({ isOpen: false, itemId: null, itemName: "" })
          }
        >
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-header">
              <span className="delete-modal-icon">🎁</span>
              <h3>Did you receive this gift?</h3>
              <p>"{deleteItemModal.itemName}"</p>
            </div>
            <div className="delete-reasons">
              {DELETE_REASONS.map((reason) => (
                <button
                  key={reason.id}
                  className={`delete-reason-btn ${reason.action === "mark_received" ? "received-btn" : ""}`}
                  onClick={() => handleDeleteItem(reason.id)}
                >
                  <span className="reason-emoji">{reason.emoji}</span>
                  <span className="reason-label">{reason.label}</span>
                </button>
              ))}
            </div>
            <button
              className="delete-cancel-btn"
              onClick={() =>
                setDeleteItemModal({
                  isOpen: false,
                  itemId: null,
                  itemName: "",
                })
              }
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <BottomNavBar />

      <AddItemModal
        isOpen={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        onAddItem={handleAddItem}
        preselectedWishlistId={id}
      />
    </div>
  );
}
