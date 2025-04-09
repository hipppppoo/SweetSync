import express, { RequestHandler, Request, Response } from 'express';
import DateNight from '../models/DateNight';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Get all date nights for the user
const getAllDateNights: RequestHandler = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const dateNights = await DateNight.find({ userId: req.user._id }).sort({ date: -1 });
    res.json(dateNights);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching date nights', error });
  }
};

// Get a single date night (checking ownership)
const getDateNight: RequestHandler = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const dateNight = await DateNight.findById(req.params.id);
    if (!dateNight) {
      return res.status(404).json({ message: 'Date night not found' });
    }
    if (dateNight.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'User not authorized' });
    }
    res.json(dateNight);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching date night', error });
  }
};

// Create a new date night for the user
const createDateNight: RequestHandler = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const dateNight = new DateNight({ 
        ...req.body, 
        userId: req.user._id 
    });
    const savedDateNight = await dateNight.save();
    res.status(201).json(savedDateNight);
  } catch (error) {
    res.status(400).json({ message: 'Error creating date night', error });
  }
};

// Update a date night (checking ownership)
const updateDateNight: RequestHandler = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const dateNightToUpdate = await DateNight.findById(req.params.id);
    if (!dateNightToUpdate) {
        return res.status(404).json({ message: 'Date night not found' });
    }
    if (dateNightToUpdate.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'User not authorized' });
    }

    const updatedDateNight = await DateNight.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedDateNight);
  } catch (error) {
    res.status(400).json({ message: 'Error updating date night', error });
  }
};

// Delete a date night (checking ownership)
const deleteDateNight: RequestHandler = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const dateNightToDelete = await DateNight.findById(req.params.id);
    if (!dateNightToDelete) {
      return res.status(404).json({ message: 'Date night not found' });
    }
    if (dateNightToDelete.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'User not authorized' });
    }

    await DateNight.findByIdAndDelete(req.params.id);
    res.json({ message: 'Date night deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting date night', error });
  }
};

// Get date night statistics for the user
const getDateNightStats: RequestHandler = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const stats = await DateNight.aggregate([
      {
        $match: { userId: req.user._id } // Filter by user
      },
      {
        $group: {
          _id: null,
          totalDates: { $sum: 1 },
          averageCost: { $avg: '$cost' },
          totalSpent: { $sum: '$cost' },
          averageRating: { $avg: '$rating' },
          favoriteActivities: {
            $push: {
              activity: '$activity',
              rating: '$rating',
            },
          },
          moodDistribution: {
            $push: '$mood',
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalDates: 1,
          averageCost: { $round: ['$averageCost', 2] },
          totalSpent: { $round: ['$totalSpent', 2] },
          averageRating: { $round: ['$averageRating', 2] },
          favoriteActivities: 1,
          moodDistribution: 1,
        },
      },
    ]);

    res.json(stats[0] || {
      totalDates: 0,
      averageCost: 0,
      totalSpent: 0,
      averageRating: 0,
      favoriteActivities: [],
      moodDistribution: [],
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching date night statistics', error });
  }
};

// --- Routes --- (Middleware already applied)
router.get('/', protect, getAllDateNights);
router.get('/stats', protect, getDateNightStats);
router.get('/:id', protect, getDateNight);
router.post('/', protect, createDateNight);
router.put('/:id', protect, updateDateNight);
router.delete('/:id', protect, deleteDateNight);

export default router; 