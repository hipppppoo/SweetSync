import express, { Request, Response } from 'express';
import ChatHistory from '../models/ChatHistory';

const router = express.Router();

// Get all chat histories
router.get('/', async (_req: Request, res: Response) => {
  try {
    const histories = await ChatHistory.find().sort({ updatedAt: -1 });
    res.json(histories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat histories', error });
  }
});

// Get a specific chat history
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const history = await ChatHistory.findById(req.params.id);
    if (!history) {
      return res.status(404).json({ message: 'Chat history not found' });
    }
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat history', error });
  }
});

// Create a new chat history
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, messages } = req.body;
    const newHistory = new ChatHistory({
      title,
      messages,
    });
    const savedHistory = await newHistory.save();
    res.status(201).json(savedHistory);
  } catch (error) {
    res.status(500).json({ message: 'Error creating chat history', error });
  }
});

// Update a chat history
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;
    const updatedHistory = await ChatHistory.findByIdAndUpdate(
      req.params.id,
      { $set: { messages } },
      { new: true }
    );
    if (!updatedHistory) {
      return res.status(404).json({ message: 'Chat history not found' });
    }
    res.json(updatedHistory);
  } catch (error) {
    res.status(500).json({ message: 'Error updating chat history', error });
  }
});

// Delete a chat history
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deletedHistory = await ChatHistory.findByIdAndDelete(req.params.id);
    if (!deletedHistory) {
      return res.status(404).json({ message: 'Chat history not found' });
    }
    res.json({ message: 'Chat history deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting chat history', error });
  }
});

export default router; 