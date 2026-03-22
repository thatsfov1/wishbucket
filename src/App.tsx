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

        // Load all data in parallel for faster startup
        const [profile, wishlists, reminders] = await Promise.all([
          getUserProfile(),
          getWishlists(),
          getBirthdayReminders(),
        ]);

        setUserProfile(profile);
        setWishlists(wishlists);
        setBirthdayReminders(reminders);

        // Check for referral code in start_param (non-blocking)
        const referralCode = getReferralCodeFromStart();
        if (referralCode) {
          console.log("📝 Attempting to apply referral code:", referralCode);
          applyReferral(referralCode)
            .then((result) => {
              if (result.success) {
                console.log(`🎉 Referral applied! Earned ${result.bonus} bonus points`);
                getUserProfile().then(setUserProfile);
              }
            })
            .catch((e) => console.error("❌ Referral error:", e?.message || e));
        }

        // Check for wishlist deeplink
        const wishlistId = getWishlistIdFromStart();
        if (wishlistId) {
          window.location.hash = `/wishlists/${wishlistId}`;
        }
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
        <Route path="/market" element={<MarketPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/hints" element={<HintsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
