import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Button from "../components/Button";
import { Input, Textarea } from "../components/Input";
import { useStore } from "../store/useStore";
import { addItem as addItemApi } from "../services/supabase-api";
import { scrapeProductUrl } from "../services/supabase-api";
import { generateAffiliateLink } from "../utils/affiliate";
import { showTelegramAlert, hapticFeedback } from "../utils/telegram";
import "./AddItemPage.css";

export default function AddItemPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setLoading, addItem: addItemToStore } = useStore();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    url: "",
    priority: "medium" as "low" | "medium" | "high",
  });
  const [processingUrl, setProcessingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [productInfo, setProductInfo] = useState<{
    title?: string;
    imageUrl?: string;
    price?: number;
    currency?: string;
  }>({});

  // Fetch product info from URL
  const fetchProductInfo = async (url: string) => {
    if (!url.trim()) return;

    // Validate URL
    try {
      new URL(url);
    } catch {
      setUrlError("Please enter a valid URL");
      return;
    }

    setProcessingUrl(true);
    setUrlError(null);
    setProductInfo({});

    try {
      console.log("🔍 Fetching product info for:", url);
      const result = await scrapeProductUrl(url);
      console.log("✅ Scrape result:", result);

      if (result.title || result.imageUrl || result.price) {
        setProductInfo(result);

        // Auto-fill name if not already filled
        if (result.title && !formData.name) {
          setFormData((prev) => ({ ...prev, name: result.title || "" }));
        }

        hapticFeedback.notification("success");
      } else {
        setUrlError("Could not find product info. Please fill manually.");
      }
    } catch (error) {
      console.error("❌ Error processing URL:", error);
      setUrlError("Failed to fetch. Please fill manually.");
    } finally {
      setProcessingUrl(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setFormData({ ...formData, url });
    // Clear previous product info when URL changes
    if (productInfo.title || productInfo.imageUrl) {
      setProductInfo({});
    }
    setUrlError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) {
      showTelegramAlert("Wishlist ID is missing");
      return;
    }

    if (!formData.name.trim()) {
      showTelegramAlert("Please enter an item name");
      return;
    }

    if (!formData.url.trim()) {
      showTelegramAlert("Please enter a URL");
      return;
    }

    try {
      setLoading(true);

      // Generate affiliate link if possible
      const affiliateResult = generateAffiliateLink(formData.url);

      const newItem = await addItemApi(id, {
        wishlistId: id,
        name: formData.name,
        description: formData.description,
        url: affiliateResult.affiliateUrl || formData.url,
        originalUrl: formData.url,
        affiliateUrl: affiliateResult.hasAffiliate
          ? affiliateResult.affiliateUrl
          : undefined,
        imageUrl: productInfo.imageUrl,
        price: productInfo.price,
        currency: productInfo.currency,
        priority: formData.priority,
        status: "available",
      });

      addItemToStore(newItem);
      hapticFeedback.notification("success");
      navigate(`/wishlists/${id}`);
    } catch (error) {
      console.error("Error adding item:", error);
      showTelegramAlert("Failed to add item");
      hapticFeedback.notification("error");
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

          {/* Fetch button - always shows when URL is entered */}
          {formData.url && !processingUrl && (
            <button
              type="button"
              className="fetch-info-btn"
              onClick={() => fetchProductInfo(formData.url)}
            >
              {productInfo.title ? "🔄 Refetch Info" : "🔍 Fetch Product Info"}
            </button>
          )}

          {processingUrl && (
            <div className="processing-indicator">
              🔍 Fetching product info...
            </div>
          )}

          {urlError && <div className="url-error">⚠️ {urlError}</div>}

          {(productInfo.imageUrl || productInfo.title || productInfo.price) &&
            !processingUrl && (
              <div className="product-preview">
                {productInfo.imageUrl && (
                  <img
                    src={productInfo.imageUrl}
                    alt="Product"
                    className="product-image"
                  />
                )}
                <div className="product-preview-info">
                  <span className="product-preview-success">
                    ✓ Product info loaded
                  </span>
                  {productInfo.title && (
                    <span className="product-preview-title">
                      {productInfo.title}
                    </span>
                  )}
                  {productInfo.price && (
                    <div className="product-price">
                      {productInfo.currency || "$"}
                      {productInfo.price.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            )}

          <Textarea
            label="Description (optional)"
            placeholder="Add any notes about this item..."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />

          <div className="input-group">
            <label className="input-label">Priority</label>
            <div className="priority-buttons">
              {(["low", "medium", "high"] as const).map((priority) => (
                <button
                  key={priority}
                  type="button"
                  className={`priority-button ${
                    formData.priority === priority ? "active" : ""
                  }`}
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
