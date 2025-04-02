import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

interface DateNight {
  _id: string;
  title: string;
  date: string;
  location: string;
  activity: string;
  cost: number;
  rating: number;
  photos: string[];
  notes: string;
  mood: 'amazing' | 'good' | 'okay' | 'bad';
  weatherCondition: string;
}

interface DateNightStats {
  totalDates: number;
  averageCost: number;
  totalSpent: number;
  averageRating: number;
  favoriteActivities: Array<{ activity: string; rating: number }>;
  moodDistribution: string[];
}

const DateNightTracker = () => {
  const [dateNights, setDateNights] = useState<DateNight[]>([]);
  const [stats, setStats] = useState<DateNightStats | null>(null);
  const [newDate, setNewDate] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    location: '',
    activity: '',
    cost: 0,
    rating: 5,
    photos: [],
    notes: '',
    mood: 'good',
    weatherCondition: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/date-nights', newDate);
      setNewDate({
        title: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        location: '',
        activity: '',
        cost: 0,
        rating: 5,
        photos: [],
        notes: '',
        mood: 'good',
        weatherCondition: '',
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

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-display text-primary-dark font-bold">
          Date Night Tracker
        </h1>
        <button
          onClick={() => setIsAddingNew(true)}
          className="btn btn-primary"
        >
          Add Date Night
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg">{error}</div>
      )}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <h3 className="text-xl font-semibold mb-2">Total Dates</h3>
            <p className="text-3xl text-primary">{stats.totalDates}</p>
          </div>
          <div className="card">
            <h3 className="text-xl font-semibold mb-2">Average Cost</h3>
            <p className="text-3xl text-primary">${stats.averageCost}</p>
          </div>
          <div className="card">
            <h3 className="text-xl font-semibold mb-2">Total Spent</h3>
            <p className="text-3xl text-primary">${stats.totalSpent}</p>
          </div>
          <div className="card">
            <h3 className="text-xl font-semibold mb-2">Average Rating</h3>
            <p className="text-3xl text-primary">{stats.averageRating}/5</p>
          </div>
        </div>
      )}

      {isAddingNew && (
        <div className="card">
          <h2 className="text-2xl font-display text-primary-dark mb-4">
            Add New Date Night
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={newDate.title}
                  onChange={(e) =>
                    setNewDate({ ...newDate, title: e.target.value })
                  }
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={newDate.date}
                  onChange={(e) =>
                    setNewDate({ ...newDate, date: e.target.value })
                  }
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={newDate.location}
                  onChange={(e) =>
                    setNewDate({ ...newDate, location: e.target.value })
                  }
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Activity</label>
                <input
                  type="text"
                  value={newDate.activity}
                  onChange={(e) =>
                    setNewDate({ ...newDate, activity: e.target.value })
                  }
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Cost</label>
                <input
                  type="number"
                  value={newDate.cost}
                  onChange={(e) =>
                    setNewDate({ ...newDate, cost: Number(e.target.value) })
                  }
                  className="input w-full"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Rating</label>
                <input
                  type="range"
                  value={newDate.rating}
                  onChange={(e) =>
                    setNewDate({ ...newDate, rating: Number(e.target.value) })
                  }
                  className="w-full"
                  min="1"
                  max="5"
                  step="1"
                />
                <div className="text-center text-xl text-primary-dark">
                  {renderStars(newDate.rating)}
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Mood</label>
                <select
                  value={newDate.mood}
                  onChange={(e) =>
                    setNewDate({
                      ...newDate,
                      mood: e.target.value as DateNight['mood'],
                    })
                  }
                  className="input w-full"
                >
                  <option value="amazing">Amazing</option>
                  <option value="good">Good</option>
                  <option value="okay">Okay</option>
                  <option value="bad">Bad</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Weather</label>
                <input
                  type="text"
                  value={newDate.weatherCondition}
                  onChange={(e) =>
                    setNewDate({ ...newDate, weatherCondition: e.target.value })
                  }
                  className="input w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Notes</label>
              <textarea
                value={newDate.notes}
                onChange={(e) =>
                  setNewDate({ ...newDate, notes: e.target.value })
                }
                className="input w-full h-24"
              />
            </div>
            <div className="flex space-x-4">
              <button type="submit" className="btn btn-primary">
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dateNights.map((date) => (
          <div key={date._id} className="card">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-display text-primary-dark">
                  {date.title}
                </h3>
                <p className="text-gray-600">
                  {format(new Date(date.date), 'MMMM d, yyyy')}
                </p>
              </div>
              <button
                onClick={() => handleDelete(date._id)}
                className="text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </div>
            <div className="mt-2">
              <p className="text-gray-700">
                <span className="font-semibold">Location:</span> {date.location}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Activity:</span> {date.activity}
              </p>
            </div>
            {date.notes && (
              <p className="text-gray-600 mt-2 italic">{date.notes}</p>
            )}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-primary-dark">
                  {renderStars(date.rating)}
                </span>
                <span className="text-gray-600">${date.cost}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="inline-block bg-primary-light text-primary-dark px-3 py-1 rounded-full text-sm">
                  {date.mood}
                </span>
                {date.weatherCondition && (
                  <span className="text-gray-500 text-sm">
                    Weather: {date.weatherCondition}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DateNightTracker; 