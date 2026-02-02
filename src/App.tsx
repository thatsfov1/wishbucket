import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  initTelegram,
  getTelegramUser,
  getReferralCodeFromStart,
  getWishlistIdFromStart,
} from "./utils/telegram";
import { useStore } from "./store/useStore";
import {
  getUserProfile,
  getWishlists,
  getBirthdayReminders,
  applyReferral,
} from "./services/supabase-api";
import HomePage from "./pages/HomePage";
import WishlistsPage from "./pages/WishlistsPage";
import WishlistDetailPage from "./pages/WishlistDetailPage";
import AddItemPage from "./pages/AddItemPage";
import SecretSantaPage from "./pages/SecretSantaPage";
import ProfilePage from "./pages/ProfilePage";
import FriendsPage from "./pages/FriendsPage";
import CrowdfundingPage from "./pages/CrowdfundingPage";
import InspirationPage from "./pages/InspirationPage";
import FindGiftPage from "./pages/FindGiftPage";
import NotificationsPage from "./pages/NotificationsPage";
import FriendProfilePage from "./pages/FriendProfilePage";
import MarketPage from "./pages/MarketPage";
import TasksPage from "./pages/TasksPage";
import HintsPage from "./pages/HintsPage";
import EditWishlistPage from "./pages/EditWishlistPage";

function App() {
  const {
    setUserProfile,
    setWishlists,
    setBirthdayReminders,
    setLoading,
    setError,
  } = useStore();

  useEffect(() => {
    const tg = initTelegram();
    if (!tg) {
      console.warn("Telegram WebApp not available");
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const user = getTelegramUser();
        if (!user) {
          throw new Error("User not authenticated");
        }

        // Get user profile (creates new user if doesn't exist)
        const profile = await getUserProfile();
        setUserProfile(profile);

        // Check for referral code in start_param
        const referralCode = getReferralCodeFromStart();
        console.log("🔍 Start param referral code:", referralCode);

        if (referralCode) {
          console.log("📝 Attempting to apply referral code:", referralCode);
          try {
            // Check if this is a new user (no referrals used before)
            const result = await applyReferral(referralCode);
            console.log("✅ Referral result:", result);
            if (result.success) {
              console.log(
                `🎉 Referral applied! Earned ${result.bonus} bonus points`,
              );
              // Refresh profile to get updated bonus
              const updatedProfile = await getUserProfile();
              setUserProfile(updatedProfile);
            }
          } catch (e: any) {
            // Log the actual error
            console.error("❌ Referral error:", e?.message || e);
          }
        }

        // Check for wishlist deeplink
        const wishlistId = getWishlistIdFromStart();
        if (wishlistId) {
          // Navigate to wishlist (handled by router)
          window.location.hash = `/wishlists/${wishlistId}`;
        }

        const wishlists = await getWishlists();
        setWishlists(wishlists);

        const reminders = await getBirthdayReminders();
        setBirthdayReminders(reminders);
      } catch (error) {
        console.error("Error loading data:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load data",
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [
    setUserProfile,
    setWishlists,
    setBirthdayReminders,
    setLoading,
    setError,
  ]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/wishlists" element={<WishlistsPage />} />
        <Route path="/wishlists/:id" element={<WishlistDetailPage />} />
        <Route path="/wishlists/:id/edit" element={<EditWishlistPage />} />
        <Route path="/wishlists/:id/add-item" element={<AddItemPage />} />
        <Route path="/secret-santa" element={<SecretSantaPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/friends" element={<FriendsPage />} />
        <Route path="/user/:userId" element={<FriendProfilePage />} />
        <Route path="/crowdfunding" element={<CrowdfundingPage />} />
        <Route path="/inspiration" element={<InspirationPage />} />
        <Route path="/find-gift" element={<FindGiftPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/market" element={<MarketPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/hints" element={<HintsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
