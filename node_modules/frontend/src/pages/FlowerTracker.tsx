import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // Remove direct axios import
import api from '../services/api'; // Import configured api instance
import { format, parseISO, addDays, differenceInDays } from 'date-fns';

interface FlowerGift {
  _id: string;
  flowerType: string;
  date: string;
  reaction: string;
  notes: string;
  price: number;
  source: string;
  estimatedExpiryDate: string;
}

interface FlowerStats {
  totalGifts: number;
  averagePrice: number;
  totalSpent: number;
  favoriteFlowers: Array<{ type: string; reaction: string }>;
}

const FlowerTracker = () => {
  const [flowerGifts, setFlowerGifts] = useState<FlowerGift[]>([]);
  const [stats, setStats] = useState<FlowerStats | null>(null);
  const [editingGift, setEditingGift] = useState<FlowerGift | null>(null);
  const [newGift, setNewGift] = useState({
    flowerType: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    reaction: '',
    notes: '',
    price: 0,
    source: '',
    estimatedExpiryDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'), // This will be overwritten by AI
  });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFlowerGifts();
    fetchStats();
    checkExpiringFlowers();
  }, []);

  const checkExpiringFlowers = () => {
    flowerGifts.forEach(gift => {
      const daysUntilExpiry = differenceInDays(parseISO(gift.estimatedExpiryDate), new Date());
      if (daysUntilExpiry <= 2 && daysUntilExpiry >= 0) {
        // Show notification
        if (Notification.permission === 'granted') {
          new Notification('Flowers Expiring Soon!', {
            body: `The ${gift.flowerType} will expire in ${daysUntilExpiry} days. Time to get new flowers!`,
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification('Flowers Expiring Soon!', {
                body: `The ${gift.flowerType} will expire in ${daysUntilExpiry} days. Time to get new flowers!`,
              });
            }
          });
        }
      }
    });
  };

  const fetchFlowerGifts = async () => {
    try {
      // Use 'api' and relative path
      const response = await api.get('/flowers'); 
      setFlowerGifts(response.data);
      // Call checkExpiringFlowers after data is fetched
      checkExpiringFlowers(); 
    } catch (err) {
      setError('Error fetching flower gifts');
    }
  };

  const fetchStats = async () => {
    try {
      // Use 'api' and relative path
      const response = await api.get('/flowers/stats');
      setStats(response.data);
    } catch (err) {
      setError('Error fetching statistics');
    }
  };

  const handleEdit = (gift: FlowerGift) => {
    setEditingGift(gift);
    const date = new Date(gift.date);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    setNewGift({
      flowerType: gift.flowerType,
      date: format(date, 'yyyy-MM-dd'),
      reaction: gift.reaction,
      notes: gift.notes,
      price: gift.price,
      source: gift.source,
      estimatedExpiryDate: gift.estimatedExpiryDate,
    });
    setIsAddingNew(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGift) return;

    try {
      // Use 'api' and relative path
      await api.put(`/flowers/${editingGift._id}`, newGift);
      setEditingGift(null);
      setIsAddingNew(false);
      setNewGift({
        flowerType: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        reaction: '',
        notes: '',
        price: 0,
        source: '',
        estimatedExpiryDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      });
      fetchFlowerGifts();
      fetchStats();
    } catch (err) {
      setError('Error updating flower gift');
    }
  };

  const estimateExpiryDate = async (flowerType: string, purchaseDate: string) => {
    if (!flowerType) return;
    
    try {
      // Use 'api' and relative path
      const response = await api.post('/flowers/estimate-expiry', {
        flowerType,
        purchaseDate,
      });
      
      const { daysToExpiry } = response.data;
      return format(addDays(new Date(purchaseDate), daysToExpiry), 'yyyy-MM-dd');
    } catch (err) {
      console.error('Error estimating flower expiry:', err);
      // Fallback to 7 days if estimation fails
      return format(addDays(new Date(purchaseDate), 7), 'yyyy-MM-dd');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Get AI estimation before submitting
      const estimatedExpiry = await estimateExpiryDate(newGift.flowerType, newGift.date);
      if (!estimatedExpiry) {
        setError('Failed to estimate flower expiry date');
        return;
      }

      const giftWithExpiry = {
        ...newGift,
        estimatedExpiryDate: estimatedExpiry,
      };

      console.log('Submitting flower gift with expiry:', giftWithExpiry);

      if (editingGift) {
        // Use 'api' and relative path
        await api.put(`/flowers/${editingGift._id}`, giftWithExpiry);
      } else {
        // Use 'api' and relative path
        await api.post('/flowers', giftWithExpiry);
      }
      
      setNewGift({
        flowerType: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        reaction: '',
        notes: '',
        price: 0,
        source: '',
        estimatedExpiryDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      });
      setIsAddingNew(false);
      setEditingGift(null);
      fetchFlowerGifts();
      fetchStats();
    } catch (err: any) {
      console.error('Error saving flower gift:', err);
      // Log more detailed error information if available
      if (err.response) {
        console.error('Backend Response Data:', err.response.data);
        console.error('Backend Response Status:', err.response.status);
        console.error('Backend Response Headers:', err.response.headers);
        setError(`Error: ${err.response.data?.message || 'Bad Request'} (Status: ${err.response.status})`);
      } else if (err.request) {
        console.error('No response received:', err.request);
        setError('Error: No response from server.');
      } else {
        console.error('Error setting up request:', err.message);
        setError(`Error: ${err.message}`);
      }
      // Keep the original generic error for display if specific message isn't found
      // setError(err.response?.data?.message || err.response?.data?.error || 'Error saving flower gift');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Use 'api' and relative path
      await api.delete(`/flowers/${id}`);
      fetchFlowerGifts();
      fetchStats();
    } catch (err) {
      setError('Error deleting flower gift');
    }
  };

  const getReactionEmoji = (reaction: FlowerGift['reaction']) => {
    switch (reaction) {
      case 'loved':
        return '😍';
      case 'liked':
        return '😊';
      case 'neutral':
        return '😐';
      case 'disliked':
        return '😕';
      default:
        return '';
    }
  };

  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return format(date, 'MMMM d, yyyy');
  };

  return (
    <div className="space-y-8 container mx-auto px-4 max-w-7xl pt-8 pb-16">
      <h1 className="text-4xl font-display text-primary-dark font-bold text-center">
        Flower Tracker
      </h1>

      <div className="text-center">
        <button onClick={() => setIsAddingNew(true)} className="btn btn-primary px-8">
          Add New Flower
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg text-center">{error}</div>
      )}

      {stats && (
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <div className="card bg-white w-auto px-6">
            <h3 className="text-xl font-semibold mb-2 text-primary-dark text-center">Total Gifts</h3>
            <p className="text-3xl text-primary text-center">{stats.totalGifts}</p>
          </div>
          <div className="card bg-white w-auto px-6">
            <h3 className="text-xl font-semibold mb-2 text-primary-dark text-center">Average Price</h3>
            <p className="text-3xl text-primary text-center">${stats.averagePrice.toFixed(2)}</p>
          </div>
          <div className="card bg-white w-auto px-6">
            <h3 className="text-xl font-semibold mb-2 text-primary-dark text-center">Total Spent</h3>
            <p className="text-3xl text-primary text-center">${stats.totalSpent.toFixed(2)}</p>
          </div>
        </div>
      )}
      {stats && <div className="mt-8 border-t border-primary-light"></div>}

      {isAddingNew && (
        <div className="card max-w-2xl mx-auto">
          <h2 className="text-2xl font-display text-primary-dark mb-4">
            {editingGift ? 'Edit Flower Gift' : 'Add New Flower Gift'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Flower Type</label>
                <input
                  type="text"
                  value={newGift.flowerType}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewGift({ ...newGift, flowerType: value });
                  }}
                  className="input w-full"
                  required
                  placeholder="Add a flower"
                />
                <p className="text-sm text-gray-500 mt-1">
                  AI will estimate expiry date when gift is saved
                </p>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={newGift.date}
                  onChange={(e) =>
                    setNewGift({ ...newGift, date: e.target.value })
                  }
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Reaction</label>
                <input
                  type="text"
                  value={newGift.reaction}
                  onChange={(e) =>
                    setNewGift({ ...newGift, reaction: e.target.value })
                  }
                  className="input w-full"
                  placeholder="How did she react?"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Price</label>
                <input
                  type="number"
                  value={newGift.price || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    setNewGift({ ...newGift, price: value });
                  }}
                  className="input w-full"
                  min="0"
                  step="0.01"
                  placeholder="How much did it cost?"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Source</label>
                <input
                  type="text"
                  value={newGift.source}
                  onChange={(e) =>
                    setNewGift({ ...newGift, source: e.target.value })
                  }
                  className="input w-full"
                  placeholder="Where did you buy the flowers?"
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Notes</label>
              <textarea
                value={newGift.notes}
                onChange={(e) =>
                  setNewGift({ ...newGift, notes: e.target.value })
                }
                className="input w-full h-24"
                placeholder="Add any additional notes..."
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(false);
                  setEditingGift(null);
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingGift ? 'Update' : 'Add'} Flower Gift
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {flowerGifts.map((gift) => (
          <div key={gift._id} className="card">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold text-primary-dark">
                  {gift.flowerType}
                </h3>
                <p className="text-sm text-gray-500">
                  {formatDisplayDate(gift.date)}
                </p>
                {gift.reaction && (
                  <p className="mt-2">
                    <span className="font-semibold">Reaction:</span> {gift.reaction}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(gift)}
                  className="text-primary-dark hover:text-primary"
                >
                  ✎
                </button>
                <button
                  onClick={() => handleDelete(gift._id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            </div>
            {gift.estimatedExpiryDate && (
              <p className="mt-2">
                <span className="font-semibold">Estimated Expiration:</span> {formatDisplayDate(gift.estimatedExpiryDate)}
                {(() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0); // Start of today
                  const expiryDate = new Date(gift.estimatedExpiryDate);
                  expiryDate.setHours(23, 59, 59, 999); // End of expiry day
                  
                  // Calculate days including the full expiry day and add 1 to account for today
                  const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) + 2;
                  
                  if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
                    return <span className="ml-2 text-red-500">Expiring soon! ({daysUntilExpiry} days left)</span>;
                  } else if (daysUntilExpiry <= 0) {
                    return <span className="ml-2 text-red-500">Expired</span>;
                  }
                  return null;
                })()}
              </p>
            )}
            <div className="mt-2 flex items-baseline">
              <p className="font-semibold mr-1 flex-shrink-0">Notes:</p>
              <p className="break-words whitespace-pre-wrap min-w-0">{gift.notes ? gift.notes : 'N/A'}</p>
            </div>
            {(gift.price > 0 || gift.source) && (
              <p className="mt-2 text-sm text-gray-500">
                {gift.price > 0 ? `$${gift.price.toFixed(2)}` : ''}
                {gift.price > 0 && gift.source ? ' ' : ''}{/* Add space only if both exist */}
                {gift.source ? `from ${gift.source}` : ''}{/* Changed label to lowercase and removed colon */}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FlowerTracker; 