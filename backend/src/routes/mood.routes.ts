import express, { RequestHandler } from 'express';
import MoodEntry from '../models/MoodEntry';

const router = express.Router();

// Get all mood entries
const getAllMoodEntries: RequestHandler = async (req, res) => {
  try {
    const moodEntries = await MoodEntry.find().sort({ date: -1 });
    res.json(moodEntries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching mood entries', error });
  }
};

// Get a single mood entry
const getMoodEntry: RequestHandler = async (req, res) => {
  try {
    const moodEntry = await MoodEntry.findById(req.params.id);
    if (!moodEntry) {
      return res.status(404).json({ message: 'Mood entry not found' });
    }
    res.json(moodEntry);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching mood entry', error });
  }
};

// Create a new mood entry
const createMoodEntry: RequestHandler = async (req, res) => {
  try {
    const moodEntry = new MoodEntry(req.body);
    const savedMoodEntry = await moodEntry.save();
    res.status(201).json(savedMoodEntry);
  } catch (error) {
    res.status(400).json({ message: 'Error creating mood entry', error });
  }
};

// Update a mood entry
const updateMoodEntry: RequestHandler = async (req, res) => {
  try {
    const moodEntry = await MoodEntry.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!moodEntry) {
      return res.status(404).json({ message: 'Mood entry not found' });
    }
    res.json(moodEntry);
  } catch (error) {
    res.status(400).json({ message: 'Error updating mood entry', error });
  }
};

// Delete a mood entry
const deleteMoodEntry: RequestHandler = async (req, res) => {
  try {
    const moodEntry = await MoodEntry.findByIdAndDelete(req.params.id);
    if (!moodEntry) {
      return res.status(404).json({ message: 'Mood entry not found' });
    }
    res.json({ message: 'Mood entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting mood entry', error });
  }
};

// Get mood statistics
const getMoodStats: RequestHandler = async (req, res) => {
  try {
    const stats = await MoodEntry.aggregate([
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

router.get('/', getAllMoodEntries);
router.get('/stats', getMoodStats);
router.get('/:id', getMoodEntry);
router.post('/', createMoodEntry);
router.put('/:id', updateMoodEntry);
router.delete('/:id', deleteMoodEntry);

export default router; 