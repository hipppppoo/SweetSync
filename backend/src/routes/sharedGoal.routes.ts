import { Router, Request, Response, NextFunction } from 'express';
import SharedGoal from '../models/SharedGoal';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Get all shared goals for the user
const getAllSharedGoals = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const sharedGoals = await SharedGoal.find({ userId: req.user._id }).sort({ targetDate: 1 });
    res.json(sharedGoals);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shared goals', error });
  }
};

// Get shared goals by category for the user
const getSharedGoalsByCategory = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const { category } = req.params;
    const sharedGoals = await SharedGoal.find({ category, userId: req.user._id }).sort({ targetDate: 1 });
    res.json(sharedGoals);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shared goals by category', error });
  }
};

// Get shared goals by status for the user
const getSharedGoalsByStatus = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const { status } = req.params;
    const sharedGoals = await SharedGoal.find({ status, userId: req.user._id }).sort({ targetDate: 1 });
    res.json(sharedGoals);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shared goals by status', error });
  }
};

// Get a single shared goal (checking ownership)
const getSharedGoal = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const sharedGoal = await SharedGoal.findById(req.params.id);
    if (!sharedGoal) {
      return res.status(404).json({ message: 'Shared goal not found' });
    }
    if (sharedGoal.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'User not authorized' });
    }
    res.json(sharedGoal);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shared goal', error });
  }
};

// Create a new shared goal for the user
const createSharedGoal = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const sharedGoal = new SharedGoal({ 
        ...req.body, 
        userId: req.user._id 
    });
    const savedSharedGoal = await sharedGoal.save();
    res.status(201).json(savedSharedGoal);
  } catch (error) {
    res.status(400).json({ message: 'Error creating shared goal', error });
  }
};

// Update a shared goal (checking ownership)
const updateSharedGoal = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const goalToUpdate = await SharedGoal.findById(req.params.id);
    if (!goalToUpdate) {
        return res.status(404).json({ message: 'Shared goal not found' });
    }
    if (goalToUpdate.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'User not authorized' });
    }

    const updatedSharedGoal = await SharedGoal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedSharedGoal);
  } catch (error) {
    res.status(400).json({ message: 'Error updating shared goal', error });
  }
};

// Delete a shared goal (checking ownership)
const deleteSharedGoal = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const goalToDelete = await SharedGoal.findById(req.params.id);
    if (!goalToDelete) {
      return res.status(404).json({ message: 'Shared goal not found' });
    }
    if (goalToDelete.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'User not authorized' });
    }

    await SharedGoal.findByIdAndDelete(req.params.id);
    res.json({ message: 'Shared goal deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting shared goal', error });
  }
};

// Get shared goals statistics for the user
const getSharedGoalsStats = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const stats = await SharedGoal.aggregate([
      {
        $match: { userId: req.user._id } // Filter by user
      },
      {
        $group: {
          _id: null,
          totalGoals: { $sum: 1 },
          completedGoals: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          inProgressGoals: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] },
          },
          plannedGoals: {
            $sum: { $cond: [{ $eq: ['$status', 'planned'] }, 1, 0] },
          },
          onHoldGoals: {
            $sum: { $cond: [{ $eq: ['$status', 'on_hold'] }, 1, 0] },
          },
          averageProgress: { $avg: '$progress' },
          categoryDistribution: {
            $push: '$category',
          },
          upcomingDeadlines: {
            $push: {
              $cond: [
                { $gt: ['$targetDate', new Date()] },
                {
                  title: '$title',
                  targetDate: '$targetDate',
                  progress: '$progress',
                },
                null,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalGoals: 1,
          completedGoals: 1,
          inProgressGoals: 1,
          plannedGoals: 1,
          onHoldGoals: 1,
          averageProgress: { $round: ['$averageProgress', 2] },
          categoryDistribution: 1,
          upcomingDeadlines: {
            $filter: {
              input: '$upcomingDeadlines',
              as: 'deadline',
              cond: { $ne: ['$$deadline', null] },
            },
          },
        },
      },
    ]);

    res.json(stats[0] || {
      totalGoals: 0,
      completedGoals: 0,
      inProgressGoals: 0,
      plannedGoals: 0,
      onHoldGoals: 0,
      averageProgress: 0,
      categoryDistribution: [],
      upcomingDeadlines: [],
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shared goals statistics', error });
  }
};

// --- Routes --- (Middleware already applied)
router.get('/', protect, getAllSharedGoals);
router.get('/stats', protect, getSharedGoalsStats);
router.get('/category/:category', protect, getSharedGoalsByCategory);
router.get('/status/:status', protect, getSharedGoalsByStatus);
router.get('/:id', protect, getSharedGoal);
router.post('/', protect, createSharedGoal);
router.put('/:id', protect, updateSharedGoal);
router.delete('/:id', protect, deleteSharedGoal);

export default router; 