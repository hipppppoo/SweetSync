import express, { Request, Response } from 'express';
import ChatHistory from '../models/ChatHistory';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Get all chat histories for the user
router.get('/', protect, async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const histories = await ChatHistory.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    res.json(histories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat histories', error });
  }
});

// Get a specific chat history (checking ownership)
router.get('/:id', protect, async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const history = await ChatHistory.findById(req.params.id);
    if (!history) {
      return res.status(404).json({ message: 'Chat history not found' });
    }
    if (history.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'User not authorized' });
    }
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat history', error });
  }
});

// Create a new chat history for the user
router.post('/', protect, async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const { title, messages } = req.body;
    const newHistory = new ChatHistory({
      title,
      messages,
      userId: req.user._id
    });
    const savedHistory = await newHistory.save();
    res.status(201).json(savedHistory);
  } catch (error) {
    res.status(500).json({ message: 'Error creating chat history', error });
  }
});

// Update a chat history (checking ownership)
router.put('/:id', protect, async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const historyToUpdate = await ChatHistory.findById(req.params.id);
    if (!historyToUpdate) {
        return res.status(404).json({ message: 'Chat history not found' });
    }
    if (historyToUpdate.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'User not authorized' });
    }

    const { messages } = req.body;
    const updatedHistory = await ChatHistory.findByIdAndUpdate(
      req.params.id,
      { $set: { messages } },
      { new: true }
    );
    res.json(updatedHistory);
  } catch (error) {
    res.status(500).json({ message: 'Error updating chat history', error });
  }
});

// Delete a chat history (checking ownership)
router.delete('/:id', protect, async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const historyToDelete = await ChatHistory.findById(req.params.id);
    if (!historyToDelete) {
      return res.status(404).json({ message: 'Chat history not found' });
    }
    if (historyToDelete.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'User not authorized' });
    }

    await ChatHistory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Chat history deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting chat history', error });
  }
});

export default router; 