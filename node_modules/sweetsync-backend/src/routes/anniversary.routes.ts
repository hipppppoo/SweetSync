console.log("--- Evaluating anniversary.routes.ts ---"); // Log at top

import express, { Request, Response, RequestHandler } from 'express';
import Anniversary from '../models/Anniversary';
import { parseISO, isValid } from 'date-fns';

console.log("--- Imports successful in anniversary.routes.ts ---"); // Log after imports

const router = express.Router();

console.log("--- Router created in anniversary.routes.ts ---"); // Log after router creation

// Get all anniversaries
const getAllAnniversaries: RequestHandler = async (req, res) => {
  try {
    const anniversaries = await Anniversary.find().sort({ date: 1 });
    res.json(anniversaries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching anniversaries', error });
  }
};

// Get monthly reminders
const getMonthlyReminders: RequestHandler = async (req, res) => {
  try {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Find all anniversaries with monthly reminders
    const monthlyAnniversaries = await Anniversary.find({
      monthlyReminder: true
    });

    // Filter and format the response
    const reminders = monthlyAnniversaries.map(anniversary => {
      const originalDate = new Date(anniversary.date);
      const reminderDate = new Date(currentYear, currentMonth, anniversary.monthlyReminderDay);
      
      return {
        _id: anniversary._id,
        title: anniversary.title,
        originalDate: anniversary.date,
        reminderDate: reminderDate,
        description: anniversary.description,
        type: anniversary.type
      };
    });

    res.json(reminders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching monthly reminders', error });
  }
};

// Get a single anniversary
const getAnniversary: RequestHandler = async (req, res) => {
  try {
    const anniversary = await Anniversary.findById(req.params.id);
    if (!anniversary) {
      return res.status(404).json({ message: 'Anniversary not found' });
    }
    res.json(anniversary);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching anniversary', error });
  }
};

// Create a new anniversary
const createAnniversary: RequestHandler = async (req, res) => {
  try {
    // Basic validation (add more as needed)
    const { title, date, time } = req.body;
    if (!title || !date || !time) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const parsedDate = parseISO(date); // Assuming date is sent as ISO string from frontend
    if (!isValid(parsedDate)) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const newAnniversary = new Anniversary(req.body);
    const savedAnniversary = await newAnniversary.save();
    res.status(201).json(savedAnniversary);
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating anniversary', error: error.toString() });
  }
};

// Update an anniversary
const updateAnniversary: RequestHandler = async (req, res) => {
  try {
    const { date } = req.body;
    if (date && !isValid(parseISO(date))) {
       return res.status(400).json({ message: 'Invalid date format' });
    }

    const updatedAnniversary = await Anniversary.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedAnniversary) {
      return res.status(404).json({ message: 'Anniversary not found' });
    }
    res.json(updatedAnniversary);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating anniversary', error: error.toString() });
  }
};

// Delete an anniversary
const deleteAnniversary: RequestHandler = async (req, res) => {
  try {
    const deletedAnniversary = await Anniversary.findByIdAndDelete(req.params.id);
    if (!deletedAnniversary) {
      return res.status(404).json({ message: 'Anniversary not found' });
    }
    res.json({ message: 'Anniversary deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting anniversary', error: error.toString() });
  }
};

// Get upcoming anniversaries
const getUpcomingAnniversaries: RequestHandler = async (req, res) => {
  try {
    const days = parseInt(req.params.days) || 30;
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const anniversaries = await Anniversary.find({
      date: {
        $gte: today,
        $lte: futureDate,
      },
    }).sort({ date: 1 });

    res.json(anniversaries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching upcoming anniversaries', error });
  }
};

// Get stats
const getStats: RequestHandler = async (req, res) => {
  console.log("Received request for /api/anniversaries/stats");
  try {
    console.log("Attempting Anniversary.countDocuments()...");
    const totalAnniversaries = await Anniversary.countDocuments();
    console.log("Counted anniversaries:", totalAnniversaries);
    res.json({ totalAnniversaries });
  } catch (error: any) {
    console.error("Error in /api/anniversaries/stats:", error);
    res.status(500).json({ message: 'Error fetching anniversary stats', error: error.toString() });
  }
};

console.log("--- Registering /stats route in anniversary.routes.ts ---"); // Log before registering /stats
router.get('/stats', getStats);
console.log("--- /stats route registered in anniversary.routes.ts ---"); // Log after registering /stats

router.get('/', getAllAnniversaries);
router.get('/monthly-reminders', getMonthlyReminders);
router.get('/:id', getAnniversary);
router.post('/', createAnniversary);
router.put('/:id', updateAnniversary);
router.delete('/:id', deleteAnniversary);
router.get('/upcoming/:days', getUpcomingAnniversaries);

console.log("--- Finished evaluating anniversary.routes.ts ---"); // Log at bottom

export default router; 