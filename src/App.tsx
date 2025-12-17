import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { initTelegram, getTelegramUser } from "./utils/telegram";
import { useStore } from "./store/useStore";
// Використовуємо Supabase API
import {
  getUserProfile,
  getWishlists,
  getBirthdayReminders,
} from "./services/supabase-api";

// Pages
import HomePage from "./pages/HomePage";
import WishlistsPage from "./pages/WishlistsPage";
import WishlistDetailPage from "./pages/WishlistDetailPage";
import AddItemPage from "./pages/AddItemPage";
import SecretSantaPage from "./pages/SecretSantaPage";
import ProfilePage from "./pages/ProfilePage";
import FriendsPage from "./pages/FriendsPage";
import CrowdfundingPage from "./pages/CrowdfundingPage";
import TelegramWarning from "./components/TelegramWarning";

function App() {
  const {
    setUserProfile,
    setWishlists,
    setBirthdayReminders,
    setLoading,
    setError,
  } = useStore();

  useEffect(() => {
    // Initialize Telegram WebApp
    const tg = initTelegram();
    if (!tg) {
      console.warn("Telegram WebApp not available");
      return;
    }

    // Load initial data
    const loadData = async () => {
      try {
        setLoading(true);
        const user = getTelegramUser();
        if (!user) {
          throw new Error("User not authenticated");
        }

        // Load user profile
        const profile = await getUserProfile();
        setUserProfile(profile);

        // Load wishlists
        const wishlists = await getWishlists();
        setWishlists(wishlists);

        // Load birthday reminders
        const reminders = await getBirthdayReminders();
        setBirthdayReminders(reminders);
      } catch (error) {
        console.error("Error loading data:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load data"
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
    <>
      <TelegramWarning />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/wishlists" element={<WishlistsPage />} />
          <Route path="/wishlists/:id" element={<WishlistDetailPage />} />
          <Route path="/wishlists/:id/add-item" element={<AddItemPage />} />
          <Route path="/secret-santa" element={<SecretSantaPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/crowdfunding" element={<CrowdfundingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
