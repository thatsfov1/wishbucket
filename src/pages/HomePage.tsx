import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { getTelegramUser, hapticFeedback } from "../utils/telegram";
import {
  createWishlist,
  getHomePageData,
  HomePageData,
  WishlistSummary,
} from "../services/supabase-api";
import BottomNavBar from "../components/BottomNavBar";
import SettingsModal from "../components/SettingsModal";
import CreateWishlistModal from "../components/CreateWishlistModal";
import LevelBadge from "../components/LevelBadge";
import LevelBoardModal from "../components/LevelBoardModal";
import { LEVELS, getUserLevel, getWishlistLimit } from "../config/levels";
import "./HomePage.css";

const HOME_CACHE_PREFIX = "wb_home_cache_v1_";

const readHomeCache = (userId: number | undefined): HomePageData | null => {
  if (!userId) return null;
  try {
    const raw = sessionStorage.getItem(`${HOME_CACHE_PREFIX}${userId}`);
    return raw ? (JSON.parse(raw) as HomePageData) : null;
  } catch {
    return null;
  }
};

const writeHomeCache = (userId: number | undefined, data: HomePageData) => {
  if (!userId) return;
  try {
    sessionStorage.setItem(
      `${HOME_CACHE_PREFIX}${userId}`,
      JSON.stringify(data),
    );
  } catch {
    /* ignore quota errors */
  }
};

