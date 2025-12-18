import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { getWishlist, deleteWishlist, getShareLink, addItem } from '../services/supabase-api';
import { showTelegramConfirm, openTelegramLink, hapticFeedback } from '../utils/telegram';
import BottomNavBar from '../components/BottomNavBar';
import AddItemModal from '../components/AddItemModal';
import './WishlistDetailPage.css';

export default function WishlistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentWishlist, setCurrentWishlist, setLoading, isLoading } = useStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const loadWishlist = async () => {
      try {
        setLoading(true);
        const wishlist = await getWishlist(id);
        setCurrentWishlist(wishlist);
      } catch (error) {
        console.error('Error loading wishlist:', error);
        navigate('/wishlists');
      } finally {
        setLoading(false);
      }
    };
    
    loadWishlist();
  }, [id, setCurrentWishlist, setLoading, navigate]);

  const handleShare = async () => {
    if (!id) return;
    try {
      hapticFeedback.impact("light");
      const shareLink = await getShareLink(id);
      openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(`Check out my wishlist: ${currentWishlist?.name || ''}`)}`);
      hapticFeedback.notification('success');
    } catch (error) {
      console.error('Error sharing wishlist:', error);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const confirmed = await showTelegramConfirm('Are you sure you want to delete this wishlist?');
    if (!confirmed) return;

    try {
      await deleteWishlist(id);
      hapticFeedback.notification('success');
      navigate('/wishlists');
    } catch (error) {
      console.error('Error deleting wishlist:', error);
    }
  };

  const handleAddItem = async (itemData: {
    name: string;
    description?: string;
    imageUrl?: string;
    price?: number;
    currency: string;
    url?: string;
    wishlistIds: string[];
    notifyFollowers: boolean;
  }) => {
    try {
      setLoading(true);
      // Add item to all selected wishlists with notifyFollowers flag
      for (const wishlistId of itemData.wishlistIds) {
        await addItem(
          wishlistId, 
          {
            wishlistId,
            name: itemData.name,
            description: itemData.description,
            url: itemData.url || "",
            originalUrl: itemData.url || "",
            imageUrl: itemData.imageUrl,
            price: itemData.price,
            currency: itemData.currency,
            priority: "medium",
            status: "available",
          },
          itemData.notifyFollowers
        );
      }
      // Reload current wishlist if it was in the selected list
      if (id && itemData.wishlistIds.includes(id)) {
        const wishlist = await getWishlist(id);
        setCurrentWishlist(wishlist);
      }
      hapticFeedback.notification('success');
    } catch (error) {
      console.error('Error adding item:', error);
      hapticFeedback.notification('error');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    hapticFeedback.impact("light");
    navigate(-1);
  };

  if (isLoading || !currentWishlist) {
    return (
      <div className="wishlist-detail-container">
        <header className="detail-header">
          <button className="back-btn" onClick={handleBack}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1>Loading...</h1>
        </header>
        <div className="loading-state">
          <div className="loading-spinner" />
        </div>
        <BottomNavBar />
      </div>
    );
  }

  return (
    <div className="wishlist-detail-container">
      {/* Header */}
      <header className="detail-header">
        <button className="back-btn" onClick={handleBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1>{currentWishlist.name}</h1>
        <button className="menu-btn" onClick={() => { hapticFeedback.impact("light"); setShowMenu(!showMenu); }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="6" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="18" r="2" />
          </svg>
        </button>
      </header>

      {/* Menu Dropdown */}
      {showMenu && (
        <div className="menu-dropdown" onClick={() => setShowMenu(false)}>
          <div className="menu-content" onClick={(e) => e.stopPropagation()}>
            <button onClick={handleShare}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                <polyline points="16,6 12,2 8,6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              Share Wishlist
            </button>
            <button onClick={() => navigate(`/wishlists/${id}/edit`)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Wishlist
            </button>
            <button className="danger" onClick={handleDelete}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3,6 5,6 21,6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              Delete Wishlist
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="detail-stats">
        <div className="detail-stat">
          <span className="stat-value">{currentWishlist.items.length}</span>
          <span className="stat-label">Items</span>
        </div>
        <div className="stat-divider" />
        <div className="detail-stat">
          <span className="stat-value">{currentWishlist.items.filter(i => i.status === 'reserved').length}</span>
          <span className="stat-label">Reserved</span>
        </div>
        <div className="stat-divider" />
        <div className="detail-stat">
          <span className="stat-value">{currentWishlist.items.filter(i => i.status === 'purchased').length}</span>
          <span className="stat-label">Purchased</span>
        </div>
      </div>

      {/* Description */}
      {currentWishlist.description && (
        <div className="detail-description">
          <p>{currentWishlist.description}</p>
        </div>
      )}

      {/* Items Section */}
      <div className="items-section">
        <div className="section-header">
          <h2>Items</h2>
          <button 
            className="add-item-btn"
            onClick={() => { hapticFeedback.impact("medium"); setShowAddItemModal(true); }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Item
          </button>
        </div>

        {currentWishlist.items.length === 0 ? (
          <div className="empty-items">
            <div className="empty-emoji">🎁</div>
            <h3>No items yet</h3>
            <p>Add your first item to this wishlist</p>
          </div>
        ) : (
          <div className="items-list">
            {currentWishlist.items.map((item, index) => (
              <div 
                key={item.id} 
                className="item-card animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="item-image">
                  {item.imageUrl ? (
                    item.imageUrl.length <= 2 ? (
                      <span className="item-emoji">{item.imageUrl}</span>
                    ) : (
                      <img src={item.imageUrl} alt={item.name} />
                    )
                  ) : (
                    <span className="item-emoji">🎁</span>
                  )}
                </div>
                <div className="item-info">
                  <h3>{item.name}</h3>
                  {item.description && <p className="item-desc">{item.description}</p>}
                  {item.price && (
                    <span className="item-price">{item.currency || '$'}{item.price.toFixed(2)}</span>
                  )}
                </div>
                <span className={`item-status status-${item.status}`}>
                  {item.status === 'available' && '✓'}
                  {item.status === 'reserved' && '⏳'}
                  {item.status === 'purchased' && '✓✓'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNavBar />

      <AddItemModal
        isOpen={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        onAddItem={handleAddItem}
        preselectedWishlistId={id}
      />
    </div>
  );
}
