import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, parseISO, addDays } from 'date-fns';
import RatingInput from '../components/RatingInput';

// Helper functions to handle date timezone issues
const formatDateForDisplay = (dateString: string) => {
  // Parse the ISO string and format it, accounting for timezone
  const date = parseISO(dateString);
  return format(date, 'yyyy-MM-dd');
};

const formatDateForAPI = (dateString: string) => {
  // Create date at noon to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0);
  return date.toISOString();
};

interface DateNight {
  _id: string;
  title: string;
  date: string;
  location: string;
  cost: number;
  rating: number;
  photos: string[];
  notes: string;
}

interface DateNightStats {
  totalDates: number;
  averageCost: number;
  totalSpent: number;
  averageRating: number;
}

const DateNights = () => {
  const [dateNights, setDateNights] = useState<DateNight[]>([]);
  const [stats, setStats] = useState<DateNightStats | null>(null);
  const [editingDate, setEditingDate] = useState<DateNight | null>(null);
  const [newDate, setNewDate] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    location: '',
    cost: 0,
    rating: 5,
    photos: [] as string[],
    notes: '',
  });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDateNights();
    fetchStats();
  }, []);

  const fetchDateNights = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/date-nights');
      setDateNights(response.data);
    } catch (err) {
      setError('Error fetching date nights');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/date-nights/stats');
      setStats(response.data);
    } catch (err) {
      setError('Error fetching statistics');
    }
  };

  const handleEdit = (date: DateNight) => {
    setEditingDate(date);
    setNewDate({
      title: date.title,
      date: formatDateForDisplay(date.date),
      location: date.location,
      cost: date.cost,
      rating: date.rating,
      photos: date.photos,
      notes: date.notes,
    });
    setIsAddingNew(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dateData = {
        ...newDate,
        date: formatDateForAPI(newDate.date),
      };
      await axios.put(`http://localhost:3000/api/date-nights/${editingDate?._id}`, dateData);
      setNewDate({
        title: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        location: '',
        cost: 0,
        rating: 5,
        photos: [],
        notes: '',
      });
      setIsAddingNew(false);
      setEditingDate(null);
      fetchDateNights();
      fetchStats();
    } catch (err) {
      setError('Error updating date night');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (editingDate) {
      return handleUpdate(e);
    }
    e.preventDefault();
    try {
      const dateData = {
        ...newDate,
        date: formatDateForAPI(newDate.date),
      };
      await axios.post('http://localhost:3000/api/date-nights', dateData);
      setNewDate({
        title: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        location: '',
        cost: 0,
        rating: 5,
        photos: [],
        notes: '',
      });
      setIsAddingNew(false);
      fetchDateNights();
      fetchStats();
    } catch (err) {
      setError('Error adding date night');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:3000/api/date-nights/${id}`);
      fetchDateNights();
      fetchStats();
    } catch (err) {
      setError('Error deleting date night');
    }
  };

  const renderRating = (rating: number) => {
    return `${rating}/10`;
  };

  return (
    <div className="space-y-8 container mx-auto px-4 max-w-7xl pt-8 pb-16">
      <h1 className="text-4xl font-display text-primary-dark font-bold text-center">
        Date Nights
      </h1>

      <div className="text-center">
        <button
          onClick={() => setIsAddingNew(true)}
          className="btn btn-primary px-8"
        >
          Add New Date
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg">{error}</div>
      )}

      {stats && (
        <div className="flex flex-wrap justify-center gap-6 mb-8">
          <div className="card bg-white w-auto px-6">
            <h3 className="text-xl font-semibold mb-2 text-primary-dark text-center">Total Dates</h3>
            <p className="text-3xl text-primary text-center">{stats.totalDates}</p>
          </div>
          <div className="card bg-white w-auto px-6">
            <h3 className="text-xl font-semibold mb-2 text-primary-dark text-center">Average Rating</h3>
            <p className="text-3xl text-primary text-center">{stats.averageRating.toFixed(1)}/10</p>
          </div>
          <div className="card bg-white w-auto px-6">
            <h3 className="text-xl font-semibold mb-2 text-primary-dark text-center">Average Cost</h3>
            <p className="text-3xl text-primary text-center">${stats.averageCost.toFixed(2)}</p>
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
          <h2 className="text-2xl font-display text-primary-dark mb-6">
            {editingDate ? 'Edit Date Night' : 'Plan New Date Night'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={newDate.title}
                  onChange={(e) => setNewDate({ ...newDate, title: e.target.value })}
                  className="input w-full"
                  placeholder="Add a title"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={newDate.date}
                  onChange={(e) => setNewDate({ ...newDate, date: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={newDate.location}
                  onChange={(e) => setNewDate({ ...newDate, location: e.target.value })}
                  className="input w-full"
                  placeholder="Add a location"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Cost</label>
                <input
                  type="number"
                  value={newDate.cost || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    setNewDate({ ...newDate, cost: value });
                  }}
                  className="input w-full"
                  min="0"
                  step="0.01"
                  placeholder="How much did it cost?"
                />
              </div>
              <RatingInput
                label="Rating"
                value={newDate.rating || 5}
                onChange={(value) => setNewDate({ ...newDate, rating: value })}
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Notes</label>
              <textarea
                value={newDate.notes}
                onChange={(e) => setNewDate({ ...newDate, notes: e.target.value })}
                className="input w-full h-24"
                placeholder="Add any additional notes..."
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(false);
                  setEditingDate(null);
                  setNewDate({
                    title: '',
                    date: format(new Date(), 'yyyy-MM-dd'),
                    location: '',
                    cost: 0,
                    rating: 5,
                    photos: [],
                    notes: '',
                  });
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingDate ? 'Update' : 'Add'} Date Night
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dateNights.map((date) => (
          <div key={date._id} className="card bg-white">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-xl font-semibold text-primary-dark">{date.title}</h3>
                <p className="text-sm text-gray-500">
                  {format(parseISO(date.date), 'MMMM d, yyyy')}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(date)}
                  className="text-primary-dark hover:text-primary"
                >
                  ✎
                </button>
                <button
                  onClick={() => handleDelete(date._id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <p>
                <span className="font-semibold mr-1">Rating:</span> <span>{renderRating(date.rating)}</span>
              </p>
              {date.location && (
                <p className="mt-2">
                  <span className="font-semibold">Location:</span> {date.location}
                </p>
              )}
              {date.cost != null && (
                <p className="mt-2">
                  <span className="font-semibold">Cost:</span> ${date.cost.toFixed(2)}
                </p>
              )}
              <div className="flex items-baseline mt-2">
                <p className="font-semibold mr-1 flex-shrink-0">Notes:</p>
                <p className="break-words whitespace-pre-wrap min-w-0">{date.notes ? date.notes : 'N/A'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DateNights; 