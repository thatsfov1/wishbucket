import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";
import Avatar from "../components/Avatar";
import { useStore } from "../store/useStore";
import { getBirthdayReminders } from "../services/api";
import { getTelegramUser } from "../utils/telegram";
// Date formatting utilities available if needed
import "./HomePage.css";

export default function HomePage() {
  const navigate = useNavigate();
  const { wishlists, birthdayReminders, userProfile, setBirthdayReminders } =
    useStore();
  const telegramUser = getTelegramUser();

  useEffect(() => {
    const loadReminders = async () => {
      try {
        const reminders = await getBirthdayReminders();
        setBirthdayReminders(reminders);
      } catch (error) {
        console.error("Error loading birthday reminders:", error);
      }
    };
    loadReminders();
  }, [setBirthdayReminders]);

  const upcomingBirthdays = birthdayReminders
    .filter((r) => r.daysUntil <= 7 && r.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const defaultWishlist = wishlists.find((w) => w.isDefault);
  const otherWishlists = wishlists.filter((w) => !w.isDefault);

  return (
    <Layout title="Wish Bucket" showBackButton={false}>
      <div className="home-page">
        {/* Welcome Section */}
        <div className="welcome-section">
          <div className="welcome-header">
            <Avatar user={telegramUser} size="large" />
            <div>
              <h1>Welcome to Wish Bucket! 🎁</h1>
              <p>Your personal wishlist manager for Telegram</p>
            </div>
          </div>
        </div>

        {/* Birthday Reminders */}
        {upcomingBirthdays.length > 0 && (
          <Card>
            <h2 className="section-title">🎂 Upcoming Birthdays</h2>
            {upcomingBirthdays.map((reminder) => (
              <div key={reminder.friendId} className="birthday-reminder">
                <div className="birthday-info">
                  <strong>{reminder.friendName}</strong>
                  <span className="birthday-days">
                    {reminder.daysUntil === 0
                      ? "Today!"
                      : `${reminder.daysUntil} day${
                          reminder.daysUntil !== 1 ? "s" : ""
                        }`}
                  </span>
                </div>
                <Button
                  size="small"
                  onClick={() =>
                    navigate(`/wishlists?friend=${reminder.friendId}`)
                  }
                >
                  View Wishlist
                </Button>
              </div>
            ))}
          </Card>
        )}

        {/* Quick Actions */}
        <div className="quick-actions">
          <Button fullWidth onClick={() => navigate("/wishlists")} size="large">
            📝 My Wishlists
          </Button>
          <Button
            fullWidth
            variant="secondary"
            onClick={() => navigate("/wishlists?action=create")}
            size="large"
          >
            ➕ Create Wishlist
          </Button>
        </div>

        {/* Default Wishlist */}
        {defaultWishlist && (
          <Card onClick={() => navigate(`/wishlists/${defaultWishlist.id}`)}>
            <div className="wishlist-preview">
              <h3>{defaultWishlist.name}</h3>
              <p className="wishlist-item-count">
                {defaultWishlist.items.length} item
                {defaultWishlist.items.length !== 1 ? "s" : ""}
              </p>
            </div>
          </Card>
        )}

        {/* Other Wishlists */}
        {otherWishlists.length > 0 && (
          <div className="wishlists-section">
            <h2 className="section-title">Your Wishlists</h2>
            {otherWishlists.map((wishlist) => (
              <Card
                key={wishlist.id}
                onClick={() => navigate(`/wishlists/${wishlist.id}`)}
              >
                <div className="wishlist-preview">
                  <h3>{wishlist.name}</h3>
                  {wishlist.description && (
                    <p className="wishlist-description">
                      {wishlist.description}
                    </p>
                  )}
                  <p className="wishlist-item-count">
                    {wishlist.items.length} item
                    {wishlist.items.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Features */}
        <div className="features-section">
          <h2 className="section-title">Features</h2>
          <div className="features-grid">
            <Card onClick={() => navigate("/secret-santa")}>
              <div className="feature-item">
                <span className="feature-icon">🎄</span>
                <span>Secret Santa</span>
              </div>
            </Card>
            <Card onClick={() => navigate("/crowdfunding")}>
              <div className="feature-item">
                <span className="feature-icon">💰</span>
                <span>Crowdfunding</span>
              </div>
            </Card>
            <Card onClick={() => navigate("/friends")}>
              <div className="feature-item">
                <span className="feature-icon">👥</span>
                <span>Friends</span>
              </div>
            </Card>
            <Card onClick={() => navigate("/profile")}>
              <div className="feature-item">
                <span className="feature-icon">⭐</span>
                <span>Referrals</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Premium Badge */}
        {userProfile?.premiumStatus === "free" && (
          <Card>
            <div className="premium-banner">
              <h3>✨ Go Premium</h3>
              <p>Unlock unlimited wishlists, advanced features, and more!</p>
              <Button onClick={() => navigate("/profile?tab=premium")}>
                Learn More
              </Button>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
