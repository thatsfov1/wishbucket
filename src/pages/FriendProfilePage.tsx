import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  getUserById, 
  getUserPublicWishlists, 
  addFriend, 
  removeFriend,
  reserveItem,
  purchaseItem,
} from "../services/supabase-api";
import { hapticFeedback, showTelegramAlert, showTelegramConfirm, getTelegramUserId } from "../utils/telegram";
import { Friend, Wishlist, WishlistItem } from "../types";
import BottomNavBar from "../components/BottomNavBar";
import "./FriendProfilePage.css";

export default function FriendProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const currentUserId = getTelegramUserId();
  
  const [user, setUser] = useState<Friend | null>(null);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [selectedWishlist, setSelectedWishlist] = useState<Wishlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const targetUserId = parseInt(userId!);
      
      const [userData, wishlistsData] = await Promise.all([
        getUserById(targetUserId),
        getUserPublicWishlists(targetUserId),
      ]);
      
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
    if (item.status !== 'available') {
      showTelegramAlert("This item is already reserved or purchased");
      return;
    }

    const confirmed = await showTelegramConfirm(
      `Reserve "${item.name}" as a gift for ${user?.firstName}?`
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
          items: selectedWishlist.items.map(i => 
            i.id === item.id ? { ...i, status: 'reserved', reservedBy: currentUserId || undefined } : i
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

  const handleMarkPurchased = async (item: WishlistItem) => {
    const confirmed = await showTelegramConfirm(
      `Mark "${item.name}" as purchased/gifted?`
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
          items: selectedWishlist.items.map(i => 
            i.id === item.id ? { ...i, status: 'purchased', purchasedBy: currentUserId || undefined } : i
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
    if (item.status === 'reserved') {
      return <span className="status-badge reserved">Reserved</span>;
    }
    if (item.status === 'purchased') {
      return <span className="status-badge purchased">Gifted ✓</span>;
    }
    return null;
  };

  const totalItems = wishlists.reduce((sum, w) => sum + w.items.length, 0);

  if (isLoading) {
    return (
      <div className="friend-profile-container">
        <header className="profile-header">
          <button className="back-btn" onClick={handleBack}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        <h2>{user.firstName} {user.lastName || ""}</h2>
        {user.username && <p className="username">@{user.username}</p>}
        
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
          {actionLoading === "follow" ? "..." : user.isFollowing ? "Following" : "Follow"}
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
            {wishlists.map(wishlist => (
              <button
                key={wishlist.id}
                className={`wishlist-tab ${selectedWishlist?.id === wishlist.id ? "active" : ""}`}
                onClick={() => { setSelectedWishlist(wishlist); hapticFeedback.selection(); }}
              >
                {wishlist.isDefault ? "⭐" : "📝"} {wishlist.name}
                <span className="tab-count">{wishlist.items.length}</span>
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
                      className={`item-card ${item.status !== 'available' ? 'item-taken' : ''}`}
                      style={{ animationDelay: `${index * 0.05}s` }}
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
                      
                      <div className="item-content">
                        <div className="item-header">
                          <h4>{item.name}</h4>
                          {getItemStatusBadge(item)}
                        </div>
                        {item.description && (
                          <p className="item-description">{item.description}</p>
                        )}
                        {item.price && (
                          <span className="item-price">{item.currency || '$'}{item.price.toFixed(2)}</span>
                        )}
                      </div>

                      <div className="item-actions">
                        {item.status === 'available' ? (
                          <button 
                            className="reserve-btn"
                            onClick={() => handleReserveItem(item)}
                            disabled={actionLoading === item.id}
                          >
                            {actionLoading === item.id ? "..." : "Reserve"}
                          </button>
                        ) : item.status === 'reserved' && item.reservedBy === currentUserId ? (
                          <button 
                            className="gifted-btn"
                            onClick={() => handleMarkPurchased(item)}
                            disabled={actionLoading === item.id}
                          >
                            {actionLoading === item.id ? "..." : "Mark Gifted"}
                          </button>
                        ) : (
                          <span className="taken-label">
                            {item.status === 'purchased' ? "Gifted" : "Reserved"}
                          </span>
                        )}
                        
                        {item.url && (
                          <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="buy-link"
                            onClick={() => hapticFeedback.impact("light")}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                              <polyline points="15,3 21,3 21,9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </a>
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

      <BottomNavBar />
    </div>
  );
}