export default function HomePage() {
  const navigate = useNavigate();
  const { userProfile, addWishlist, setWishlists } = useStore();
  const telegramUser = getTelegramUser();

  const cachedHome = useMemo(
    () => readHomeCache(telegramUser?.id),
    [telegramUser?.id],
  );

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [levelBoardOpen, setLevelBoardOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [friendsCount, setFriendsCount] = useState(
    cachedHome?.friendsCount ?? 0,
  );
  const [followersCount, setFollowersCount] = useState(
    cachedHome?.followersCount ?? 0,
  );
  const [isLevelLoading, setIsLevelLoading] = useState(true);
  const [wishlistSummaries, setWishlistSummaries] = useState<WishlistSummary[]>(
    cachedHome?.wishlists ?? [],
  );
  const [isHomeLoading, setIsHomeLoading] = useState(!cachedHome);
  const [hasLoaded, setHasLoaded] = useState(!!cachedHome);

  const firstName = telegramUser?.first_name || "Guest";
  const photoUrl = telegramUser?.photo_url;

  const referrals = userProfile?.referrals ?? 0;
  const currentLevel = !isLevelLoading && userProfile ? getUserLevel(referrals) : null;
  const resolvedLevel = currentLevel ?? LEVELS[0];
  const wishlistLimit = currentLevel
    ? getWishlistLimit(referrals)
    : LEVELS[0].wishlistLimit;

  useEffect(() => {
    if (!telegramUser) return;

    let cancelled = false;
    const loadData = async () => {
      try {
        setError(null);

        const homeData = await getHomePageData();
        if (cancelled) return;

        setWishlistSummaries(homeData.wishlists);
        setFriendsCount(homeData.friendsCount);
        setFollowersCount(homeData.followersCount);
        writeHomeCache(telegramUser.id, homeData);

        const userId = telegramUser.id || 0;
        setWishlists(
          homeData.wishlists.map((s) => ({
            id: s.id,
            userId,
            name: s.name,
            description: s.description,
            imageUrl: s.imageUrl,
            eventDate: s.eventDate,
            isPublic: s.isPublic,
            isDefault: s.isDefault,
            createdAt: s.createdAt,
            updatedAt: s.createdAt,
            items: [],
          })),
        );
      } catch (err) {
        if (cancelled) return;
        console.error("Error loading data:", err);
        if (err instanceof Error && !err.message.includes("not authenticated")) {
          setError(err.message);
        }
      } finally {
        if (cancelled) return;
        setIsHomeLoading(false);
        setHasLoaded(true);
        setIsLevelLoading(false);
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, [telegramUser, setWishlists]);

  const stats = {
    wishlists: wishlistSummaries.length,
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

    if (wishlistLimit !== -1 && wishlistSummaries.length >= wishlistLimit) {
      hapticFeedback.notification("warning");
      setLevelBoardOpen(true);
      return;
    }
    setCreateModalOpen(true);
  };

  const handleInviteFriends = useCallback(() => {
    const botUsername = "wishbucket_bot";
    const userId = telegramUser?.id ?? 0;
    const shareText = `🎁 Join me on wishbucket – the best wishlist app for Telegram!`;
    const botUrl = `https://t.me/${botUsername}/app?startapp=ref_${userId}`;
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
      const newWishlist = await createWishlist(
        {
          name: wishlistData.name,
          description: wishlistData.description || "",
          imageUrl: wishlistData.imageUrl,
          eventDate: wishlistData.eventDate,
          isPublic: wishlistData.isPublic,
          isDefault: wishlistSummaries.length === 0,
          userId: telegramUser?.id || 0,
        },
        wishlistData.notifyFollowers,
      );

      const updatedSummaries: WishlistSummary[] = [
        {
          id: newWishlist.id,
          name: newWishlist.name,
          description: newWishlist.description,
          imageUrl: newWishlist.imageUrl,
          eventDate: newWishlist.eventDate,
          isPublic: newWishlist.isPublic,
          isDefault: newWishlist.isDefault,
          itemCount: 0,
          createdAt: newWishlist.createdAt,
        },
        ...wishlistSummaries,
      ];
      setWishlistSummaries(updatedSummaries);
      writeHomeCache(telegramUser?.id, {
        wishlists: updatedSummaries,
        friendsCount,
        followersCount,
      });
      addWishlist(newWishlist);
      hapticFeedback.notification("success");
      navigate(`/wishlists/${newWishlist.id}`);
    } catch (err) {
      console.error("Error creating wishlist:", err);
      hapticFeedback.notification("error");
    }
  };

  const handleWishlistClick = (wishlistId: string) => {
    hapticFeedback.impact("light");
    navigate(`/wishlists/${wishlistId}`);
  };

  return (
    <div className="home-container">
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
        <button
          type="button"
          className="stat-card"
          onClick={() => {
            hapticFeedback.selection();
            navigate("/wishlists");
          }}
        >
          <span className="stat-number">{stats.wishlists}</span>
          <span className="stat-text">Wishlists</span>
        </button>
        <button
          type="button"
          className="stat-card"
          onClick={() => {
            hapticFeedback.selection();
            navigate("/friends?tab=following");
          }}
        >
          <span className="stat-number">{stats.friends}</span>
          <span className="stat-text">Following</span>
        </button>
        <button
          type="button"
          className="stat-card"
          onClick={() => {
            hapticFeedback.selection();
            navigate("/friends?tab=followers");
          }}
        >
          <span className="stat-number">{stats.followers}</span>
          <span className="stat-text">Followers</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="home-content">
        {error && hasLoaded ? (
          <div className="error-state">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Try Again</button>
          </div>
        ) : !hasLoaded || isHomeLoading || wishlistSummaries.length > 0 ? (
          <div
            className="wishlists-section animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="section-header">
              <h2>My Wishlists</h2>
              {hasLoaded && wishlistSummaries.length > 0 && (
                <button
                  className="see-all"
                  onClick={() => navigate("/wishlists")}
                >
                  See all
                </button>
              )}
            </div>
            <div className="wishlists-grid">
              {!hasLoaded ? (
                <>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={`sk-${i}`}
                      className="wishlist-card skeleton-card"
                      style={{ animationDelay: `${i * 0.08}s` }}
                      aria-hidden="true"
                    >
                      <div className="skeleton-shimmer skeleton-icon" />
                      <div className="skeleton-shimmer skeleton-line skeleton-line-title" />
                      <div className="skeleton-shimmer skeleton-line skeleton-line-sub" />
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
                </>
              ) : (
                <>
                  {wishlistSummaries.slice(0, 4).map((wishlist, index) => (
                    <div
                      key={wishlist.id}
                      className="wishlist-card wishlist-card-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
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
                      <p>{wishlist.itemCount} items</p>
                    </div>
                  ))}
                  <div
                    className="wishlist-card add-card wishlist-card-fade-in"
                    style={{
                      animationDelay: `${
                        Math.min(wishlistSummaries.length, 4) * 0.05
                      }s`,
                    }}
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
                </>
              )}
            </div>
          </div>
        ) : (
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

      <BottomNavBar />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        user={{ firstName, photoUrl }}
      />

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


      <LevelBoardModal
        isOpen={levelBoardOpen}
        onClose={() => setLevelBoardOpen(false)}
        currentLevel={resolvedLevel}
        referrals={referrals}
        onInviteFriends={handleInviteFriends}
      />
    </div>
  );
}
