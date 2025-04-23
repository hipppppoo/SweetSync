import express from 'express';
import SeasonalEvent from '../models/SeasonalEvent';
import { addDays, addYears, isBefore, setYear } from 'date-fns';

const router = express.Router();

// Helper function to get next occurrence of a date
const getNextOccurrence = (date: Date, isRecurring: boolean): Date => {
  const now = new Date();
  let nextDate = new Date(date);

  if (isRecurring) {
    // If it's a recurring event, set the year to current year
    nextDate = setYear(nextDate, now.getFullYear());
    
    // If the date has already passed this year, set it to next year
    if (isBefore(nextDate, now)) {
      nextDate = addYears(nextDate, 1);
    }
  }

  return nextDate;
};

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await SeasonalEvent.find().sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events', error });
  }
});

// Get upcoming reminders
router.get('/reminders', async (req, res) => {
  try {
    const events = await SeasonalEvent.find();
    const now = new Date();
    
    const reminders = events.map(event => {
      const nextOccurrence = getNextOccurrence(new Date(event.date), event.isRecurring);
      const reminderDate = addDays(nextOccurrence, -event.reminderDays);
      
      return {
        _id: event._id,
        title: event.title,
        eventDate: nextOccurrence,
        reminderDate,
        daysUntilReminder: Math.ceil((reminderDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        isRecurring: event.isRecurring
      };
    }).filter(reminder => reminder.daysUntilReminder >= 0)
      .sort((a, b) => a.daysUntilReminder - b.daysUntilReminder);

    res.json(reminders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reminders', error });
  }
});

// Get event stats
router.get('/stats', async (req, res) => {
  try {
    const totalEvents = await SeasonalEvent.countDocuments();
    const now = new Date();
    
    // Get all events to properly calculate upcoming events with recurring dates
    const events = await SeasonalEvent.find();
    const upcomingEvents = events.filter(event => {
      const nextOccurrence = getNextOccurrence(new Date(event.date), event.isRecurring);
      return isBefore(now, nextOccurrence);
    }).length;

    const eventsByType = await SeasonalEvent.aggregate([
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
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error });
  }
});

// Create new event
router.post('/', async (req, res) => {
  try {
    const event = new SeasonalEvent(req.body);
    await event.validate();
    const savedEvent = await event.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    // Handle potential errors, checking for validation errors specifically
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ValidationError' && 'errors' in error) {
      res.status(400).json({ message: 'Validation error', detail: error.errors });
    } else if (error instanceof Error) {
      console.error("Error creating event:", error.message);
      res.status(500).json({ message: `Error creating event: ${error.message}` });
    } else {
      console.error("Unknown error creating event:", error);
      res.status(500).json({ message: 'An unknown error occurred while creating the event' });
    }
  }
});

// Update event
router.put('/:id', async (req, res) => {
  try {
    const event = await SeasonalEvent.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    // Handle potential errors, checking for validation errors specifically
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ValidationError' && 'errors' in error) {
        res.status(400).json({ message: 'Validation error', detail: error.errors });
    } else if (error instanceof Error) {
        console.error("Error updating event:", error.message);
        res.status(500).json({ message: `Error updating event: ${error.message}` });
    } else {
        console.error("Unknown error updating event:", error);
        res.status(500).json({ message: 'An unknown error occurred while updating the event' });
    }
  }
});

// Delete event
router.delete('/:id', async (req, res) => {
  try {
    const event = await SeasonalEvent.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting event', error });
  }
});

export default router; 