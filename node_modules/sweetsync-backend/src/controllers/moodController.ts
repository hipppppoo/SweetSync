import { Request, Response } from 'express';
import Mood from '../models/Mood';

export const getMoods = async (req: Request, res: Response) => {
  try {
    const moods = await Mood.find().sort({ date: -1 });
    
    // Ensure all entries have a happiness level
    const updatedMoods = moods.map(mood => {
      if (typeof mood.happinessLevel !== 'number') {
        mood.happinessLevel = 5; // Set default value
        mood.save(); // Save the update
      }
      return mood;
    });
    
    res.json(updatedMoods);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching moods' });
  }
};

export const getMoodStats = async (req: Request, res: Response) => {
  try {
    const stats = await getMoodStatsData();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error calculating stats' });
  }
};

export const createMood = async (req: Request, res: Response) => {
  try {
    console.log('Received mood data:', req.body);
    
    const mood = new Mood(req.body);
    console.log('Created mood object:', {
      date: mood.date,
      sleepQuality: mood.sleepQuality,
      sleepQualityType: typeof mood.sleepQuality
    });
    
    const validationError = mood.validateSync();
    
    if (validationError) {
      console.error('Validation error:', validationError);
      return res.status(400).json({ 
        message: 'Validation error', 
        details: validationError.errors 
      });
    }
    
    await mood.save();
    console.log('Mood saved successfully:', {
      id: mood._id,
      date: mood.date,
      sleepQuality: mood.sleepQuality
    });
    
    // Return updated stats along with the new mood
    const stats = await getMoodStatsData();
    res.status(201).json({ mood, stats });
  } catch (error) {
    console.error('Error creating mood:', error);
    res.status(400).json({ 
      message: 'Error creating mood entry',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateMood = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const mood = await Mood.findByIdAndUpdate(id, req.body, { new: true });
    if (!mood) {
      return res.status(404).json({ message: 'Mood entry not found' });
    }
    
    // Return updated stats along with the updated mood
    const stats = await getMoodStatsData();
    res.json({ mood, stats });
  } catch (error) {
    res.status(400).json({ message: 'Error updating mood entry' });
  }
};

export const deleteMood = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const mood = await Mood.findByIdAndDelete(id);
    if (!mood) {
      return res.status(404).json({ message: 'Mood entry not found' });
    }
    res.json({ message: 'Mood entry deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting mood entry' });
  }
};

// Helper function to get mood stats
const getMoodStatsData = async () => {
  try {
    // First, let's check what's actually in the database
    const allMoods = await Mood.find().select('sleepQuality date');
    console.log('Raw Mood Entries:', allMoods.map(m => ({
      id: m._id,
      date: m.date,
      sleepQuality: m.sleepQuality
    })));

    const stats = await Mood.aggregate([
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
          // Add debug info for sleep quality
          allSleepQualities: { $push: '$sleepQuality' }
        }
      },
      {
        $project: {
          _id: 0,
          totalEntries: 1,
          averageEnergy: { $round: ['$averageEnergy', 1] },
          averageStress: { $round: ['$averageStress', 1] },
          averageHealth: { $round: ['$averageHealth', 1] },
          averageSleep: { $round: ['$averageSleep', 1] },
          averageSleepQuality: { $round: ['$averageSleepQuality', 1] },
          averageHappiness: { $round: ['$averageHappiness', 1] },
          allSleepQualities: 1
        }
      }
    ]);

    // Debug logging
    console.log('Aggregation Pipeline Results:', {
      rawStats: stats,
      sleepQualities: stats[0]?.allSleepQualities || [],
      calculatedAvg: stats[0]?.allSleepQualities ? 
        stats[0].allSleepQualities.reduce((sum: number, val: number) => sum + val, 0) / stats[0].allSleepQualities.length 
        : 0
    });

    // If no stats found, return default values
    if (!stats || stats.length === 0) {
      return {
        totalEntries: 0,
        averageEnergy: 0,
        averageStress: 0,
        averageHealth: 0,
        averageSleep: 0,
        averageSleepQuality: 0,
        averageHappiness: 0,
      };
    }

    // Return the stats without the debug info
    const { allSleepQualities, ...finalStats } = stats[0];
    return finalStats;
  } catch (error) {
    console.error('Error calculating stats:', error);
    return {
      totalEntries: 0,
      averageEnergy: 0,
      averageStress: 0,
      averageHealth: 0,
      averageSleep: 0,
      averageSleepQuality: 0,
      averageHappiness: 0,
    };
  }
}; 