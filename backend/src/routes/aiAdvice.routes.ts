import express, { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { protect } from '../middleware/authMiddleware'; // Import protect middleware

// Ensure environment variables are loaded
dotenv.config();

const router = express.Router();

// Groq API configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Debug logging
console.log('Available environment variables:', Object.keys(process.env));
console.log('GROQ_API_KEY exists:', !!process.env.GROQ_API_KEY);

// Get AI relationship advice
router.post('/', protect, async (req: Request, res: Response) => {
  // No user-specific data needed for the query itself, but access requires login
  try {
    const { message } = req.body;
    console.log('Received message:', message);

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    if (!GROQ_API_KEY) {
      console.error('Groq API key not found. Environment:', {
        GROQ_API_KEY_EXISTS: !!process.env.GROQ_API_KEY,
        NODE_ENV: process.env.NODE_ENV
      });
      return res.status(500).json({ message: 'Groq API key is not configured' });
    }

    console.log('Making request to Groq API...');
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a compassionate and knowledgeable relationship advisor. 
            Your goal is to provide helpful, practical advice while maintaining a supportive and understanding tone. 
            Focus on promoting healthy communication, mutual understanding, and positive relationship practices. 
            Avoid giving advice that could be harmful or manipulative.
            Keep responses concise and actionable.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Received response from Groq API');
    const advice = response.data.choices[0].message.content;
    res.json({ advice });
  } catch (error: any) {
    console.error('Error getting AI advice:', error.response?.data || error.message);
    res.status(500).json({ message: 'Error getting AI advice' });
  }
});

export default router;