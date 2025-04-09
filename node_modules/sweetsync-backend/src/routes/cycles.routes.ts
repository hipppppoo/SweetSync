import { Router, Request, Response } from 'express';
import Cycle from '../models/Cycle';
import { addDays, differenceInDays } from 'date-fns';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Get all cycles with stats for the user
router.get('/', protect, async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const cycles = await Cycle.find({ userId: req.user._id }).sort({ startDate: -1 });
    const stats = await calculateStats(cycles);
    res.json({ cycles, stats });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cycles' });
  }
});

// Add new cycle for the user
router.post('/', protect, async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const cycle = new Cycle({ 
        ...req.body, 
        userId: req.user._id 
    });
    await cycle.save();
    res.status(201).json(cycle);
  } catch (error) {
    res.status(400).json({ message: 'Error adding cycle' });
  }
});

// Update cycle (checking ownership)
router.put('/:id', protect, async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const cycleToUpdate = await Cycle.findById(req.params.id);
    if (!cycleToUpdate) {
        return res.status(404).json({ message: 'Cycle not found' });
    }
    if (cycleToUpdate.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'User not authorized' });
    }

    const updatedCycle = await Cycle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    // Re-fetch cycles *for the current user* to recalculate stats
    const userCycles = await Cycle.find({ userId: req.user._id }).sort({ startDate: -1 }); 
    const stats = await calculateStats(userCycles);
    res.json({ cycle: updatedCycle, stats }); // Send back updated cycle and new stats
  } catch (error) {
    res.status(400).json({ message: 'Error updating cycle' });
  }
});

// Delete cycle (checking ownership)
router.delete('/:id', protect, async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const cycleToDelete = await Cycle.findById(req.params.id);
    if (!cycleToDelete) {
        return res.status(404).json({ message: 'Cycle not found' });
    }
    if (cycleToDelete.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'User not authorized' });
    }

    await Cycle.findByIdAndDelete(req.params.id);
    res.status(204).send(); // Send 204 No Content on successful deletion
  } catch (error) {
    res.status(500).json({ message: 'Error deleting cycle' });
  }
});

// Calculate statistics and predictions
async function calculateStats(cycles: any[]) {
  if (cycles.length === 0) {
    return {
      averageCycleLength: 0,
      averagePeriodLength: 0,
      nextPredictedDate: new Date(),
      commonSymptoms: [],
      commonMoods: [],
      totalCycles: 0,
    };
  }

  // Calculate cycle lengths
  const cycleLengths = [];
  for (let i = 0; i < cycles.length - 1; i++) {
    const currentStart = new Date(cycles[i].startDate);
    const nextStart = new Date(cycles[i + 1].startDate);
    cycleLengths.push(Math.abs(differenceInDays(currentStart, nextStart)));
  }

  // Calculate period lengths
  const periodLengths = cycles.map(cycle => 
    differenceInDays(new Date(cycle.endDate), new Date(cycle.startDate)) + 1
  );

  // Calculate averages
  const averageCycleLength = cycleLengths.length > 0
    ? Math.round(cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length)
    : 28; // Default to 28 days if not enough data

  const averagePeriodLengthRaw = periodLengths.reduce((sum, length) => sum + length, 0) / periodLengths.length;
  const averagePeriodLength = parseFloat(averagePeriodLengthRaw.toFixed(2));

  // Predict next period
  const lastPeriod = new Date(cycles[0].startDate);
  const nextPredictedDate = addDays(lastPeriod, averageCycleLength);

  // Analyze symptoms and moods
  const symptomCounts: { [key: string]: number } = {};
  const moodCounts: { [key: string]: number } = {};

  cycles.forEach(cycle => {
    cycle.symptoms.forEach((symptom: string) => {
      symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
    });
    cycle.moods.forEach((mood: string) => {
      moodCounts[mood] = (moodCounts[mood] || 0) + 1;
    });
  });

  // Get most common symptoms and moods
  const commonSymptoms = Object.entries(symptomCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([symptom]) => symptom);

  const commonMoods = Object.entries(moodCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([mood]) => mood);

  return {
    averageCycleLength,
    averagePeriodLength,
    nextPredictedDate,
    commonSymptoms,
    commonMoods,
    totalCycles: cycles.length,
  };
}

export default router; 