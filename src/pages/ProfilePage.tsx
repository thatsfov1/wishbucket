import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";
import { Input } from "../components/Input";
import Avatar from "../components/Avatar";
import { useStore } from "../store/useStore";
import {
  getUserProfile,
  updateUserProfile,
  getReferralCode,
  applyReferralCode,
} from "../services/api";
import {
  showTelegramAlert,
  openTelegramLink,
  hapticFeedback,
} from "../utils/telegram";
import { getTelegramUser } from "../utils/telegram";
import "./ProfilePage.css";

export default function ProfilePage() {
  const { userProfile, setUserProfile, setLoading } = useStore();
  const [activeTab, setActiveTab] = useState<
    "profile" | "referral" | "premium"
  >("profile");
  const [referralCode, setReferralCode] = useState("");
  const [inputReferralCode, setInputReferralCode] = useState("");
  const [birthday, setBirthday] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const profile = await getUserProfile();
        setUserProfile(profile);
        setBirthday(profile.birthday || "");

        const code = await getReferralCode();
        setReferralCode(code);
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [setUserProfile, setLoading]);

  const handleUpdateBirthday = async () => {
    if (!userProfile) return;

    try {
      setLoading(true);
      const updated = await updateUserProfile({ birthday });
      setUserProfile(updated);
      hapticFeedback.notification("success");
      showTelegramAlert("Birthday updated successfully!");
    } catch (error) {
      console.error("Error updating birthday:", error);
      showTelegramAlert("Failed to update birthday");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyReferral = async () => {
    if (!inputReferralCode.trim()) {
      showTelegramAlert("Please enter a referral code");
      return;
    }

    try {
      setLoading(true);
      await applyReferralCode(inputReferralCode);
      const profile = await getUserProfile();
      setUserProfile(profile);
      hapticFeedback.notification("success");
      showTelegramAlert("Referral code applied! You received bonus points!");
      setInputReferralCode("");
    } catch (error) {
      console.error("Error applying referral:", error);
      showTelegramAlert("Failed to apply referral code");
    } finally {
      setLoading(false);
    }
  };

  const handleShareReferral = () => {
    const telegramUser = getTelegramUser();
    const message = `Join Wish Bucket and use my referral code: ${referralCode}\n\nGet bonus points when you sign up!`;
    openTelegramLink(
      `https://t.me/share/url?url=https://t.me/wishbucket_bot/app?startapp=invite&text=${encodeURIComponent(
        message
      )}`
    );
  };

  if (!userProfile) {
    return (
      <Layout title="Profile" showBackButton={true}>
        <div>Loading...</div>
      </Layout>
    );
  }

  const telegramUser = getTelegramUser();

  return (
    <Layout title="Profile" showBackButton={true}>
      <div className="profile-page">
        <div className="tabs">
          <button
            className={`tab ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            Profile
          </button>
          <button
            className={`tab ${activeTab === "referral" ? "active" : ""}`}
            onClick={() => setActiveTab("referral")}
          >
            Referrals
          </button>
          <button
            className={`tab ${activeTab === "premium" ? "active" : ""}`}
            onClick={() => setActiveTab("premium")}
          >
            Premium
          </button>
        </div>

        {activeTab === "profile" && (
          <div className="tab-content">
            <Card>
              <div className="profile-header">
                <Avatar user={telegramUser} size="large" />
                <div className="profile-info">
                  <h2>
                    {telegramUser?.first_name} {telegramUser?.last_name}
                  </h2>
                  {telegramUser?.username && (
                    <p className="username">@{telegramUser.username}</p>
                  )}
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="section-title">Birthday</h3>
              <Input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
              />
              <Button fullWidth onClick={handleUpdateBirthday} size="small">
                Update Birthday
              </Button>
              <p className="help-text">
                Your birthday will be used to remind your friends when it's
                coming up!
              </p>
            </Card>

            <Card>
              <div className="stats-grid">
                <div className="stat">
                  <span className="stat-value">{userProfile.referrals}</span>
                  <span className="stat-label">Referrals</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{userProfile.bonusPoints}</span>
                  <span className="stat-label">Bonus Points</span>
                </div>
                <div className="stat">
                  <span className="stat-value">
                    {userProfile.premiumStatus === "premium" ? "✨" : "Free"}
                  </span>
                  <span className="stat-label">Status</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "referral" && (
          <div className="tab-content">
            <Card>
              <h3 className="section-title">Your Referral Code</h3>
              <div className="referral-code-display">
                <code className="code">{referralCode}</code>
                <Button onClick={handleShareReferral} size="small">
                  📤 Share
                </Button>
              </div>
              <p className="help-text">
                Share your referral code with friends! You'll both get bonus
                points when they sign up.
              </p>
            </Card>

            <Card>
              <h3 className="section-title">Apply Referral Code</h3>
              <Input
                placeholder="Enter referral code"
                value={inputReferralCode}
                onChange={(e) =>
                  setInputReferralCode(e.target.value.toUpperCase())
                }
              />
              <Button fullWidth onClick={handleApplyReferral}>
                Apply Code
              </Button>
            </Card>

            <Card>
              <h3 className="section-title">Referral Rewards</h3>
              <div className="rewards-list">
                <div className="reward-item">
                  <span className="reward-icon">🎁</span>
                  <div className="reward-info">
                    <strong>Sign up with referral</strong>
                    <p>Get 100 bonus points</p>
                  </div>
                </div>
                <div className="reward-item">
                  <span className="reward-icon">⭐</span>
                  <div className="reward-info">
                    <strong>Refer 5 friends</strong>
                    <p>Unlock premium features for 1 month</p>
                  </div>
                </div>
                <div className="reward-item">
                  <span className="reward-icon">🏆</span>
                  <div className="reward-info">
                    <strong>Refer 20 friends</strong>
                    <p>Get lifetime premium access</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "premium" && (
          <div className="tab-content">
            {userProfile.premiumStatus === "premium" ? (
              <Card>
                <div className="premium-status">
                  <h2>✨ You're Premium!</h2>
                  {userProfile.premiumExpiresAt && (
                    <p>
                      Expires:{" "}
                      {new Date(
                        userProfile.premiumExpiresAt
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </Card>
            ) : (
              <>
                <Card>
                  <div className="premium-banner">
                    <h2>✨ Upgrade to Premium</h2>
                    <p>Unlock all features and support Wish Bucket</p>
                  </div>
                </Card>

                <Card>
                  <h3 className="section-title">Premium Features</h3>
                  <ul className="features-list">
                    <li>✨ Unlimited wishlists</li>
                    <li>🎨 Custom themes</li>
                    <li>📊 Advanced analytics</li>
                    <li>🔔 Priority support</li>
                    <li>🎁 Early access to new features</li>
                    <li>💎 No ads</li>
                  </ul>
                </Card>

                <Button
                  fullWidth
                  size="large"
                  onClick={() =>
                    showTelegramAlert("Premium subscription coming soon!")
                  }
                >
                  Subscribe to Premium
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
