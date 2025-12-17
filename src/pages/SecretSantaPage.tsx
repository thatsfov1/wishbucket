import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import { Input, Textarea } from '../components/Input';
import { useStore } from '../store/useStore';
import { getSecretSantas, createSecretSanta, joinSecretSanta, drawSecretSanta } from '../services/api';
import { showTelegramAlert, showTelegramConfirm, hapticFeedback } from '../utils/telegram';
import { format } from 'date-fns';
import './SecretSantaPage.css';

export default function SecretSantaPage() {
  const navigate = useNavigate();
  const { secretSantas, setSecretSantas, addSecretSanta, setLoading } = useStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    budget: '',
    exchangeDate: '',
  });

  useEffect(() => {
    const loadSecretSantas = async () => {
      try {
        setLoading(true);
        const data = await getSecretSantas();
        setSecretSantas(data);
      } catch (error) {
        console.error('Error loading secret santas:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSecretSantas();
  }, [setSecretSantas, setLoading]);

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      showTelegramAlert('Please enter a name for your Secret Santa');
      return;
    }

    if (!formData.exchangeDate) {
      showTelegramAlert('Please select an exchange date');
      return;
    }

    try {
      setLoading(true);
      const newSanta = await createSecretSanta({
        organizerId: 0, // Will be set by backend
        name: formData.name,
        description: formData.description,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        exchangeDate: formData.exchangeDate,
        isActive: true,
        participants: [],
      });
      addSecretSanta(newSanta);
      hapticFeedback.notification('success');
      setShowCreateForm(false);
      setFormData({ name: '', description: '', budget: '', exchangeDate: '' });
    } catch (error) {
      console.error('Error creating secret santa:', error);
      showTelegramAlert('Failed to create Secret Santa');
      hapticFeedback.notification('error');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (santaId: string) => {
    try {
      setLoading(true);
      const updated = await joinSecretSanta(santaId);
      setSecretSantas(secretSantas.map(s => s.id === santaId ? updated : s));
      hapticFeedback.notification('success');
    } catch (error) {
      console.error('Error joining secret santa:', error);
      showTelegramAlert('Failed to join Secret Santa');
    } finally {
      setLoading(false);
    }
  };

  const handleDraw = async (santaId: string) => {
    const confirmed = await showTelegramConfirm('Are you ready to draw names? This cannot be undone.');
    if (!confirmed) return;

    try {
      setLoading(true);
      const updated = await drawSecretSanta(santaId);
      setSecretSantas(secretSantas.map(s => s.id === santaId ? updated : s));
      hapticFeedback.notification('success');
    } catch (error) {
      console.error('Error drawing secret santa:', error);
      showTelegramAlert('Failed to draw names');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Secret Santa" showBackButton={true}>
      <div className="secret-santa-page">
        {!showCreateForm ? (
          <>
            <Button 
              fullWidth 
              onClick={() => setShowCreateForm(true)}
              size="large"
            >
              ➕ Create Secret Santa
            </Button>

            {secretSantas.length === 0 ? (
              <Card>
                <div className="empty-state">
                  <p>No Secret Santa events yet. Create one to get started!</p>
                </div>
              </Card>
            ) : (
              <div className="secret-santas-list">
                {secretSantas.map(santa => (
                  <Card key={santa.id}>
                    <div className="santa-card">
                      <div className="santa-header">
                        <h3>{santa.name}</h3>
                        <span className={`status-badge ${santa.isActive ? 'active' : 'inactive'}`}>
                          {santa.isActive ? 'Active' : 'Completed'}
                        </span>
                      </div>
                      {santa.description && (
                        <p className="santa-description">{santa.description}</p>
                      )}
                      <div className="santa-details">
                        {santa.budget && (
                          <div className="detail">
                            <span className="detail-label">Budget:</span>
                            <span className="detail-value">${santa.budget}</span>
                          </div>
                        )}
                        <div className="detail">
                          <span className="detail-label">Exchange Date:</span>
                          <span className="detail-value">
                            {format(new Date(santa.exchangeDate), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <div className="detail">
                          <span className="detail-label">Participants:</span>
                          <span className="detail-value">{santa.participants.length}</span>
                        </div>
                      </div>
                      <div className="santa-actions">
                        {santa.isActive && (
                          <>
                            <Button 
                              size="small" 
                              variant="secondary"
                              onClick={() => handleJoin(santa.id)}
                            >
                              Join
                            </Button>
                            {santa.participants.length >= 2 && (
                              <Button 
                                size="small"
                                onClick={() => handleDraw(santa.id)}
                              >
                                Draw Names
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="create-form">
            <h2>Create Secret Santa</h2>
            <Input
              label="Name *"
              placeholder="e.g., Christmas 2024"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Textarea
              label="Description (optional)"
              placeholder="Add any details about your Secret Santa..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <Input
              label="Budget (optional)"
              type="number"
              placeholder="0.00"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            />
            <Input
              label="Exchange Date *"
              type="date"
              value={formData.exchangeDate}
              onChange={(e) => setFormData({ ...formData, exchangeDate: e.target.value })}
              required
            />
            <div className="form-actions">
              <Button 
                fullWidth 
                onClick={handleCreate}
                size="large"
              >
                Create Secret Santa
              </Button>
              <Button 
                fullWidth 
                variant="secondary"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ name: '', description: '', budget: '', exchangeDate: '' });
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

