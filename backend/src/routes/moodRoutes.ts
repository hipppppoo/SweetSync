import express from 'express';
import {
  getMoods,
  getMoodStats,
  createMood,
  updateMood,
  deleteMood,
} from '../controllers/moodController';

const router = express.Router();

// Get all moods
router.get('/moods', getMoods);

// Get mood statistics
router.get('/moods/stats', getMoodStats);

// Create a new mood entry
router.post('/moods', createMood);

// Update a mood entry
router.put('/moods/:id', updateMood);

// Delete a mood entry
router.delete('/moods/:id', deleteMood);

export default router; 