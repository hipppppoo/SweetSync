import express, { RequestHandler, Request, Response } from 'express';
import FavoriteThing from '../models/FavoriteThing';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Get all favorite things for the user
const getAllFavoriteThings: RequestHandler = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const favoriteThings = await FavoriteThing.find({ userId: req.user._id }).sort({ dateAdded: -1 });
    res.json(favoriteThings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching favorite things', error });
  }
};

// Get favorite things by category for the user
const getFavoriteThingsByCategory: RequestHandler = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const { category } = req.params;
    const favoriteThings = await FavoriteThing.find({ 
        category, 
        userId: req.user._id 
    }).sort({ dateAdded: -1 });
    res.json(favoriteThings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching favorite things by category', error });
  }
};

// Get a single favorite thing (checking ownership)
const getFavoriteThing: RequestHandler = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const favoriteThing = await FavoriteThing.findById(req.params.id);
    if (!favoriteThing) {
      return res.status(404).json({ message: 'Favorite thing not found' });
    }
    if (favoriteThing.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'User not authorized' });
    }
    res.json(favoriteThing);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching favorite thing', error });
  }
};

// Create a new favorite thing for the user
const createFavoriteThing: RequestHandler = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const favoriteThing = new FavoriteThing({ 
        ...req.body, 
        userId: req.user._id 
    });
    const savedFavoriteThing = await favoriteThing.save();
    res.status(201).json(savedFavoriteThing);
  } catch (error) {
    res.status(400).json({ message: 'Error creating favorite thing', error });
  }
};

// Update a favorite thing (checking ownership)
const updateFavoriteThing: RequestHandler = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const thingToUpdate = await FavoriteThing.findById(req.params.id);
    if (!thingToUpdate) {
        return res.status(404).json({ message: 'Favorite thing not found' });
    }
    if (thingToUpdate.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'User not authorized' });
    }

    const updatedFavoriteThing = await FavoriteThing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedFavoriteThing);
  } catch (error) {
    res.status(400).json({ message: 'Error updating favorite thing', error });
  }
};

// Delete a favorite thing (checking ownership)
const deleteFavoriteThing: RequestHandler = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const thingToDelete = await FavoriteThing.findById(req.params.id);
    if (!thingToDelete) {
      return res.status(404).json({ message: 'Favorite thing not found' });
    }
    if (thingToDelete.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'User not authorized' });
    }

    await FavoriteThing.findByIdAndDelete(req.params.id);
    res.json({ message: 'Favorite thing deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting favorite thing', error });
  }
};

// Get favorite things statistics for the user
const getFavoriteThingsStats: RequestHandler = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const stats = await FavoriteThing.aggregate([
      {
        $match: { userId: req.user._id } // Filter by user
      },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          categoryDistribution: {
            $push: '$category',
          },
          sharedCount: {
            $sum: { $cond: ['$isShared', 1, 0] },
          },
          commonTags: {
            $push: '$tags',
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalItems: 1,
          averageRating: { $round: ['$averageRating', 2] },
          categoryDistribution: 1,
          sharedCount: 1,
          commonTags: 1,
        },
      },
    ]);

    res.json(stats[0] || {
      totalItems: 0,
      averageRating: 0,
      categoryDistribution: [],
      sharedCount: 0,
      commonTags: [],
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching favorite things statistics', error });
  }
};

// --- Routes --- (Middleware already applied)
router.get('/', protect, getAllFavoriteThings);
router.get('/stats', protect, getFavoriteThingsStats);
router.get('/category/:category', protect, getFavoriteThingsByCategory);
router.get('/:id', protect, getFavoriteThing);
router.post('/', protect, createFavoriteThing);
router.put('/:id', protect, updateFavoriteThing);
router.delete('/:id', protect, deleteFavoriteThing);

export default router; 