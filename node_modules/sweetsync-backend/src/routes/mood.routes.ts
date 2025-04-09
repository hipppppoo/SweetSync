import express, { RequestHandler, Request, Response } from 'express';
import MoodEntry from '../models/MoodEntry';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Get all mood entries for the user
const getAllMoodEntries: RequestHandler = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const moodEntries = await MoodEntry.find({ userId: req.user._id }).sort({ date: -1 });
    res.json(moodEntries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching mood entries', error });
  }
};

// Get a single mood entry (checking ownership)
const getMoodEntry: RequestHandler = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const moodEntry = await MoodEntry.findById(req.params.id);
    if (!moodEntry) {
      return res.status(404).json({ message: 'Mood entry not found' });
    }
    if (moodEntry.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'User not authorized' });
    }
    res.json(moodEntry);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching mood entry', error });
  }
};

// Create a new mood entry for the user
const createMoodEntry: RequestHandler = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const moodEntry = new MoodEntry({ 
        ...req.body, 
        userId: req.user._id 
    });
    const savedMoodEntry = await moodEntry.save();
    res.status(201).json(savedMoodEntry);
  } catch (error) {
    res.status(400).json({ message: 'Error creating mood entry', error });
  }
};

// Update a mood entry (checking ownership)
const updateMoodEntry: RequestHandler = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const entryToUpdate = await MoodEntry.findById(req.params.id);
    if (!entryToUpdate) {
        return res.status(404).json({ message: 'Mood entry not found' });
    }
    if (entryToUpdate.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'User not authorized' });
    }

    const updatedMoodEntry = await MoodEntry.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedMoodEntry);
  } catch (error) {
    res.status(400).json({ message: 'Error updating mood entry', error });
  }
};

// Delete a mood entry (checking ownership)
const deleteMoodEntry: RequestHandler = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const entryToDelete = await MoodEntry.findById(req.params.id);
    if (!entryToDelete) {
      return res.status(404).json({ message: 'Mood entry not found' });
    }
    if (entryToDelete.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'User not authorized' });
    }

    await MoodEntry.findByIdAndDelete(req.params.id);
    res.json({ message: 'Mood entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting mood entry', error });
  }
};

// Get mood statistics for the user
const getMoodStats: RequestHandler = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const stats = await MoodEntry.aggregate([
      {
        $match: { userId: req.user._id } // Filter by user
      },
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          averageEnergy: { $avg: '$energy' },
          averageStress: { $avg: '$stressLevel' },
          averageHealth: { $avg: '$physicalHealth' },
          averageSleep: { $avg: '$sleepHours' },
          averageSleepQuality: { $avg: '$sleepQuality' },
          averageHappiness: { $avg: '$happinessLevel' },
          moodDistribution: {
            $push: '$mood',
          },
          commonActivities: {
            $push: '$activities',
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalEntries: 1,
          averageEnergy: { $round: ['$averageEnergy', 2] },
          averageStress: { $round: ['$averageStress', 2] },
          averageHealth: { $round: ['$averageHealth', 2] },
          averageSleep: { $round: ['$averageSleep', 2] },
          averageSleepQuality: { $round: ['$averageSleepQuality', 2] },
          averageHappiness: { $round: ['$averageHappiness', 2] },
          moodDistribution: 1,
          commonActivities: 1,
        },
      },
    ]);

    res.json(stats[0] || {
      totalEntries: 0,
      averageEnergy: 0,
      averageStress: 0,
      averageHealth: 0,
      averageSleep: 0,
      averageSleepQuality: 0,
      averageHappiness: 0,
      moodDistribution: [],
      commonActivities: [],
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching mood statistics', error });
  }
};

// --- Routes --- (Middleware already applied)
router.get('/', protect, getAllMoodEntries);
router.get('/stats', protect, getMoodStats);
router.get('/:id', protect, getMoodEntry);
router.post('/', protect, createMoodEntry);
router.put('/:id', protect, updateMoodEntry);
router.delete('/:id', protect, deleteMoodEntry);

export default router; 