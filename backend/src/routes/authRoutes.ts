import express from 'express';
import { signup, login } from '../controllers/authController';

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', signup);

// POST /api/auth/login
router.post('/login', login);

export default router; 