import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import {
  getFriends,
  getFollowers,
  searchUsers,
  addFriend,
  removeFriend,
  getUserByUsername,
  getReferralStats,
} from "../services/supabase-api";
import {
  showTelegramAlert,
  openTelegramLink,
  hapticFeedback,
} from "../utils/telegram";
import BottomNavBar from "../components/BottomNavBar";
import { Friend, ReferralStats } from "../types";
import "./FriendsPage.css";

type TabType = "following" | "followers" | "search";

export default function FriendsPage() {
  const navigate = useNavigate();
  const { setLoading, isLoading } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>("following");
  const [searchQuery, setSearchQuery] = useState("");
  const [usernameInput, setUsernameInput] = useState("");

  // Data states
  const [following, setFollowing] = useState<Friend[]>([]);
  const [followers, setFollowers] = useState<Friend[]>([]);
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(
    null
  );
  const [isSearching, setIsSearching] = useState(false);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [friendsData, followersData, statsData] = await Promise.all([
        getFriends(),
        getFollowers(),
        getReferralStats(),
      ]);
      setFollowing(friendsData);
      setFollowers(followersData);
      setReferralStats(statsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchUsers(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error("Error searching:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleFollow = async (userId: number) => {
    try {
      hapticFeedback.impact("medium");
      await addFriend(userId);

      // Update local state
      setFollowing((prev) => {
        const user = [...searchResults, ...followers].find(
          (u) => u.id === userId
        );
        if (user) {
          return [...prev, { ...user, isFollowing: true }];
        }
        return prev;
      });

      setSearchResults((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isFollowing: true } : u))
      );

      setFollowers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isFollowing: true } : u))
      );

      hapticFeedback.notification("success");
    } catch (error) {
      console.error("Error following:", error);
      showTelegramAlert("Failed to follow user");
      hapticFeedback.notification("error");
    }
  };

  const handleUnfollow = async (userId: number) => {
    try {
      hapticFeedback.impact("light");
      await removeFriend(userId);

      // Update local state
      setFollowing((prev) => prev.filter((u) => u.id !== userId));

      setSearchResults((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isFollowing: false } : u))
      );

      setFollowers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isFollowing: false } : u))
      );

      hapticFeedback.notification("success");
    } catch (error) {
      console.error("Error unfollowing:", error);
      showTelegramAlert("Failed to unfollow user");
    }
  };

  const handleAddByUsername = async () => {
    if (!usernameInput.trim()) {
      showTelegramAlert("Please enter a username");
      return;
    }

    try {
      setLoading(true);
      const user = await getUserByUsername(usernameInput);

      if (!user) {
        showTelegramAlert(
          "User not found. Make sure they're using WishBucket!"
        );
        return;
      }

      if (user.isFollowing) {
        showTelegramAlert("You're already following this user");
        return;
      }

      await handleFollow(user.id);
      setUsernameInput("");
      showTelegramAlert(`You're now following ${user.firstName}!`);
    } catch (error) {
      console.error("Error adding by username:", error);
      showTelegramAlert("Failed to find user");
    } finally {
      setLoading(false);
    }
  };

  const handleShareInvite = () => {
    hapticFeedback.impact("medium");
    const message = `Join me on WishBucket! Create and share wishlists with friends 🎁`;
    const link = referralStats?.referralLink || "https://t.me/wishbucket_bot";
    openTelegramLink(
      `https://t.me/share/url?url=${encodeURIComponent(
        link
      )}&text=${encodeURIComponent(message)}`
    );
  };

  const handleCopyReferralLink = () => {
    if (referralStats?.referralLink) {
      navigator.clipboard.writeText(referralStats.referralLink);
      hapticFeedback.notification("success");
      showTelegramAlert("Referral link copied!");
    }
  };

  const handleTabChange = (tab: TabType) => {
    hapticFeedback.selection();
    setActiveTab(tab);
  };

  const handleViewProfile = (userId: number) => {
    hapticFeedback.impact("light");
    navigate(`/user/${userId}`);
  };

  const renderUserCard = (user: Friend, showFollowBack = false) => (
    <div key={user.id} className="friend-card animate-slide-up">
      <div
        className="friend-clickable"
        onClick={() => handleViewProfile(user.id)}
      >
        <div className="friend-avatar">
          {user.photoUrl ? (
            <img src={user.photoUrl} alt={user.firstName} />
          ) : (
            <span>{user.firstName[0]?.toUpperCase()}</span>
          )}
        </div>
        <div className="friend-info">
          <h4>
            {user.firstName} {user.lastName || ""}
          </h4>
          {user.username && (
            <span className="friend-username">@{user.username}</span>
          )}
          {showFollowBack && user.isFollowedBy && !user.isFollowing && (
            <span className="follows-you-badge">Follows you</span>
          )}
        </div>
      </div>
      {user.isFollowing ? (
        <button
          className="following-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleUnfollow(user.id);
          }}
        >
          Following
        </button>
      ) : (
        <button
          className="follow-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleFollow(user.id);
          }}
        >
          {user.isFollowedBy ? "Follow Back" : "Follow"}
        </button>
      )}
    </div>
  );

  return (
    <div className="friends-container">
      {/* Header */}
      <header className="friends-header">
        <h1>Friends</h1>
        <button className="invite-btn" onClick={handleShareInvite}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          Invite
        </button>
      </header>

      {/* Referral Stats Card */}
      {referralStats && (
        <div className="referral-card">
          <div className="referral-header">
            <span className="referral-icon">🎁</span>
            <div className="referral-text">
              <h3>Invite Friends, Earn Rewards!</h3>
              <p>Share your link and get bonus points</p>
            </div>
          </div>
          <div className="referral-stats">
            <div className="stat-item">
              <span className="stat-value">{referralStats.totalReferrals}</span>
              <span className="stat-label">Referrals</span>
            </div>
            <div
              className="stat-item stat-item-points"
              onClick={() => navigate("/market")}
            >
              <span className="stat-value">
                {referralStats.totalBonusEarned}
              </span>
              <span className="stat-label">Points 💎</span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="referral-quick-actions">
            <button
              className="quick-action-btn shop-btn"
              onClick={() => navigate("/market")}
            >
              <span className="btn-icon">🎁</span>
              <span>Shop</span>
            </button>
            <button
              className="quick-action-btn tasks-btn"
              onClick={() => navigate("/tasks")}
            >
              <span className="btn-icon">⭐</span>
              <span>Earn</span>
            </button>
          </div>

          <div className="referral-actions">
            <button className="copy-link-btn" onClick={handleCopyReferralLink}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              Copy Link
            </button>
            <button className="share-link-btn" onClick={handleShareInvite}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                <polyline points="16,6 12,2 8,6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              Share
            </button>
          </div>
          <div className="referral-code">
            Code: <strong>{referralStats.referralCode}</strong>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="friends-tabs">
        <button
          className={`tab-btn ${activeTab === "following" ? "active" : ""}`}
          onClick={() => handleTabChange("following")}
        >
          Following
          {following.length > 0 && (
            <span className="tab-count">{following.length}</span>
          )}
        </button>
        <button
          className={`tab-btn ${activeTab === "followers" ? "active" : ""}`}
          onClick={() => handleTabChange("followers")}
        >
          Followers
          {followers.length > 0 && (
            <span className="tab-count">{followers.length}</span>
          )}
        </button>
        <button
          className={`tab-btn ${activeTab === "search" ? "active" : ""}`}
          onClick={() => handleTabChange("search")}
        >
          Find
        </button>
      </div>

      {/* Content based on active tab */}
      <div className="friends-content">
        {activeTab === "following" && (
          <>
            {isLoading ? (
              <div className="loading-state">
                <div className="loading-spinner" />
              </div>
            ) : following.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>Not following anyone yet</h3>
                <p>
                  Find friends to see their wishlists and get notified about
                  their updates!
                </p>
                <button
                  className="add-friend-btn"
                  onClick={() => handleTabChange("search")}
                >
                  Find Friends
                </button>
              </div>
            ) : (
              <div className="friends-list">
                {following.map((user) => renderUserCard(user))}
              </div>
            )}
          </>
        )}

        {activeTab === "followers" && (
          <>
            {isLoading ? (
              <div className="loading-state">
                <div className="loading-spinner" />
              </div>
            ) : followers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🌟</div>
                <h3>No followers yet</h3>
                <p>Share your profile and invite friends to get followers!</p>
                <button className="share-btn" onClick={handleShareInvite}>
                  Share Profile
                </button>
              </div>
            ) : (
              <div className="friends-list">
                {followers.map((user) => renderUserCard(user, true))}
              </div>
            )}
          </>
        )}

        {activeTab === "search" && (
          <div className="search-content">
            {/* Search by username */}
            <div className="add-by-username">
              <h3>Add by Username</h3>
              <p>Enter a Telegram username to find them</p>
              <div className="username-input-wrapper">
                <span className="at-symbol">@</span>
                <input
                  type="text"
                  placeholder="username"
                  value={usernameInput}
                  onChange={(e) =>
                    setUsernameInput(e.target.value.replace("@", ""))
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleAddByUsername()}
                />
                <button
                  className="add-btn"
                  onClick={handleAddByUsername}
                  disabled={isLoading}
                >
                  {isLoading ? "..." : "Add"}
                </button>
              </div>
            </div>

            {/* Search users */}
            <div className="search-section">
              <h3>Search Users</h3>
              <div className="search-input-wrapper">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by name or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="clear-btn"
                    onClick={() => setSearchQuery("")}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Search Results */}
            {isSearching ? (
              <div className="loading-state small">
                <div className="loading-spinner" />
                <p>Searching...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="search-results">
                <h4>Results</h4>
                <div className="friends-list">
                  {searchResults.map((user) => renderUserCard(user, true))}
                </div>
              </div>
            ) : searchQuery.length >= 2 ? (
              <div className="no-results">
                <p>No users found for "{searchQuery}"</p>
                <span>Try a different search or invite them!</span>
              </div>
            ) : null}

            {/* Find from contacts hint */}
            <div className="contacts-hint">
              <div className="hint-icon">📱</div>
              <div className="hint-text">
                <h4>Find from Contacts</h4>
                <p>
                  Coming soon! We'll help you find friends from your Telegram
                  contacts who use WishBucket.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNavBar />
    </div>
  );
}
