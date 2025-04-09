import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
} from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Get user profile (already protected)
router.get('/profile', protect, getUserProfile);

// Update user profile (already protected)
router.put('/profile', protect, updateUserProfile);

// Change user password (NEW ROUTE)
router.put('/change-password', protect, changePassword);

export default router; 