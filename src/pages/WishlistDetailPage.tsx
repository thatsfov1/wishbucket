import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import { useStore } from '../store/useStore';
import { getWishlist, deleteWishlist, getShareLink } from '../services/api';
import { showTelegramAlert, showTelegramConfirm, openTelegramLink, hapticFeedback } from '../utils/telegram';
import { format } from 'date-fns';
import './WishlistDetailPage.css';

export default function WishlistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentWishlist, setCurrentWishlist, setLoading } = useStore();
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const loadWishlist = async () => {
      try {
        setLoading(true);
        const wishlist = await getWishlist(id);
        setCurrentWishlist(wishlist);
      } catch (error) {
        console.error('Error loading wishlist:', error);
        showTelegramAlert('Failed to load wishlist');
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
      const shareLink = await getShareLink(id);
      openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(`Check out my wishlist: ${currentWishlist?.name || ''}`)}`);
      hapticFeedback.notification('success');
    } catch (error) {
      console.error('Error sharing wishlist:', error);
      showTelegramAlert('Failed to generate share link');
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
      showTelegramAlert('Failed to delete wishlist');
    }
  };

  if (!currentWishlist) {
    return (
      <Layout title="Wishlist" showBackButton={true}>
        <div>Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout title={currentWishlist.name} showBackButton={true}>
      <div className="wishlist-detail-page">
        <div className="wishlist-header-actions">
          <Button onClick={handleShare} variant="secondary" size="small">
            📤 Share
          </Button>
          <Button 
            onClick={() => setShowMenu(!showMenu)} 
            variant="secondary" 
            size="small"
          >
            ⋮
          </Button>
        </div>

        {showMenu && (
          <Card>
            <div className="menu-options">
              <button onClick={() => navigate(`/wishlists/${id}/edit`)}>
                ✏️ Edit Wishlist
              </button>
              <button onClick={handleDelete} className="danger">
                🗑️ Delete Wishlist
              </button>
            </div>
          </Card>
        )}

        {currentWishlist.description && (
          <Card>
            <p className="wishlist-description">{currentWishlist.description}</p>
          </Card>
        )}

        <div className="wishlist-stats">
          <div className="stat">
            <span className="stat-value">{currentWishlist.items.length}</span>
            <span className="stat-label">Items</span>
          </div>
          <div className="stat">
            <span className="stat-value">
              {currentWishlist.items.filter(i => i.status === 'purchased').length}
            </span>
            <span className="stat-label">Purchased</span>
          </div>
          <div className="stat">
            <span className="stat-value">
              {currentWishlist.items.filter(i => i.status === 'reserved').length}
            </span>
            <span className="stat-label">Reserved</span>
          </div>
        </div>

        <Button 
          fullWidth 
          onClick={() => navigate(`/wishlists/${id}/add-item`)}
          size="large"
        >
          ➕ Add Item
        </Button>

        <div className="items-section">
          <h2 className="section-title">Items</h2>
          {currentWishlist.items.length === 0 ? (
            <Card>
              <div className="empty-state">
                <p>No items yet. Add your first item!</p>
              </div>
            </Card>
          ) : (
            <div className="items-list">
              {currentWishlist.items.map(item => (
                <Card key={item.id} onClick={() => navigate(`/items/${item.id}`)}>
                  <div className="item-card">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.name} className="item-image" />
                    )}
                    <div className="item-content">
                      <div className="item-header">
                        <h3>{item.name}</h3>
                        <span className={`status-badge status-${item.status}`}>
                          {item.status}
                        </span>
                      </div>
                      {item.description && (
                        <p className="item-description">{item.description}</p>
                      )}
                      {item.price && (
                        <p className="item-price">
                          {item.currency || '$'}{item.price.toFixed(2)}
                        </p>
                      )}
                      {item.crowdfunding && (
                        <div className="crowdfunding-progress">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill"
                              style={{ 
                                width: `${(item.crowdfunding.currentAmount / item.crowdfunding.targetAmount) * 100}%` 
                              }}
                            />
                          </div>
                          <span className="progress-text">
                            ${item.crowdfunding.currentAmount.toFixed(2)} / ${item.crowdfunding.targetAmount.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

