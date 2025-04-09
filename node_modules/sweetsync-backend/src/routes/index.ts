import express from 'express';
import anniversaryRoutes from './anniversary.routes';
import menstrualCycleRoutes from './menstrualCycle.routes';
import flowerRoutes from './flower.routes';
import dateNightRoutes from './dateNight.routes';
import moodRoutes from './mood.routes';
import favoriteThingRoutes from './favoriteThing.routes';
import sharedGoalRoutes from './sharedGoal.routes';
import seasonalEventRoutes from './seasonalEvent.routes';
import aiAdviceRoutes from './aiAdvice.routes';
import chatHistoryRoutes from './chatHistory.routes';
import cyclesRoutes from './cycles.routes';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';

const router = express.Router();

// Authentication Routes
router.use('/auth', authRoutes);

// --- Log before mounting anniversary routes ---
console.log("Mounting /anniversaries routes...");
// ------------------------------------------
router.use('/anniversaries', anniversaryRoutes);
router.use('/menstrual-cycles', menstrualCycleRoutes);
router.use('/flowers', flowerRoutes);
router.use('/date-nights', dateNightRoutes);
router.use('/moods', moodRoutes);
router.use('/favorite-things', favoriteThingRoutes);
router.use('/shared-goals', sharedGoalRoutes);
router.use('/seasonal-events', seasonalEventRoutes);
router.use('/ai-advice', aiAdviceRoutes);
router.use('/chat-history', chatHistoryRoutes);
router.use('/cycles', cyclesRoutes);

// User Routes (Profile, Settings, etc.)
router.use('/users', userRoutes);

export default router; 