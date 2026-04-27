import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
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

function AppRoutes() {
  const { setUserProfile } = useStore();
  const navigate = useNavigate();

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
        const profile = await getUserProfile();
        setUserProfile(profile);

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

        const wishlistId = getWishlistIdFromStart();
        if (wishlistId) {
          navigate(`/wishlists/${wishlistId}`, { replace: true });
          return;
        }

        const friendUserId = getUserIdFromStart();
        if (friendUserId) {
          navigate(`/user/${friendUserId}`, { replace: true });
          return;
        }
      } catch (error) {
        console.error("Error initializing app:", error);
      }
    };

    initApp();
  }, [setUserProfile, navigate]);

  return (
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
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
