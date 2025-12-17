import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";
import { Input } from "../components/Input";
import { useStore } from "../store/useStore";
import { getUserProfile, addFriend, removeFriend } from "../services/api";
import {
  showTelegramAlert,
  openTelegramLink,
  hapticFeedback,
} from "../utils/telegram";
import "./FriendsPage.css";

export default function FriendsPage() {
  const { userProfile, setUserProfile, setLoading } = useStore();
  const [friendId, setFriendId] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const profile = await getUserProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [setUserProfile, setLoading]);

  const handleAddFriend = async () => {
    const id = parseInt(friendId);
    if (isNaN(id)) {
      showTelegramAlert("Please enter a valid user ID");
      return;
    }

    try {
      setLoading(true);
      await addFriend(id);
      const profile = await getUserProfile();
      setUserProfile(profile);
      hapticFeedback.notification("success");
      showTelegramAlert("Friend added successfully!");
      setFriendId("");
    } catch (error) {
      console.error("Error adding friend:", error);
      showTelegramAlert("Failed to add friend");
      hapticFeedback.notification("error");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async (friendId: number) => {
    try {
      setLoading(true);
      await removeFriend(friendId);
      const profile = await getUserProfile();
      setUserProfile(profile);
      hapticFeedback.notification("success");
    } catch (error) {
      console.error("Error removing friend:", error);
      showTelegramAlert("Failed to remove friend");
    } finally {
      setLoading(false);
    }
  };

  const handleShareProfile = () => {
    const message = "Check out my wishlist on Wish Bucket!";
    openTelegramLink(
      `https://t.me/share/url?url=https://t.me/wishly_bot&text=${encodeURIComponent(
        message
      )}`
    );
  };

  if (!userProfile) {
    return (
      <Layout title="Friends" showBackButton={true}>
        <div>Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Friends" showBackButton={true}>
      <div className="friends-page">
        <Card>
          <h3 className="section-title">Add Friend</h3>
          <p className="help-text">
            Add friends by their Telegram User ID. You'll get birthday reminders
            for your friends!
          </p>
          <Input
            type="number"
            placeholder="Enter Telegram User ID"
            value={friendId}
            onChange={(e) => setFriendId(e.target.value)}
          />
          <Button fullWidth onClick={handleAddFriend}>
            Add Friend
          </Button>
        </Card>

        <Card>
          <div className="share-section">
            <h3 className="section-title">Share Your Profile</h3>
            <p className="help-text">
              Share your wishlist profile with friends so they can see what you
              want!
            </p>
            <Button fullWidth onClick={handleShareProfile} size="large">
              📤 Share My Wishlist
            </Button>
          </div>
        </Card>

        {userProfile.friends.length === 0 ? (
          <Card>
            <div className="empty-state">
              <p>
                No friends yet. Add some friends to see their wishlists and get
                birthday reminders!
              </p>
            </div>
          </Card>
        ) : (
          <div className="friends-list">
            <h2 className="section-title">
              Your Friends ({userProfile.friends.length})
            </h2>
            {userProfile.friends.map((friendId) => (
              <Card key={friendId}>
                <div className="friend-item">
                  <div className="friend-info">
                    <span className="friend-id">User ID: {friendId}</span>
                  </div>
                  <Button
                    size="small"
                    variant="danger"
                    onClick={() => handleRemoveFriend(friendId)}
                  >
                    Remove
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
