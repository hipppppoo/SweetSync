import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { format, parseISO, addDays } from 'date-fns';
import RatingInput from '../components/RatingInput';

interface FavoriteThing {
  _id: string;
  category: string;
  title: string;
  description: string;
  rating: number;
  dateAdded: string;
  isShared: boolean;
}

interface FavoriteThingsStats {
  totalItems: number;
  averageRating: number;
  categoryDistribution: string[];
  sharedCount: number;
}

const FavoriteThings = () => {
  const [favoriteThings, setFavoriteThings] = useState<FavoriteThing[]>([]);
  const [stats, setStats] = useState<FavoriteThingsStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingThing, setEditingThing] = useState<FavoriteThing | null>(null);
  const [newThing, setNewThing] = useState({
    category: '',
    title: '',
    description: '',
    rating: 5,
    isShared: true,
  });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [error, setError] = useState('');
  const [sortKey, setSortKey] = useState<'category' | 'rating'>('category');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchFavoriteThings();
    fetchStats();
  }, []);

  const fetchFavoriteThings = async () => {
    try {
      // Always fetch all things, filtering/sorting happens on frontend
      const response = await axios.get('http://localhost:3000/api/favorite-things');
      setFavoriteThings(response.data);
    } catch (err) {
      setError('Error fetching favorite things');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/favorite-things/stats');
      setStats(response.data);
    } catch (err) {
      setError('Error fetching statistics');
    }
  };

  // Step 2: Filter and Sort Data using useMemo
  const filteredAndSortedThings = useMemo(() => {
    // Filter first
    const filtered = selectedCategory === 'all' 
       ? favoriteThings 
       : favoriteThings.filter(thing => thing.category.toLowerCase() === selectedCategory.toLowerCase());
 
    // Then sort based on selected key and direction
    return [...filtered].sort((a, b) => {
      let comparison = 0;

      if (sortKey === 'rating') {
        // GROUPING BY RATING
        // Primary: Rating (desc)
        comparison = b.rating - a.rating;
        if (comparison === 0) {
          // Secondary: Category (asc)
          comparison = a.category.localeCompare(b.category);
          if (comparison === 0) {
            // Tertiary: Title (asc)
            comparison = a.title.localeCompare(b.title);
          }
        }
      } else { // sortKey === 'category'
        // GROUPING BY CATEGORY
        // Primary: Category (asc)
        comparison = a.category.localeCompare(b.category);
        if (comparison === 0) {
          // Secondary: Rating (respects sortDirection)
          comparison = a.rating - b.rating; // Default asc
          if (sortDirection === 'desc') {
            comparison *= -1; // Make descending
          }
          if (comparison === 0) {
            // Tertiary: Title (asc)
            comparison = a.title.localeCompare(b.title);
          }
        }
      }

      return comparison;
    });
  }, [favoriteThings, selectedCategory, sortKey, sortDirection]);

  // Step 3: Get Unique Ratings (sorted descending)
  const uniqueRatings = useMemo(() => {
    const ratings = new Set(filteredAndSortedThings.map(thing => thing.rating));
    return Array.from(ratings).sort((a, b) => b - a); // Sort descending (10, 9, 8...)
  }, [filteredAndSortedThings]);

  // Calculate unique categories (sorted alphabetically)
  const uniqueCategories = useMemo(() => {
    const categories = new Set(filteredAndSortedThings.map(thing => thing.category));
    return Array.from(categories).sort((a, b) => a.localeCompare(b));
  }, [filteredAndSortedThings]);

  const handleEdit = (thing: FavoriteThing) => {
    setEditingThing(thing);
    setNewThing({
      category: thing.category,
      title: thing.title,
      description: thing.description,
      rating: thing.rating,
      isShared: thing.isShared,
    });
    setIsAddingNew(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingThing) return;

    try {
      await axios.put(`http://localhost:3000/api/favorite-things/${editingThing._id}`, newThing);
      setEditingThing(null);
      setNewThing({
        category: '',
        title: '',
        description: '',
        rating: 5,
        isShared: true,
      });
      setIsAddingNew(false);
      fetchFavoriteThings();
      fetchStats();
    } catch (err) {
      setError('Error updating favorite thing');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingThing) {
        await handleUpdate(e);
      } else {
        await axios.post('http://localhost:3000/api/favorite-things', newThing);
        setNewThing({
          category: '',
          title: '',
          description: '',
          rating: 5,
          isShared: true,
        });
        setIsAddingNew(false);
        fetchFavoriteThings();
        fetchStats();
      }
    } catch (err) {
      setError('Error adding favorite thing');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:3000/api/favorite-things/${id}`);
      fetchFavoriteThings();
      fetchStats();
    } catch (err) {
      setError('Error deleting favorite thing');
    }
  };

  return (
    <div className="space-y-8 container mx-auto px-4 max-w-7xl pt-8 pb-16">
      <h1 className="text-4xl font-display text-primary-dark font-bold text-center">
        Favorite Things
      </h1>

      <div className="text-center">
        <button onClick={() => setIsAddingNew(true)} className="btn btn-primary px-8">
          Add Favorite Thing
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg">{error}</div>
      )}

      {stats && (
        <div className="flex flex-wrap justify-center gap-6 mb-8">
          <div className="card bg-white w-auto px-6">
            <h3 className="text-xl font-semibold mb-2 text-primary-dark text-center">Total Items</h3>
            <p className="text-3xl text-primary text-center">{stats.totalItems}</p>
          </div>
          <div className="card bg-white w-auto px-6">
            <h3 className="text-xl font-semibold mb-2 text-primary-dark text-center">Average Rating</h3>
            <p className="text-3xl text-primary text-center">{stats.averageRating.toFixed(1)}/10</p>
          </div>
          <div className="card bg-white w-auto px-6">
            <h3 className="text-xl font-semibold mb-2 text-primary-dark text-center">Shared Items</h3>
            <p className="text-3xl text-primary text-center">{stats.sharedCount}</p>
          </div>
        </div>
      )}

      {isAddingNew && (
        <div className="card max-w-2xl mx-auto">
          <h2 className="text-2xl font-display text-primary-dark mb-6">
            {editingThing ? 'Edit Favorite Thing' : 'Add Favorite Thing'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={newThing.title}
                  onChange={(e) => setNewThing({ ...newThing, title: e.target.value })}
                  className="input w-full"
                  placeholder="Add a title"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Category</label>
                <input
                  type="text"
                  value={newThing.category}
                  onChange={(e) => setNewThing({ ...newThing, category: e.target.value })}
                  className="input w-full"
                  placeholder="Add a category"
                  required
                />
              </div>
            </div>

            <div>
              <RatingInput
                label="Rating"
                value={newThing.rating || 5}
                onChange={(value) => setNewThing({ ...newThing, rating: value })}
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Notes</label>
              <textarea
                value={newThing.description}
                onChange={(e) => setNewThing({ ...newThing, description: e.target.value })}
                className="input w-full h-24"
                placeholder="Add any additional notes..."
              />
            </div>

            <div>
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id="isShared"
                  checked={newThing.isShared}
                  onChange={(e) =>
                    setNewThing({ ...newThing, isShared: e.target.checked })
                  }
                  className="form-checkbox h-5 w-5 text-primary"
                />
                <label htmlFor="isShared" className="ml-2 text-gray-700">Share with Partner</label>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(false);
                  setEditingThing(null);
                  setNewThing({
                    category: '',
                    title: '',
                    description: '',
                    rating: 5,
                    isShared: true,
                  });
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingThing ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* == Sorting Controls Moved Here == */}
      <div className="flex justify-center gap-4 mt-8 mb-8"> {/* Centered and added margins */}
        <div>
          <label htmlFor="sortKey" className="block text-sm font-medium text-gray-700 mr-2">Sort By</label>
          <select
            id="sortKey"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
            className="input input-sm"
          >
            <option value="category">Category</option>
            <option value="rating">Rating</option>
          </select>
        </div>
        <div>
          {/* Only show Direction when sorting by Category */}
          {sortKey === 'category' && (
            <>
              <label htmlFor="sortDirection" className="block text-sm font-medium text-gray-700 mr-2">Direction</label>
              <select
                id="sortDirection"
                value={sortDirection}
                onChange={(e) => setSortDirection(e.target.value as typeof sortDirection)}
                className="input input-sm"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* Step 3 & 4: Grouping and Separators - Now Conditional */}
      <div className="space-y-8"> 
        {/* Render based on sortKey */} 
        {sortKey === 'rating' && (
          <>
            {uniqueRatings.map((rating, index) => {
              const ratingThings = filteredAndSortedThings.filter(thing => thing.rating === rating); // Filter by rating
              if (ratingThings.length === 0) return null;

              const groupClasses = "pt-8 border-t border-primary-light";

              return (
                <div key={`rating-${rating}`} className={groupClasses}> { /* Use rating as key */}
                  <h2 className="text-2xl font-display text-primary-dark mb-4">
                    Rating: {rating}/10 { /* Update heading */}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ratingThings.map((thing) => ( // Map over ratingThings
                      <div key={thing._id} className="card bg-white">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-semibold text-primary-dark mb-0">{thing.title}</h3>
                            <p className="text-sm text-gray-500">
                              Added on {format(addDays(parseISO(thing.dateAdded), 1), 'MMMM d, yyyy')}
                            </p>
                            <p className="mt-2">
                              <span className="font-semibold mr-1">Category:</span> <span>{thing.category}</span>
                            </p>
                            <p className="mt-2">
                              <span className="font-semibold mr-1">Rating:</span> <span>{thing.rating}/10</span>
                            </p>
                            <p className="mt-2">
                              <span className="font-semibold mr-1">Shared:</span> <span>{thing.isShared ? 'Yes' : 'No'}</span>
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleEdit(thing)} className="text-primary-dark hover:text-primary">✎</button>
                            <button onClick={() => handleDelete(thing._id)} className="text-gray-400 hover:text-red-500">×</button>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="flex items-baseline">
                            <p className="font-semibold mr-1 flex-shrink-0">Notes:</p>
                            <p className="break-words whitespace-pre-wrap min-w-0">{thing.description ? thing.description : 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {sortKey === 'category' && (
          <>
            {uniqueCategories.map((category, index) => {
              const categoryThings = filteredAndSortedThings.filter(thing => thing.category === category); // Filter by category
              if (categoryThings.length === 0) return null;

              const groupClasses = "pt-8 border-t border-primary-light";

              return (
                <div key={`category-${category}`} className={groupClasses}> { /* Use category as key */}
                  <h2 className="text-2xl font-display text-primary-dark mb-4">
                    {category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Uncategorized'} { /* Category heading */}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryThings.map((thing) => ( // Map over categoryThings
                      <div key={thing._id} className="card bg-white">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-semibold text-primary-dark mb-0">{thing.title}</h3>
                            <p className="text-sm text-gray-500">
                              Added on {format(addDays(parseISO(thing.dateAdded), 1), 'MMMM d, yyyy')}
                            </p>
                            <p className="mt-2">
                              <span className="font-semibold mr-1">Category:</span> <span>{thing.category}</span>
                            </p>
                            <p className="mt-2">
                              <span className="font-semibold mr-1">Rating:</span> <span>{thing.rating}/10</span>
                            </p>
                            <p className="mt-2">
                              <span className="font-semibold mr-1">Shared:</span> <span>{thing.isShared ? 'Yes' : 'No'}</span>
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleEdit(thing)} className="text-primary-dark hover:text-primary">✎</button>
                            <button onClick={() => handleDelete(thing._id)} className="text-gray-400 hover:text-red-500">×</button>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="flex items-baseline">
                            <p className="font-semibold mr-1 flex-shrink-0">Notes:</p>
                            <p className="break-words whitespace-pre-wrap min-w-0">{thing.description ? thing.description : 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default FavoriteThings; 