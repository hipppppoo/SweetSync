import express, { RequestHandler } from 'express';
import FavoriteThing from '../models/FavoriteThing';

const router = express.Router();

// Get all favorite things
const getAllFavoriteThings: RequestHandler = async (req, res) => {
  try {
    const favoriteThings = await FavoriteThing.find().sort({ dateAdded: -1 });
    res.json(favoriteThings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching favorite things', error });
  }
};

// Get favorite things by category
const getFavoriteThingsByCategory: RequestHandler = async (req, res) => {
  try {
    const { category } = req.params;
    const favoriteThings = await FavoriteThing.find({ category }).sort({ dateAdded: -1 });
    res.json(favoriteThings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching favorite things by category', error });
  }
};

// Get a single favorite thing
const getFavoriteThing: RequestHandler = async (req, res) => {
  try {
    const favoriteThing = await FavoriteThing.findById(req.params.id);
    if (!favoriteThing) {
      return res.status(404).json({ message: 'Favorite thing not found' });
    }
    res.json(favoriteThing);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching favorite thing', error });
  }
};

// Create a new favorite thing
const createFavoriteThing: RequestHandler = async (req, res) => {
  try {
    const favoriteThing = new FavoriteThing(req.body);
    const savedFavoriteThing = await favoriteThing.save();
    res.status(201).json(savedFavoriteThing);
  } catch (error) {
    res.status(400).json({ message: 'Error creating favorite thing', error });
  }
};

// Update a favorite thing
const updateFavoriteThing: RequestHandler = async (req, res) => {
  try {
    const favoriteThing = await FavoriteThing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!favoriteThing) {
      return res.status(404).json({ message: 'Favorite thing not found' });
    }
    res.json(favoriteThing);
  } catch (error) {
    res.status(400).json({ message: 'Error updating favorite thing', error });
  }
};

// Delete a favorite thing
const deleteFavoriteThing: RequestHandler = async (req, res) => {
  try {
    const favoriteThing = await FavoriteThing.findByIdAndDelete(req.params.id);
    if (!favoriteThing) {
      return res.status(404).json({ message: 'Favorite thing not found' });
    }
    res.json({ message: 'Favorite thing deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting favorite thing', error });
  }
};

// Get favorite things statistics
const getFavoriteThingsStats: RequestHandler = async (req, res) => {
  try {
    const stats = await FavoriteThing.aggregate([
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

router.get('/', getAllFavoriteThings);
router.get('/stats', getFavoriteThingsStats);
router.get('/category/:category', getFavoriteThingsByCategory);
router.get('/:id', getFavoriteThing);
router.post('/', createFavoriteThing);
router.put('/:id', updateFavoriteThing);
router.delete('/:id', deleteFavoriteThing);

export default router; 