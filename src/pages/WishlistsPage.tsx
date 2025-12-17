import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import { Input } from '../components/Input';
import { useStore } from '../store/useStore';
import { getWishlists, createWishlist } from '../services/api';
import { showTelegramAlert, hapticFeedback } from '../utils/telegram';
import './WishlistsPage.css';

export default function WishlistsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { wishlists, setWishlists, addWishlist, setLoading } = useStore();
  const [showCreateForm, setShowCreateForm] = useState(searchParams.get('action') === 'create');
  const [formData, setFormData] = useState({ name: '', description: '', isPublic: false });

  useEffect(() => {
    const loadWishlists = async () => {
      try {
        setLoading(true);
        const data = await getWishlists();
        setWishlists(data);
      } catch (error) {
        console.error('Error loading wishlists:', error);
        showTelegramAlert('Failed to load wishlists');
      } finally {
        setLoading(false);
      }
    };
    loadWishlists();
  }, [setWishlists, setLoading]);

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      showTelegramAlert('Please enter a wishlist name');
      return;
    }

    try {
      setLoading(true);
      const newWishlist = await createWishlist({
        userId: 0, // Will be set by backend
        name: formData.name,
        description: formData.description,
        isPublic: formData.isPublic,
        isDefault: wishlists.length === 0, // First wishlist is default
      });
      addWishlist(newWishlist);
      hapticFeedback.notification('success');
      setShowCreateForm(false);
      setFormData({ name: '', description: '', isPublic: false });
      navigate(`/wishlists/${newWishlist.id}`);
    } catch (error) {
      console.error('Error creating wishlist:', error);
      showTelegramAlert('Failed to create wishlist');
      hapticFeedback.notification('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="My Wishlists" showBackButton={true}>
      <div className="wishlists-page">
        {!showCreateForm ? (
          <>
            <Button 
              fullWidth 
              onClick={() => setShowCreateForm(true)}
              size="large"
            >
              ➕ Create New Wishlist
            </Button>

            {wishlists.length === 0 ? (
              <Card>
                <div className="empty-state">
                  <p>No wishlists yet. Create your first one!</p>
                </div>
              </Card>
            ) : (
              <div className="wishlists-list">
                {wishlists.map(wishlist => (
                  <Card 
                    key={wishlist.id}
                    onClick={() => navigate(`/wishlists/${wishlist.id}`)}
                  >
                    <div className="wishlist-card">
                      <div className="wishlist-header">
                        <h3>{wishlist.name}</h3>
                        {wishlist.isDefault && <span className="badge">Default</span>}
                        {wishlist.isPublic && <span className="badge badge-public">Public</span>}
                      </div>
                      {wishlist.description && (
                        <p className="wishlist-description">{wishlist.description}</p>
                      )}
                      <div className="wishlist-footer">
                        <span className="item-count">
                          {wishlist.items.length} item{wishlist.items.length !== 1 ? 's' : ''}
                        </span>
                        <span className="wishlist-date">
                          Updated {new Date(wishlist.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="create-form">
            <h2>Create New Wishlist</h2>
            <Input
              label="Name"
              placeholder="e.g., Birthday Wishlist"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="Description (optional)"
              placeholder="Describe your wishlist..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                />
                <span>Make this wishlist public</span>
              </label>
            </div>
            <div className="form-actions">
              <Button 
                fullWidth 
                onClick={handleCreate}
                size="large"
              >
                Create Wishlist
              </Button>
              <Button 
                fullWidth 
                variant="secondary"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ name: '', description: '', isPublic: false });
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

