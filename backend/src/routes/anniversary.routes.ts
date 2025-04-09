console.log("--- Evaluating anniversary.routes.ts ---"); // Log at top

import express, { Request, Response, RequestHandler } from 'express';
import Anniversary from '../models/Anniversary';
import { parseISO, isValid } from 'date-fns';
import { protect } from '../middleware/authMiddleware'; // Import the protect middleware

console.log("--- Imports successful in anniversary.routes.ts ---"); // Log after imports

const router = express.Router();

console.log("--- Router created in anniversary.routes.ts ---"); // Log after router creation

// Get all anniversaries for the logged-in user
const getAllAnniversaries: RequestHandler = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  try {
    const anniversaries = await Anniversary.find({ userId: req.user._id }).sort({ date: 1 }); 
    res.json(anniversaries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching anniversaries', error });
  }
};

// Get monthly reminders for the logged-in user
const getMonthlyReminders: RequestHandler = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  try {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const monthlyAnniversaries = await Anniversary.find({
      userId: req.user._id, // Filter by user
      monthlyReminder: true
    });

    // Filter and format the response
    const reminders = monthlyAnniversaries.map(anniversary => {
      const originalDate = new Date(anniversary.date);
      const reminderDate = new Date(currentYear, currentMonth, anniversary.monthlyReminderDay ?? originalDate.getDate()); // Use day from date if not set
      
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

// Get a single anniversary (checking ownership)
const getAnniversary: RequestHandler = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  try {
    const anniversary = await Anniversary.findById(req.params.id);
    if (!anniversary) {
      return res.status(404).json({ message: 'Anniversary not found' });
    }
    // Check ownership
    if (anniversary.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'User not authorized to view this anniversary' });
    }
    res.json(anniversary);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching anniversary', error });
  }
};

// Create a new anniversary associated with the logged-in user
const createAnniversary: RequestHandler = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
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

    const newAnniversary = new Anniversary({ 
        ...req.body, 
        userId: req.user._id // Associate with logged-in user
    }); 
    const savedAnniversary = await newAnniversary.save();
    res.status(201).json(savedAnniversary);
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating anniversary', error: error.toString() });
  }
};

// Update an anniversary (checking ownership)
const updateAnniversary: RequestHandler = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  try {
    const { date } = req.body;
    if (date && !isValid(parseISO(date))) {
       return res.status(400).json({ message: 'Invalid date format' });
    }

    const anniversary = await Anniversary.findById(req.params.id);
    if (!anniversary) {
        return res.status(404).json({ message: 'Anniversary not found' });
    }
    // Check ownership
    if (anniversary.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'User not authorized to update this anniversary' });
    }

    // If authorized, proceed with update
    const updatedAnniversary = await Anniversary.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json(updatedAnniversary);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating anniversary', error: error.toString() });
  }
};

// Delete an anniversary (checking ownership)
const deleteAnniversary: RequestHandler = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  try {
    const anniversary = await Anniversary.findById(req.params.id);
    if (!anniversary) {
      return res.status(404).json({ message: 'Anniversary not found' });
    }
    // Check ownership
    if (anniversary.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'User not authorized to delete this anniversary' });
    }

    // If authorized, proceed with delete
    await Anniversary.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Anniversary deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting anniversary', error: error.toString() });
  }
};

// Get upcoming anniversaries for the logged-in user
const getUpcomingAnniversaries: RequestHandler = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  try {
    const days = parseInt(req.params.days) || 30;
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const anniversaries = await Anniversary.find({
        userId: req.user._id, // Filter by user
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

// Get stats for the logged-in user
const getStats: RequestHandler = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  console.log("Received request for /api/anniversaries/stats for user:", req.user._id);
  try {
    console.log("Attempting Anniversary.countDocuments({ userId: req.user._id })...");
    const totalAnniversaries = await Anniversary.countDocuments({ userId: req.user._id }); // Filter by user
    console.log("Counted anniversaries:", totalAnniversaries);
    res.json({ totalAnniversaries });
  } catch (error: any) {
    console.error("Error in /api/anniversaries/stats:", error);
    res.status(500).json({ message: 'Error fetching anniversary stats', error: error.toString() });
  }
};

// --- Routes --- (Middleware already applied in previous step)
console.log("--- Registering /stats route in anniversary.routes.ts ---");
router.get('/stats', protect, getStats);
console.log("--- /stats route registered in anniversary.routes.ts ---");

router.get('/', protect, getAllAnniversaries);
router.get('/monthly-reminders', protect, getMonthlyReminders);
router.get('/:id', protect, getAnniversary);
router.post('/', protect, createAnniversary);
router.put('/:id', protect, updateAnniversary);
router.delete('/:id', protect, deleteAnniversary);
router.get('/upcoming/:days', protect, getUpcomingAnniversaries);

console.log("--- Finished evaluating anniversary.routes.ts ---");

export default router; 