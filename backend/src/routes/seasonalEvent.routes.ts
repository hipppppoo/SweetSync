import express, { Request, Response } from 'express';
import SeasonalEvent from '../models/SeasonalEvent';
import { addDays, addYears, isBefore, setYear, parseISO, differenceInCalendarDays } from 'date-fns';
import { protect } from '../middleware/authMiddleware'; // Import protect middleware

const router = express.Router();

// Helper function to get next occurrence of a date
const getNextOccurrence = (eventDateISO: string, isRecurring: boolean): Date => {
  const now = new Date();
  now.setUTCHours(12, 0, 0, 0); // Use UTC noon for today for consistent comparison

  let eventDate = parseISO(eventDateISO); // Parse the stored date
  // Ensure event date is also normalized, e.g., to UTC noon for reliable comparison
  eventDate = new Date(Date.UTC(eventDate.getUTCFullYear(), eventDate.getUTCMonth(), eventDate.getUTCDate(), 12, 0, 0));

  let nextOccurrence = new Date(eventDate); // Start with the event date (at UTC noon)

  console.log('\ngetNextOccurrence (Revised v2):');
  console.log('Input eventDateISO:', eventDateISO);
  console.log('Is recurring:', isRecurring);
  console.log('Current date (UTC noon):', now);
  console.log('Event date (Normalized UTC noon):', eventDate);
  console.log('Initial next occurrence:', nextOccurrence);

  if (isRecurring) {
    // Set to the event's month/day but in the current year (still UTC noon)
    // Use Date.UTC to avoid potential local timezone interpretation by setUTCFullYear
    nextOccurrence = new Date(Date.UTC(now.getUTCFullYear(), eventDate.getUTCMonth(), eventDate.getUTCDate(), 12, 0, 0));
    console.log('After setting to current year (UTC noon):', nextOccurrence);

    // Keep adding years until we get a future date (compare UTC noon dates)
    // isBefore should be safe with Date objects representing specific instants
    while (isBefore(nextOccurrence, now)) {
      // Add exactly one year using UTC components
      nextOccurrence = new Date(Date.UTC(nextOccurrence.getUTCFullYear() + 1, nextOccurrence.getUTCMonth(), nextOccurrence.getUTCDate(), 12, 0, 0));
      console.log('Date passed, setting to next year (UTC noon):', nextOccurrence);
    }
  }

  // Ensure the final date is UTC noon (should already be, but belt-and-suspenders)
  nextOccurrence = new Date(Date.UTC(nextOccurrence.getUTCFullYear(), nextOccurrence.getUTCMonth(), nextOccurrence.getUTCDate(), 12, 0, 0));
  console.log('Final next occurrence (UTC noon):', nextOccurrence);
  return nextOccurrence;
};

// Get all events for the user
router.get('/', protect, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const events = await SeasonalEvent.find({ userId: req.user._id }).sort({ type: 1, date: 1 });
    res.json(events);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching events', error: error.toString() });
  }
});

// Get upcoming reminders for the user
router.get('/reminders', protect, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const events = await SeasonalEvent.find({ userId: req.user._id });
    const now = new Date();
    now.setUTCHours(12, 0, 0, 0);  // Use UTC noon for today

    const reminders = events.map(event => {
      const nextOccurrence = getNextOccurrence(event.date.toISOString(), event.isRecurring);
      let reminderDate = addDays(nextOccurrence, -event.reminderDays);
      let daysUntilReminder = differenceInCalendarDays(reminderDate, now);
      const daysUntilEvent = differenceInCalendarDays(nextOccurrence, now);

      if (event.isRecurring && daysUntilReminder < 0) {
        const nextYearOccurrence = new Date(Date.UTC(nextOccurrence.getUTCFullYear() + 1, nextOccurrence.getUTCMonth(), nextOccurrence.getUTCDate(), 12, 0, 0));
        reminderDate = addDays(nextYearOccurrence, -event.reminderDays);
        daysUntilReminder = differenceInCalendarDays(reminderDate, now);
      }

      return {
        _id: event._id,
        title: event.title,
        eventDate: nextOccurrence.toISOString(),
        reminderDate: reminderDate.toISOString(),
        daysUntilReminder, 
        daysUntilEvent,
        isRecurring: event.isRecurring
      };
    }).filter(reminder => reminder.daysUntilReminder >= 0)
      .sort((a, b) => a.daysUntilReminder - b.daysUntilReminder);

    res.json(reminders);
  } catch (error: any) {
    console.error('Error in reminders endpoint:', error);
    res.status(500).json({ message: 'Error fetching reminders', error: error.toString() });
  }
});

// Get event stats for the user
router.get('/stats', protect, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const matchUser = { userId: req.user._id }; 
    const totalEvents = await SeasonalEvent.countDocuments(matchUser);
    const now = new Date();
    const upcomingEvents = await SeasonalEvent.countDocuments({
      ...matchUser,
      $or: [
        { isRecurring: true },
        { isRecurring: false, date: { $gte: now } } 
      ]
    });

    const eventsByType = await SeasonalEvent.aggregate([
      { $match: matchUser }, 
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      totalEvents,
      upcomingEvents,
      eventsByType: Object.fromEntries(
        eventsByType.map(({ _id, count }) => [_id, count])
      )
    };

    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching stats', error: error.toString() });
  }
});

// Create new event for the user
router.post('/', protect, async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const event = new SeasonalEvent({ 
        ...req.body, 
        userId: req.user._id 
    });
    await event.validate();
    const savedEvent = await event.save();
    res.status(201).json(savedEvent);
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ message: 'Validation error', error: error.errors });
    } else {
      res.status(500).json({ message: 'Error creating event', error: error.toString() });
    }
  }
});

// Update event (checking ownership)
router.put('/:id', protect, async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const eventToUpdate = await SeasonalEvent.findById(req.params.id);
    if (!eventToUpdate) {
        return res.status(404).json({ message: 'Event not found' });
    }
    if (eventToUpdate.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'User not authorized' });
    }

    const updatedEvent = await SeasonalEvent.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.json(updatedEvent);
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ message: 'Validation error', error: error.errors });
    } else {
      res.status(500).json({ message: 'Error updating event', error: error.toString() });
    }
  }
});

// Delete event (checking ownership)
router.delete('/:id', protect, async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const eventToDelete = await SeasonalEvent.findById(req.params.id);
    if (!eventToDelete) {
      return res.status(404).json({ message: 'Event not found' });
    }
    if (eventToDelete.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'User not authorized' });
    }

    await SeasonalEvent.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting event', error: error.toString() });
  }
});

export default router; 