import express, { RequestHandler } from 'express';
import DateNight from '../models/DateNight';

const router = express.Router();

// Get all date nights
const getAllDateNights: RequestHandler = async (req, res) => {
  try {
    const dateNights = await DateNight.find().sort({ date: -1 });
    res.json(dateNights);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching date nights', error });
  }
};

// Get a single date night
const getDateNight: RequestHandler = async (req, res) => {
  try {
    const dateNight = await DateNight.findById(req.params.id);
    if (!dateNight) {
      return res.status(404).json({ message: 'Date night not found' });
    }
    res.json(dateNight);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching date night', error });
  }
};

// Create a new date night
const createDateNight: RequestHandler = async (req, res) => {
  try {
    const dateNight = new DateNight(req.body);
    const savedDateNight = await dateNight.save();
    res.status(201).json(savedDateNight);
  } catch (error) {
    res.status(400).json({ message: 'Error creating date night', error });
  }
};

// Update a date night
const updateDateNight: RequestHandler = async (req, res) => {
  try {
    const dateNight = await DateNight.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!dateNight) {
      return res.status(404).json({ message: 'Date night not found' });
    }
    res.json(dateNight);
  } catch (error) {
    res.status(400).json({ message: 'Error updating date night', error });
  }
};

// Delete a date night
const deleteDateNight: RequestHandler = async (req, res) => {
  try {
    const dateNight = await DateNight.findByIdAndDelete(req.params.id);
    if (!dateNight) {
      return res.status(404).json({ message: 'Date night not found' });
    }
    res.json({ message: 'Date night deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting date night', error });
  }
};

// Get date night statistics
const getDateNightStats: RequestHandler = async (req, res) => {
  try {
    const stats = await DateNight.aggregate([
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

router.get('/', getAllDateNights);
router.get('/stats', getDateNightStats);
router.get('/:id', getDateNight);
router.post('/', createDateNight);
router.put('/:id', updateDateNight);
router.delete('/:id', deleteDateNight);

export default router; 