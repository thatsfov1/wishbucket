import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  initTelegram,
  getTelegramUser,
  getReferralCodeFromStart,
  getWishlistIdFromStart,
  getUserIdFromStart,
} from "./utils/telegram";
import { useStore } from "./store/useStore";
import { getUserProfile, applyReferral } from "./services/supabase-api";
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
  const { setUserProfile } = useStore();

  useEffect(() => {
    const tg = initTelegram();
    if (!tg) {
      console.warn("Telegram WebApp not available");
      return;
    }

    const initApp = async () => {
      const user = getTelegramUser();
      if (!user) return;

      try {
        // Only load user profile on app init (lightweight)
        // HomePage handles its own optimized data loading
        const profile = await getUserProfile();
        setUserProfile(profile);

        // Handle referral code in background (non-blocking)
        const referralCode = getReferralCodeFromStart();
        if (referralCode) {
          applyReferral(referralCode)
            .then((result) => {
              if (result.success) {
                getUserProfile().then(setUserProfile);
              }
            })
            .catch(console.error);
        }

        // Handle wishlist deeplink
        const wishlistId = getWishlistIdFromStart();
        if (wishlistId) {
          window.location.hash = `/wishlists/${wishlistId}`;
        }

        // Handle friend profile deeplink
        const friendUserId = getUserIdFromStart();
        if (friendUserId) {
          window.location.hash = `/user/${friendUserId}`;
        }
      } catch (error) {
        console.error("Error initializing app:", error);
      }
    };

    initApp();
  }, [setUserProfile]);

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
