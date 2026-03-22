import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { getTelegramUser, hapticFeedback } from "../utils/telegram";
import {
  createWishlist,
  getWishlists,
  getUnreadNotificationsCount,
  getFriends,
  getFollowers,
  getCompletedSocialTasks,
  markSocialTaskCompleted,
  syncCompletedSocialTasks,
} from "../services/supabase-api";
import BottomNavBar from "../components/BottomNavBar";
import SettingsModal from "../components/SettingsModal";
import CreateWishlistModal from "../components/CreateWishlistModal";
import LevelBadge from "../components/LevelBadge";
import LevelBoardModal from "../components/LevelBoardModal";
import { LEVELS, getUserLevel, getWishlistLimit } from "../config/levels";
import "./HomePage.css";

const COMPLETED_TASKS_KEY = "wb_completed_tasks";

function getCompletedTasksStorageKey(userId?: number): string {
  return `${COMPLETED_TASKS_KEY}_${userId ?? "anon"}`;
}

function loadCompletedTasks(userId?: number): string[] {
  try {
    const raw = localStorage.getItem(getCompletedTasksStorageKey(userId));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveCompletedTasks(ids: string[], userId?: number): void {
  localStorage.setItem(
    getCompletedTasksStorageKey(userId),
    JSON.stringify(ids),
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const {
    wishlists,
    userProfile,
    addWishlist,
    setWishlists,
    setLoading,
    isLoading,
    setUnreadNotificationsCount,
  } = useStore();
  const telegramUser = getTelegramUser();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [levelBoardOpen, setLevelBoardOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [friendsCount, setFriendsCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [isLevelLoading, setIsLevelLoading] = useState(true);

  const firstName = telegramUser?.first_name || "Guest";
  const photoUrl = telegramUser?.photo_url;

  const referrals = userProfile?.referrals ?? 0;
  const currentLevel =
    !isLevelLoading && userProfile
      ? getUserLevel(referrals, completedTaskIds)
      : null;
  const resolvedLevel = currentLevel ?? LEVELS[0];
  const wishlistLimit = currentLevel
    ? getWishlistLimit(referrals, completedTaskIds)
    : LEVELS[0].wishlistLimit;

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load all data in parallel for faster loading
        const [wishlistsData, notifCount, friendsData, followersData, remoteTasks] =
          await Promise.all([
            getWishlists(),
            getUnreadNotificationsCount(),
            getFriends(),
            getFollowers(),
            getCompletedSocialTasks(),
          ]);

        // Merge local and remote tasks
        const localTasks = loadCompletedTasks(telegramUser?.id);
        const mergedTasks = Array.from(
          new Set([...remoteTasks, ...localTasks]),
        );

        setCompletedTaskIds(mergedTasks);
        saveCompletedTasks(mergedTasks, telegramUser?.id);
        setWishlists(wishlistsData);
        setUnreadNotificationsCount(notifCount);
        setFriendsCount(friendsData.length);
        setFollowersCount(followersData.length);

        // Sync tasks in background (non-blocking)
        if (mergedTasks.length !== remoteTasks.length) {
          syncCompletedSocialTasks(mergedTasks)
            .then((syncedTasks) => {
              setCompletedTaskIds(syncedTasks);
              saveCompletedTasks(syncedTasks, telegramUser?.id);
            })
            .catch(console.error);
        }
      } catch (err) {
        console.error("Error loading data:", err);
        if (
          err instanceof Error &&
          !err.message.includes("not authenticated")
        ) {
          setError(err.message);
        }
      } finally {
        setLoading(false);
        setIsLevelLoading(false);
      }
    };

    if (telegramUser) {
      loadData();
    }
  }, [telegramUser, setWishlists, setLoading, setUnreadNotificationsCount]);

  const stats = {
    wishlists: wishlists.length,
    friends: friendsCount,
    followers: followersCount,
  };

  const handleAvatarClick = () => {
    hapticFeedback.impact("medium");
    setSettingsOpen(true);
  };

  const handleOpenCreateModal = () => {
    hapticFeedback.impact("medium");
    if (isLevelLoading) {
      return;
    }

    // Enforce wishlist limit (-1 = unlimited)
    if (wishlistLimit !== -1 && wishlists.length >= wishlistLimit) {
      hapticFeedback.notification("warning");
      setLevelBoardOpen(true);
      return;
    }
    setCreateModalOpen(true);
  };

  const handleMarkChannelDone = useCallback(
    (channelId: string) => {
      setCompletedTaskIds((prev) => {
        if (prev.includes(channelId)) return prev;
        const updated = [...prev, channelId];

        saveCompletedTasks(updated, telegramUser?.id);

        markSocialTaskCompleted(channelId).catch((err) => {
          console.warn("Failed to save completed task to server:", err);
        });

        return updated;
      });
    },
    [telegramUser?.id],
  );

  const handleInviteFriends = useCallback(() => {
    const botUsername = "WishBucketBot"; // update to your actual bot username
    const userId = telegramUser?.id ?? 0;
    const shareText = `🎁 Join me on WishBucket – the best wishlist app for Telegram!`;
    const botUrl = `https://t.me/${botUsername}/wishbucket?startapp=ref_${userId}`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(botUrl)}&text=${encodeURIComponent(shareText)}`;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).Telegram?.WebApp?.openTelegramLink(shareUrl);
    } catch {
      window.open(shareUrl, "_blank");
    }
  }, [telegramUser?.id]);

  const handleCreateWishlist = async (wishlistData: {
    name: string;
    description?: string;
    imageUrl?: string;
    eventDate?: string;
    isPublic: boolean;
    notifyFollowers: boolean;
  }) => {
    try {
      setLoading(true);
      // Pass all fields including imageUrl and eventDate
      const newWishlist = await createWishlist(
        {
          name: wishlistData.name,
          description: wishlistData.description || "",
          imageUrl: wishlistData.imageUrl,
          eventDate: wishlistData.eventDate,
          isPublic: wishlistData.isPublic,
          isDefault: wishlists.length === 0,
          userId: telegramUser?.id || 0,
        },
        wishlistData.notifyFollowers,
      );
      addWishlist(newWishlist);
      hapticFeedback.notification("success");
      navigate(`/wishlists/${newWishlist.id}`);
    } catch (err) {
      console.error("Error creating wishlist:", err);
      hapticFeedback.notification("error");
    } finally {
      setLoading(false);
    }
  };

  const handleWishlistClick = (wishlistId: string) => {
    hapticFeedback.impact("light");
    navigate(`/wishlists/${wishlistId}`);
  };

  return (
    <div className="home-container">
      {/* Header */}
      <header className="home-header animate-slide-up">
        <button className="user-avatar-btn" onClick={handleAvatarClick}>
          {photoUrl ? (
            <img src={photoUrl} alt={firstName} />
          ) : (
            <span>{firstName[0]?.toUpperCase()}</span>
          )}
        </button>
        <div className="header-text">
          <span className="greeting-label">Welcome back</span>
          <h1 className="greeting-name">{firstName} 👋</h1>
        </div>
        <LevelBadge
          currentLevel={resolvedLevel}
          isLoading={isLevelLoading || !userProfile}
          onClick={() => {
            if (isLevelLoading || !userProfile) return;
            hapticFeedback.impact("light");
            setLevelBoardOpen(true);
          }}
        />
      </header>

      {/* Stats */}
      <div
        className="stats-row animate-slide-up"
        style={{ animationDelay: "0.05s" }}
      >
        <div className="stat-card">
          <span className="stat-number">{stats.wishlists}</span>
          <span className="stat-text">Wishlists</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{stats.friends}</span>
          <span className="stat-text">Friends</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{stats.followers}</span>
          <span className="stat-text">Followers</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="home-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Loading...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Try Again</button>
          </div>
        ) : wishlists.length === 0 ? (
          <div
            className="create-wishlist-section animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="create-card" onClick={handleOpenCreateModal}>
              <div className="product-images">
                <div className="product-card product-1">
                  <img
                    src="https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/airpods-max-select-skyblue-202011?wid=400&hei=400&fmt=jpeg&qlt=95"
                    alt="Headphones"
                  />
                </div>
                <div className="product-card product-2">
                  <img
                    src="https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop"
                    alt="Bag"
                  />
                </div>
              </div>
              <h2>Create your first wishlist</h2>
              <button className="create-button">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Wishlist</span>
              </button>
            </div>
          </div>
        ) : (
          <div
            className="wishlists-section animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="section-header">
              <h2>My Wishlists</h2>
              <button
                className="see-all"
                onClick={() => navigate("/wishlists")}
              >
                See all
              </button>
            </div>
            <div className="wishlists-grid">
              {wishlists.slice(0, 4).map((wishlist, index) => (
                <div
                  key={wishlist.id}
                  className="wishlist-card animate-scale-in"
                  style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                  onClick={() => handleWishlistClick(wishlist.id)}
                >
                  <div className="wishlist-icon">
                    {wishlist.imageUrl ? (
                      wishlist.imageUrl.startsWith("http") ||
                      wishlist.imageUrl.startsWith("data:") ? (
                        <img src={wishlist.imageUrl} alt={wishlist.name} />
                      ) : (
                        wishlist.imageUrl
                      )
                    ) : wishlist.isDefault ? (
                      "⭐"
                    ) : (
                      "🎁"
                    )}
                  </div>
                  <h3>{wishlist.name}</h3>
                  <p>{wishlist.items.length} items</p>
                </div>
              ))}
              <div
                className="wishlist-card add-card"
                onClick={handleOpenCreateModal}
              >
                <div className="add-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
                <h3>New List</h3>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div
          className="quick-actions animate-slide-up"
          style={{ animationDelay: "0.15s" }}
        >
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <button
              className="action-card"
              onClick={() => navigate("/find-gift")}
            >
              <div className="action-icon gift">
                <span>🎁</span>
              </div>
              <span>Find Gift</span>
            </button>
            <button
              className="action-card"
              onClick={() => navigate("/friends")}
            >
              <div className="action-icon friends">
                <span>👥</span>
              </div>
              <span>Friends</span>
            </button>
            <button
              className="action-card"
              onClick={() => navigate("/inspiration")}
            >
              <div className="action-icon inspiration">
                <span>✨</span>
              </div>
              <span>Inspiration</span>
            </button>
            <button
              className="action-card"
              onClick={() => navigate("/secret-santa")}
            >
              <div className="action-icon santa">
                <span>🎄</span>
              </div>
              <span>Secret Santa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavBar />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        user={{ firstName, photoUrl }}
      />

      {/* Create Wishlist Modal */}
      <CreateWishlistModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreateWishlist={handleCreateWishlist}
        isImageUploadLocked={resolvedLevel.level < 1}
        onUnlockRequest={() => {
          setCreateModalOpen(false);
          setLevelBoardOpen(true);
        }}
      />

      {/* Level Board Modal */}
      <LevelBoardModal
        isOpen={levelBoardOpen}
        onClose={() => setLevelBoardOpen(false)}
        currentLevel={resolvedLevel}
        referrals={referrals}
        completedTaskIds={completedTaskIds}
        onMarkChannelDone={handleMarkChannelDone}
        onInviteFriends={handleInviteFriends}
      />
    </div>
  );
}
