import { Router, Request, Response, NextFunction } from 'express';
import SharedGoal from '../models/SharedGoal';

const router = Router();

// Get all shared goals
const getAllSharedGoals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sharedGoals = await SharedGoal.find().sort({ targetDate: 1 });
    res.json(sharedGoals);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shared goals', error });
  }
};

// Get shared goals by category
const getSharedGoalsByCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.params;
    const sharedGoals = await SharedGoal.find({ category }).sort({ targetDate: 1 });
    res.json(sharedGoals);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shared goals by category', error });
  }
};

// Get shared goals by status
const getSharedGoalsByStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.params;
    const sharedGoals = await SharedGoal.find({ status }).sort({ targetDate: 1 });
    res.json(sharedGoals);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shared goals by status', error });
  }
};

// Get a single shared goal
const getSharedGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sharedGoal = await SharedGoal.findById(req.params.id);
    if (!sharedGoal) {
      return res.status(404).json({ message: 'Shared goal not found' });
    }
    res.json(sharedGoal);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shared goal', error });
  }
};

// Create a new shared goal
const createSharedGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sharedGoal = new SharedGoal(req.body);
    const savedSharedGoal = await sharedGoal.save();
    res.status(201).json(savedSharedGoal);
  } catch (error) {
    res.status(400).json({ message: 'Error creating shared goal', error });
  }
};

// Update a shared goal
const updateSharedGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sharedGoal = await SharedGoal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!sharedGoal) {
      return res.status(404).json({ message: 'Shared goal not found' });
    }
    res.json(sharedGoal);
  } catch (error) {
    res.status(400).json({ message: 'Error updating shared goal', error });
  }
};

// Delete a shared goal
const deleteSharedGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sharedGoal = await SharedGoal.findByIdAndDelete(req.params.id);
    if (!sharedGoal) {
      return res.status(404).json({ message: 'Shared goal not found' });
    }
    res.json({ message: 'Shared goal deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting shared goal', error });
  }
};

// Get shared goals statistics
const getSharedGoalsStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await SharedGoal.aggregate([
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

router.get('/', getAllSharedGoals);
router.get('/stats', getSharedGoalsStats);
router.get('/category/:category', getSharedGoalsByCategory);
router.get('/status/:status', getSharedGoalsByStatus);
router.get('/:id', getSharedGoal);
router.post('/', createSharedGoal);
router.put('/:id', updateSharedGoal);
router.delete('/:id', deleteSharedGoal);

export default router; 