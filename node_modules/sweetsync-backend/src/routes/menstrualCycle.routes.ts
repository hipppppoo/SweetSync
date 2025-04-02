import express, { Request, Response, Router } from 'express';
import MenstrualCycle from '../models/MenstrualCycle';

const router: Router = express.Router();

// Get all cycles
router.get('/', async (req: Request, res: Response) => {
  try {
    const cycles = await MenstrualCycle.find().sort({ startDate: -1 });
    res.json(cycles);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cycles', error });
  }
});

// Get a single cycle
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const cycle = await MenstrualCycle.findById(req.params.id);
    if (!cycle) {
      return res.status(404).json({ message: 'Cycle not found' });
    }
    res.json(cycle);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cycle', error });
  }
});

// Create a new cycle
router.post('/', async (req: Request, res: Response) => {
  try {
    const cycle = new MenstrualCycle(req.body);
    const savedCycle = await cycle.save();
    res.status(201).json(savedCycle);
  } catch (error) {
    res.status(400).json({ message: 'Error creating cycle', error });
  }
});

// Update a cycle
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const cycle = await MenstrualCycle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!cycle) {
      return res.status(404).json({ message: 'Cycle not found' });
    }
    res.json(cycle);
  } catch (error) {
    res.status(400).json({ message: 'Error updating cycle', error });
  }
});

// Delete a cycle
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const cycle = await MenstrualCycle.findByIdAndDelete(req.params.id);
    if (!cycle) {
      return res.status(404).json({ message: 'Cycle not found' });
    }
    res.json({ message: 'Cycle deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting cycle', error });
  }
});

// Get cycle predictions
router.get('/predictions/next', async (req: Request, res: Response) => {
  try {
    const cycles = await MenstrualCycle.find()
      .sort({ startDate: -1 })
      .limit(3);

    if (cycles.length < 3) {
      return res.status(400).json({
        message: 'Not enough cycle data for prediction',
        minimumRequired: 3,
        current: cycles.length,
      });
    }

    // Calculate average cycle length
    const cycleLengths = cycles.map((cycle, index) => {
      if (index === cycles.length - 1) return 0;
      const currentStart = new Date(cycle.startDate);
      const nextStart = new Date(cycles[index + 1].startDate);
      return Math.floor(
        (nextStart.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24)
      );
    });

    const averageCycleLength = Math.floor(
      cycleLengths.reduce((sum, length) => sum + length, 0) /
        (cycleLengths.length - 1)
    );

    // Calculate next period date
    const lastPeriodStart = new Date(cycles[0].startDate);
    const nextPeriod = new Date(lastPeriodStart);
    nextPeriod.setDate(lastPeriodStart.getDate() + averageCycleLength);

    res.json({
      nextPeriod,
      averageCycleLength,
      confidence: calculateConfidence(cycleLengths),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating predictions', error });
  }
});

// Helper function to calculate prediction confidence
function calculateConfidence(cycleLengths: number[]): number {
  if (cycleLengths.length < 2) return 0;

  // Calculate standard deviation
  const mean =
    cycleLengths.reduce((sum, length) => sum + length, 0) /
    (cycleLengths.length - 1);
  const squaredDiffs = cycleLengths
    .filter((length) => length !== 0)
    .map((length) => Math.pow(length - mean, 2));
  const variance =
    squaredDiffs.reduce((sum, diff) => sum + diff, 0) / squaredDiffs.length;
  const stdDev = Math.sqrt(variance);

  // Convert standard deviation to confidence score (0-100)
  // Lower standard deviation means higher confidence
  const maxStdDev = 7; // A week variation is considered maximum
  const confidence = Math.max(0, Math.min(100, 100 - (stdDev / maxStdDev) * 100));

  return Math.round(confidence);
}

export default router; 