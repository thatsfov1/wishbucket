import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "../store/useStore";
import { getWishlists, createWishlist } from "../services/supabase-api";
import { hapticFeedback, getTelegramUser } from "../utils/telegram";
import BottomNavBar from "../components/BottomNavBar";
import CreateWishlistModal from "../components/CreateWishlistModal";
import "./WishlistsPage.css";

export default function WishlistsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { wishlists, setWishlists, addWishlist, setLoading, isLoading } =
    useStore();
  const [showCreateModal, setShowCreateModal] = useState(
    searchParams.get("action") === "create",
  );
  const telegramUser = getTelegramUser();

  useEffect(() => {
    const loadWishlists = async () => {
      try {
        setLoading(true);
        const data = await getWishlists();
        setWishlists(data);
      } catch (error) {
        console.error("Error loading wishlists:", error);
      } finally {
        setLoading(false);
      }
    };
    if (telegramUser) {
      loadWishlists();
    }
  }, [setWishlists, setLoading, telegramUser]);

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
    } catch (error) {
      console.error("Error creating wishlist:", error);
      hapticFeedback.notification("error");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    hapticFeedback.impact("light");
    navigate(-1);
  };

  return (
    <div className="wishlists-container">
      {/* Header */}
      <header className="wishlists-header">
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
        <h1>My Wishlists</h1>
        <button
          className="create-btn-small"
          onClick={() => {
            hapticFeedback.impact("medium");
            setShowCreateModal(true);
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </header>

      {/* Content */}
      <div className="wishlists-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Loading wishlists...</p>
          </div>
        ) : wishlists.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No wishlists yet</h3>
            <p>Create your first wishlist to start adding items</p>
            <button
              className="create-first-btn"
              onClick={() => setShowCreateModal(true)}
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
              Create Wishlist
            </button>
          </div>
        ) : (
          <div className="wishlists-list">
            {wishlists.map((wishlist, index) => (
              <div
                key={wishlist.id}
                className="wishlist-item animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => {
                  hapticFeedback.impact("light");
                  navigate(`/wishlists/${wishlist.id}`);
                }}
              >
                <div className="wishlist-emoji">
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
                <div className="wishlist-info">
                  <div className="wishlist-name-row">
                    <h3>{wishlist.name}</h3>
                    {wishlist.isPublic && (
                      <span className="public-badge">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <circle cx="12" cy="12" r="10" />
                        </svg>
                        Public
                      </span>
                    )}
                  </div>
                  <p className="wishlist-meta">
                    {wishlist.items.length} item
                    {wishlist.items.length !== 1 ? "s" : ""}
                    {wishlist.description &&
                      ` · ${wishlist.description.slice(0, 30)}${wishlist.description.length > 30 ? "..." : ""}`}
                  </p>
                </div>
                <svg
                  className="chevron"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNavBar />

      <CreateWishlistModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateWishlist={handleCreateWishlist}
      />
    </div>
  );
}
