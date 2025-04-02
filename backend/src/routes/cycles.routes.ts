import { Router } from 'express';
import Cycle from '../models/Cycle';
import { addDays, differenceInDays } from 'date-fns';

const router = Router();

// Get all cycles with stats
router.get('/', async (req, res) => {
  try {
    const cycles = await Cycle.find().sort({ startDate: -1 });
    const stats = await calculateStats(cycles);
    res.json({ cycles, stats });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cycles' });
  }
});

// Add new cycle
router.post('/', async (req, res) => {
  try {
    const cycle = new Cycle(req.body);
    await cycle.save();
    res.status(201).json(cycle);
  } catch (error) {
    res.status(400).json({ message: 'Error adding cycle' });
  }
});

// Update cycle
router.put('/:id', async (req, res) => {
  try {
    const cycle = await Cycle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!cycle) {
      return res.status(404).json({ message: 'Cycle not found' });
    }
    
    const cycles = await Cycle.find().sort({ startDate: -1 });
    const stats = await calculateStats(cycles);
    res.json({ cycle, stats });
  } catch (error) {
    res.status(400).json({ message: 'Error updating cycle' });
  }
});

// Delete cycle
router.delete('/:id', async (req, res) => {
  try {
    await Cycle.findByIdAndDelete(req.params.id);
    res.status(204).send();
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