import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getFriendProfileData,
  addFriend,
  removeFriend,
  reserveItem,
  unreserveItem,
  purchaseItem,
} from "../services/supabase-api";
import {
  hapticFeedback,
  showTelegramAlert,
  showTelegramConfirm,
  getTelegramUserId,
} from "../utils/telegram";
import { Friend, Wishlist, WishlistItem } from "../types";
import BottomNavBar from "../components/BottomNavBar";
import "./FriendProfilePage.css";

// Extract a valid absolute URL from a potentially malformed stored value.
// Handles items saved with "Title: https://..." pattern due to paste bug.
const extractUrl = (raw: string): string => {
  if (!raw) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  const match = raw.match(/https?:\/\/\S+/i);
  return match ? match[0] : raw;
};

// Format birthday for display (with or without year)
function formatBirthday(birthday: string): string {
  try {
    const date = new Date(birthday);
    const month = date.toLocaleDateString("en-US", { month: "long" });
    const day = date.getDate();
    const year = date.getFullYear();

    // If year is 1900 or earlier, it's likely a placeholder (no year provided)
    if (year <= 1900) {
      return `${month} ${day}`;
    }

    return `${month} ${day}, ${year}`;
  } catch {
    return birthday;
  }
}

export default function FriendProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const currentUserId = getTelegramUserId();

  const [user, setUser] = useState<Friend | null>(null);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [selectedWishlist, setSelectedWishlist] = useState<Wishlist | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null);

  useEffect(() => {
    if (!userId) return;
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const targetUserId = parseInt(userId!);

      // Single optimized call for all friend profile data
      const { user: userData, wishlists: wishlistsData } =
        await getFriendProfileData(targetUserId);

      setUser(userData);
      setWishlists(wishlistsData);

      if (wishlistsData.length > 0) {
        setSelectedWishlist(wishlistsData[0]);
      }
    } catch (error) {
      console.error("Error loading user:", error);
      showTelegramAlert("Failed to load user profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    hapticFeedback.impact("light");
    navigate(-1);
  };

  const handleFollow = async () => {
    if (!user) return;

    try {
      setActionLoading("follow");
      hapticFeedback.impact("medium");

      if (user.isFollowing) {
        await removeFriend(user.id);
        setUser({ ...user, isFollowing: false });
      } else {
        await addFriend(user.id);
        setUser({ ...user, isFollowing: true });
      }

      hapticFeedback.notification("success");
    } catch (error) {
      console.error("Error toggling follow:", error);
      hapticFeedback.notification("error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReserveItem = async (item: WishlistItem) => {
    if (item.status !== "available") {
      showTelegramAlert("This item is already reserved or purchased");
      return;
    }

    const confirmed = await showTelegramConfirm(
      `Reserve "${item.name}" as a gift for ${user?.firstName}?`,
    );

    if (!confirmed) return;

    try {
      setActionLoading(item.id);
      hapticFeedback.impact("medium");

      await reserveItem(item.id);

      // Update local state
      if (selectedWishlist) {
        setSelectedWishlist({
          ...selectedWishlist,
          items: selectedWishlist.items.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: "reserved",
                  reservedBy: currentUserId || undefined,
                }
              : i,
          ),
        });
      }

      hapticFeedback.notification("success");
      showTelegramAlert("Item reserved! They won't see who reserved it.");
    } catch (error) {
      console.error("Error reserving item:", error);
      showTelegramAlert("Failed to reserve item");
      hapticFeedback.notification("error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnreserveItem = async (item: WishlistItem) => {
    const confirmed = await showTelegramConfirm(
      `Release "${item.name}"? It will be available again for others to gift to ${user?.firstName}.`,
    );

    if (!confirmed) return;

    try {
      setActionLoading(item.id);
      hapticFeedback.impact("medium");

      await unreserveItem(item.id);

      if (selectedWishlist) {
        setSelectedWishlist({
          ...selectedWishlist,
          items: selectedWishlist.items.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: "available",
                  reservedBy: undefined,
                }
              : i,
          ),
        });
      }

      hapticFeedback.notification("success");
      showTelegramAlert("Reservation released.");
    } catch (error) {
      console.error("Error unreserving item:", error);
      showTelegramAlert("Failed to release reservation");
      hapticFeedback.notification("error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkPurchased = async (item: WishlistItem) => {
    const confirmed = await showTelegramConfirm(
      `Mark "${item.name}" as purchased/gifted?`,
    );

    if (!confirmed) return;

    try {
      setActionLoading(item.id);
      hapticFeedback.impact("medium");

      await purchaseItem(item.id);

      // Update local state
      if (selectedWishlist) {
        setSelectedWishlist({
          ...selectedWishlist,
          items: selectedWishlist.items.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: "purchased",
                  purchasedBy: currentUserId || undefined,
                }
              : i,
          ),
        });
      }

      hapticFeedback.notification("success");
      showTelegramAlert("Marked as gifted! 🎁");
    } catch (error) {
      console.error("Error marking as purchased:", error);
      hapticFeedback.notification("error");
    } finally {
      setActionLoading(null);
    }
  };

  const getItemStatusBadge = (item: WishlistItem) => {
    if (item.status === "reserved") {
      return <span className="status-badge reserved">Reserved</span>;
    }
    if (item.status === "purchased") {
      return <span className="status-badge purchased">Gifted ✓</span>;
    }
    return null;
  };

  const totalItems = wishlists.reduce(
    (sum, w) => sum + w.items.filter((i) => i.status !== "purchased").length,
    0,
  );

  if (isLoading) {
    return (
      <div className="friend-profile-container">
        <header className="profile-header">
          <button className="back-btn" onClick={handleBack}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1>Profile</h1>
        </header>
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading profile...</p>
        </div>
        <BottomNavBar />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="friend-profile-container">
        <header className="profile-header">
          <button className="back-btn" onClick={handleBack}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1>Profile</h1>
        </header>
        <div className="error-state">
          <span className="error-icon">😕</span>
          <h3>User not found</h3>
          <p>This user doesn't exist or hasn't joined WishBucket yet.</p>
        </div>
        <BottomNavBar />
      </div>
    );
  }

  return (
    <div className="friend-profile-container">
      {/* Header */}
      <header className="profile-header">
        <button className="back-btn" onClick={handleBack}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1>Profile</h1>
      </header>

      {/* User Info */}
      <div className="user-info-card">
        <div className="user-avatar-large">
          {user.photoUrl ? (
            <img src={user.photoUrl} alt={user.firstName} />
          ) : (
            <span>{user.firstName[0]?.toUpperCase()}</span>
          )}
        </div>
        <h2>
          {user.firstName} {user.lastName || ""}
        </h2>
        {user.username && <p className="username">@{user.username}</p>}
        {user.birthday && (
          <p className="user-birthday">🎂 {formatBirthday(user.birthday)}</p>
        )}

        <div className="user-stats">
          <div className="stat">
            <span className="stat-value">{wishlists.length}</span>
            <span className="stat-label">Wishlists</span>
          </div>
          <div className="stat">
            <span className="stat-value">{totalItems}</span>
            <span className="stat-label">Items</span>
          </div>
        </div>

        <button
          className={`follow-action-btn ${user.isFollowing ? "following" : ""}`}
          onClick={handleFollow}
          disabled={actionLoading === "follow"}
        >
          {actionLoading === "follow"
            ? "..."
            : user.isFollowing
              ? "Following"
              : "Follow"}
        </button>

        {user.isFollowedBy && !user.isFollowing && (
          <span className="follows-you-text">Follows you</span>
        )}
      </div>

      {/* Wishlists */}
      {wishlists.length === 0 ? (
        <div className="no-wishlists">
          <span className="empty-icon">📝</span>
          <p>No public wishlists yet</p>
        </div>
      ) : (
        <>
          {/* Wishlist Tabs */}
          <div className="wishlist-tabs">
            {wishlists.map((wishlist) => (
              <button
                key={wishlist.id}
                className={`wishlist-tab ${selectedWishlist?.id === wishlist.id ? "active" : ""}`}
                onClick={() => {
                  setSelectedWishlist(wishlist);
                  hapticFeedback.selection();
                }}
              >
                {wishlist.isDefault ? "⭐" : "📝"} {wishlist.name}
                <span className="tab-count">
                  {
                    wishlist.items.filter((i) => i.status !== "purchased")
                      .length
                  }
                </span>
              </button>
            ))}
          </div>

          {/* Items */}
          {selectedWishlist && (
            <div className="items-section">
              {selectedWishlist.items.length === 0 ? (
                <div className="no-items">
                  <p>No items in this wishlist</p>
                </div>
              ) : (
                <div className="items-list">
                  {selectedWishlist.items.map((item, index) => (
                    <div
                      key={item.id}
                      className={`item-card ${item.status !== "available" ? "item-taken" : ""}`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                      onClick={() => {
                        hapticFeedback.selection();
                        setSelectedItem(item);
                      }}
                    >
                      <div className="item-image">
                        {item.imageUrl ? (
                          item.imageUrl.startsWith("http") ||
                          item.imageUrl.startsWith("data:") ? (
                            <img src={item.imageUrl} alt={item.name} />
                          ) : (
                            <span className="item-emoji">{item.imageUrl}</span>
                          )
                        ) : (
                          <span className="item-emoji">🎁</span>
                        )}
                      </div>

                      <div className="item-content">
                        <div className="item-header">
                          <h4>{item.name}</h4>
                          {getItemStatusBadge(item)}
                        </div>
                        {item.description && (
                          <p className="item-description">{item.description}</p>
                        )}
                        {item.price && (
                          <span className="item-price">
                            {item.currency || "$"}
                            {item.price.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <div
                        className="item-actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.status === "available" ? (
                          <button
                            className="reserve-btn"
                            onClick={() => handleReserveItem(item)}
                            disabled={actionLoading === item.id}
                          >
                            {actionLoading === item.id ? "..." : "Reserve"}
                          </button>
                        ) : item.status === "reserved" &&
                          item.reservedBy === currentUserId ? (
                          <>
                            <button
                              className="gifted-btn"
                              onClick={() => handleMarkPurchased(item)}
                              disabled={actionLoading === item.id}
                            >
                              {actionLoading === item.id ? "..." : "Mark Gifted"}
                            </button>
                            <button
                              className="unreserve-btn"
                              onClick={() => handleUnreserveItem(item)}
                              disabled={actionLoading === item.id}
                            >
                              Unreserve
                            </button>
                          </>
                        ) : (
                          <span className="taken-label">
                            {item.status === "purchased"
                              ? "Gifted"
                              : "Reserved"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

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

            {selectedItem.imageUrl &&
              (selectedItem.imageUrl.startsWith("http") ||
                selectedItem.imageUrl.startsWith("data:")) && (
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
                {getItemStatusBadge(selectedItem)}
              </div>

              {selectedItem.url && (
                <a
                  href={extractUrl(selectedItem.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="detail-link-btn"
                  onClick={() => hapticFeedback.impact("light")}
                >
                  🔗 View Product
                </a>
              )}

              <div className="detail-actions">
                {selectedItem.status === "available" ? (
                  <button
                    className="reserve-btn"
                    onClick={() => {
                      setSelectedItem(null);
                      handleReserveItem(selectedItem);
                    }}
                    disabled={actionLoading === selectedItem.id}
                  >
                    {actionLoading === selectedItem.id ? "..." : "🎁 Reserve as Gift"}
                  </button>
                ) : selectedItem.status === "reserved" &&
                  selectedItem.reservedBy === currentUserId ? (
                  <>
                    <button
                      className="gifted-btn"
                      onClick={() => {
                        setSelectedItem(null);
                        handleMarkPurchased(selectedItem);
                      }}
                      disabled={actionLoading === selectedItem.id}
                    >
                      {actionLoading === selectedItem.id ? "..." : "✓ Mark as Gifted"}
                    </button>
                    <button
                      className="unreserve-btn"
                      onClick={() => {
                        setSelectedItem(null);
                        handleUnreserveItem(selectedItem);
                      }}
                      disabled={actionLoading === selectedItem.id}
                    >
                      Release reservation
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNavBar />
    </div>
  );
}
