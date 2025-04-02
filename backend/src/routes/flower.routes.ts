import express, { Request, Response, Router } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import FlowerGift from '../models/FlowerGift';

// Ensure environment variables are loaded
dotenv.config();

const router: Router = express.Router();

// Groq API configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Get all flower gifts
const getAllFlowerGifts = async (req: Request, res: Response): Promise<void> => {
  try {
    const flowerGifts = await FlowerGift.find().sort({ date: -1 });
    res.json(flowerGifts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching flower gifts', error });
  }
};

// Get a single flower gift
const getFlowerGift = async (req: Request, res: Response): Promise<void> => {
  try {
    const flowerGift = await FlowerGift.findById(req.params.id);
    if (!flowerGift) {
      res.status(404).json({ message: 'Flower gift not found' });
      return;
    }
    res.json(flowerGift);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching flower gift', error });
  }
};

// Create a new flower gift
const createFlowerGift = async (req: Request, res: Response): Promise<void> => {
  try {
    const flowerGift = new FlowerGift(req.body);
    const savedFlowerGift = await flowerGift.save();
    res.status(201).json(savedFlowerGift);
  } catch (error) {
    res.status(400).json({ message: 'Error creating flower gift', error });
  }
};

// Update a flower gift
const updateFlowerGift = async (req: Request, res: Response): Promise<void> => {
  try {
    const flowerGift = await FlowerGift.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!flowerGift) {
      res.status(404).json({ message: 'Flower gift not found' });
      return;
    }
    res.json(flowerGift);
  } catch (error) {
    res.status(400).json({ message: 'Error updating flower gift', error });
  }
};

// Delete a flower gift
const deleteFlowerGift = async (req: Request, res: Response): Promise<void> => {
  try {
    const flowerGift = await FlowerGift.findByIdAndDelete(req.params.id);
    if (!flowerGift) {
      res.status(404).json({ message: 'Flower gift not found' });
      return;
    }
    res.json({ message: 'Flower gift deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting flower gift', error });
  }
};

// Get flower statistics
const getFlowerStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await FlowerGift.aggregate([
      {
        $group: {
          _id: null,
          totalGifts: { $sum: 1 },
          averagePrice: { $avg: '$price' },
          totalSpent: { $sum: '$price' },
          favoriteFlowers: {
            $push: {
              type: '$flowerType',
              reaction: '$reaction',
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalGifts: 1,
          averagePrice: { $round: ['$averagePrice', 2] },
          totalSpent: { $round: ['$totalSpent', 2] },
          favoriteFlowers: 1,
        },
      },
    ]);

    res.json(stats[0] || {
      totalGifts: 0,
      averagePrice: 0,
      totalSpent: 0,
      favoriteFlowers: [],
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching flower statistics', error });
  }
};

// Estimate flower expiry date
router.post('/estimate-expiry', async (req: Request, res: Response): Promise<void> => {
  try {
    const { flowerType, purchaseDate } = req.body;

    if (!GROQ_API_KEY) {
      console.error('Groq API key not found');
      res.status(500).json({ message: 'Groq API key is not configured' });
      return;
    }

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an expert florist who knows about flower longevity. Respond only with the number of days this type of flower typically lasts when properly cared for in optimal conditions with flower food and regular water changes. Be generous with your estimates, assuming perfect care conditions. Respond with just the number, no other text.'
          },
          {
            role: 'user',
            content: `What is the maximum number of days ${flowerType} can last with perfect care?`
          }
        ],
        temperature: 0.3,
        max_tokens: 10,
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const daysToExpiry = parseInt(response.data.choices[0].message.content || '7');
    // Cap the maximum days to 30 days
    const cappedDays = Math.min(Math.max(daysToExpiry, 3), 30);
    
    res.json({ daysToExpiry: cappedDays });
  } catch (error: any) {
    console.error('Error estimating flower expiry:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error estimating flower expiry' });
  }
});

router.get('/', getAllFlowerGifts);
router.get('/stats', getFlowerStats);
router.get('/:id', getFlowerGift);
router.post('/', createFlowerGift);
router.put('/:id', updateFlowerGift);
router.delete('/:id', deleteFlowerGift);

export default router; 