import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import { useStore } from '../store/useStore';
import { getWishlists } from '../services/api';
import './CrowdfundingPage.css';

export default function CrowdfundingPage() {
  const navigate = useNavigate();
  const { wishlists, setWishlists, setLoading } = useStore();

  useEffect(() => {
    const loadWishlists = async () => {
      try {
        setLoading(true);
        const data = await getWishlists();
        setWishlists(data);
      } catch (error) {
        console.error('Error loading wishlists:', error);
      } finally {
        setLoading(false);
      }
    };
    loadWishlists();
  }, [setWishlists, setLoading]);

  // Get all items with active crowdfunding
  const crowdfundingItems = wishlists
    .flatMap(w => w.items)
    .filter(item => item.crowdfunding && item.crowdfunding.isActive);

  return (
    <Layout title="Crowdfunding" showBackButton={true}>
      <div className="crowdfunding-page">
        <Card>
          <div className="info-section">
            <h2>💰 Crowdfunding</h2>
            <p>
              Help your friends get expensive items by contributing together! 
              Create a crowdfunding campaign for any item in your wishlist.
            </p>
          </div>
        </Card>

        {crowdfundingItems.length === 0 ? (
          <Card>
            <div className="empty-state">
              <p>No active crowdfunding campaigns yet.</p>
              <p>Add items to your wishlist and enable crowdfunding to get started!</p>
            </div>
          </Card>
        ) : (
          <div className="campaigns-list">
            <h2 className="section-title">Active Campaigns</h2>
            {crowdfundingItems.map(item => {
              const progress = item.crowdfunding!
                ? (item.crowdfunding.currentAmount / item.crowdfunding.targetAmount) * 100
                : 0;

              return (
                <Card 
                  key={item.id}
                  onClick={() => navigate(`/items/${item.id}`)}
                >
                  <div className="campaign-card">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.name} className="campaign-image" />
                    )}
                    <div className="campaign-content">
                      <h3>{item.name}</h3>
                      {item.description && (
                        <p className="campaign-description">{item.description}</p>
                      )}
                      <div className="campaign-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <div className="progress-info">
                          <span className="progress-amount">
                            ${item.crowdfunding!.currentAmount.toFixed(2)}
                          </span>
                          <span className="progress-target">
                            / ${item.crowdfunding!.targetAmount.toFixed(2)}
                          </span>
                          <span className="progress-percent">
                            ({progress.toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                      <div className="campaign-contributors">
                        <span>
                          {item.crowdfunding!.contributors.length} contributor
                          {item.crowdfunding!.contributors.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <Button 
                        fullWidth 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/items/${item.id}?action=contribute`);
                        }}
                      >
                        Contribute
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Card>
          <div className="help-section">
            <h3>How it works</h3>
            <ol className="help-steps">
              <li>Add an item to your wishlist</li>
              <li>Enable crowdfunding for that item</li>
              <li>Share with friends and family</li>
              <li>They can contribute any amount</li>
              <li>Once the goal is reached, you can purchase the item!</li>
            </ol>
          </div>
        </Card>
      </div>
    </Layout>
  );
}

