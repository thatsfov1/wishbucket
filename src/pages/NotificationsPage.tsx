import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  getNotifications, 
  markNotificationRead, 
  markAllNotificationsRead,
  getReferralStats,
} from "../services/supabase-api";
import { hapticFeedback, openTelegramLink } from "../utils/telegram";
import { Notification, ReferralStats } from "../types";
import BottomNavBar from "../components/BottomNavBar";
import "./NotificationsPage.css";

const getNotificationIcon = (type: string): string => {
  switch (type) {
    case 'new_follower': return '👤';
    case 'item_reserved': return '🎁';
    case 'item_purchased': return '✅';
    case 'wishlist_shared': return '📤';
    case 'birthday_reminder': return '🎂';
    case 'friend_added_item': return '✨';
    case 'referral_signup': return '🎉';
    case 'bonus_earned': return '💎';
    default: return '🔔';
  }
};

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [notificationsData, statsData] = await Promise.all([
        getNotifications(),
        getReferralStats(),
      ]);
      setNotifications(notificationsData);
      setReferralStats(statsData);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    hapticFeedback.impact("light");
    navigate(-1);
  };

  const handleNotificationClick = async (notification: Notification) => {
    hapticFeedback.selection();
    
    if (!notification.read) {
      await markNotificationRead(notification.id);
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
    }
    
    // Navigate based on notification type
    if (notification.data?.wishlistId) {
      navigate(`/wishlists/${notification.data.wishlistId}`);
    } else if (notification.data?.userId) {
      // Could navigate to user profile in future
    }
  };

  const handleMarkAllRead = async () => {
    hapticFeedback.impact("medium");
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleShare = () => {
    hapticFeedback.impact("medium");
    const link = referralStats?.referralLink || "https://t.me/wishbucket_bot";
    openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=Check out WishBucket - the best way to manage and share wishlists! 🎁`);
  };

  const handleInvite = () => {
    hapticFeedback.impact("medium");
    const link = referralStats?.referralLink || "https://t.me/wishbucket_bot/app?startapp=invite";
    openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=Join me on WishBucket! Create and share wishlists with friends 🎁`);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notifications-container">
      {/* Header */}
      <header className="notifications-header">
        <button className="back-btn" onClick={handleBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1>Notifications</h1>
        {unreadCount > 0 && (
          <button className="mark-all-btn" onClick={handleMarkAllRead}>
            Mark all read
          </button>
        )}
      </header>

      {/* Referral Banner */}
      {referralStats && (
        <div className="referral-banner">
          <div className="banner-content">
            <span className="banner-icon">🎁</span>
            <div className="banner-text">
              <strong>Invite friends, earn rewards!</strong>
              <span>{referralStats.totalReferrals} referrals • {referralStats.totalBonusEarned} points</span>
            </div>
          </div>
          <button className="banner-btn" onClick={handleInvite}>
            Invite
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-share-section">
        <h3>Share & Invite</h3>
        <div className="share-buttons">
          <button className="share-btn telegram" onClick={handleInvite}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
            </svg>
            Invite via Telegram
          </button>
          <button className="share-btn copy" onClick={handleShare}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
              <polyline points="16,6 12,2 8,6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            Share Profile
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="notifications-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-notifications">
            <div className="empty-icon">🔔</div>
            <h3>No notifications yet</h3>
            <p>When something happens, you'll see it here</p>
            <button className="invite-friends-btn" onClick={handleInvite}>
              Invite Friends to Get Started
            </button>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notification, index) => (
              <div 
                key={notification.id}
                className={`notification-item ${!notification.read ? "unread" : ""} animate-slide-up`}
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-avatar">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notification-content">
                  <div className="notification-header">
                    <span className="notification-title">{notification.title}</span>
                    <span className="notification-time">{formatTimeAgo(notification.createdAt)}</span>
                  </div>
                  <p className="notification-message">{notification.message}</p>
                </div>
                {!notification.read && <div className="unread-dot" />}
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNavBar />
    </div>
  );
}
