import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Button from '../components/Button';
import { Input, Textarea } from '../components/Input';
import { useStore } from '../store/useStore';
import { addItem, processUrl } from '../services/api';
import { showTelegramAlert, hapticFeedback } from '../utils/telegram';
import './AddItemPage.css';

export default function AddItemPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setLoading, addItem: addItemToStore } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });
  const [processingUrl, setProcessingUrl] = useState(false);
  const [productInfo, setProductInfo] = useState<{
    title?: string;
    imageUrl?: string;
    price?: number;
    currency?: string;
  }>({});

  const handleUrlChange = async (url: string) => {
    setFormData({ ...formData, url });
    
    if (!url.trim()) {
      setProductInfo({});
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return; // Invalid URL
    }

    setProcessingUrl(true);
    try {
      const result = await processUrl(url);
      setProductInfo(result.productInfo || {});
      
      // Auto-fill name if available
      if (result.productInfo?.title && !formData.name) {
        setFormData({ ...formData, url, name: result.productInfo.title });
      }
      
      hapticFeedback.notification('success');
    } catch (error) {
      console.error('Error processing URL:', error);
      // Continue anyway - user can fill manually
    } finally {
      setProcessingUrl(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) {
      showTelegramAlert('Wishlist ID is missing');
      return;
    }

    if (!formData.name.trim()) {
      showTelegramAlert('Please enter an item name');
      return;
    }

    if (!formData.url.trim()) {
      showTelegramAlert('Please enter a URL');
      return;
    }

    try {
      setLoading(true);
      
      // Process URL to get affiliate link
      const urlResult = await processUrl(formData.url);
      
      const newItem = await addItem(id, {
        wishlistId: id,
        name: formData.name,
        description: formData.description,
        url: urlResult.affiliateUrl || urlResult.url,
        originalUrl: formData.url,
        affiliateUrl: urlResult.hasAffiliate ? urlResult.url : undefined,
        imageUrl: productInfo.imageUrl,
        price: productInfo.price,
        currency: productInfo.currency,
        priority: formData.priority,
        status: 'available',
      });

      addItemToStore(newItem);
      hapticFeedback.notification('success');
      navigate(`/wishlists/${id}`);
    } catch (error) {
      console.error('Error adding item:', error);
      showTelegramAlert('Failed to add item');
      hapticFeedback.notification('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Add Item" showBackButton={true}>
      <div className="add-item-page">
        <form onSubmit={handleSubmit}>
          <Input
            label="Item Name *"
            placeholder="e.g., iPhone 15 Pro"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Product URL *"
            placeholder="https://example.com/product"
            type="url"
            value={formData.url}
            onChange={(e) => handleUrlChange(e.target.value)}
            required
          />

          {processingUrl && (
            <div className="processing-indicator">
              🔍 Processing URL and finding affiliate program...
            </div>
          )}

          {productInfo.imageUrl && (
            <div className="product-preview">
              <img src={productInfo.imageUrl} alt="Product" className="product-image" />
              {productInfo.price && (
                <div className="product-price">
                  {productInfo.currency || '$'}{productInfo.price.toFixed(2)}
                </div>
              )}
            </div>
          )}

          <Textarea
            label="Description (optional)"
            placeholder="Add any notes about this item..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="input-group">
            <label className="input-label">Priority</label>
            <div className="priority-buttons">
              {(['low', 'medium', 'high'] as const).map(priority => (
                <button
                  key={priority}
                  type="button"
                  className={`priority-button ${formData.priority === priority ? 'active' : ''}`}
                  onClick={() => {
                    setFormData({ ...formData, priority });
                    hapticFeedback.selection();
                  }}
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <Button 
              type="submit" 
              fullWidth 
              size="large"
              loading={processingUrl}
            >
              ➕ Add Item
            </Button>
            <Button 
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => navigate(`/wishlists/${id}`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

