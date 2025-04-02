import express from 'express';
import SeasonalEvent from '../models/SeasonalEvent';
import { addDays, addYears, isBefore, setYear, parseISO, differenceInCalendarDays } from 'date-fns';

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

// Get all events
router.get('/', async (req, res) => {
  try {
    // Sort by type (ascending), then by date (ascending)
    const events = await SeasonalEvent.find().sort({ type: 1, date: 1 });
    res.json(events);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching events', error: error.toString() });
  }
});

// Get upcoming reminders
router.get('/reminders', async (req, res) => {
  try {
    const events = await SeasonalEvent.find();
    const now = new Date();
    now.setUTCHours(12, 0, 0, 0);  // Use UTC noon for today
    console.log('Current time (UTC noon):', now.toISOString());

    const reminders = events.map(event => {
      console.log('\nProcessing event:', event.title);
      const nextOccurrence = getNextOccurrence(event.date.toISOString(), event.isRecurring);
      console.log('Next occurrence calculated:', nextOccurrence.toISOString());
      let reminderDate = addDays(nextOccurrence, -event.reminderDays);
      console.log('Initial reminder date:', reminderDate.toISOString());

      let daysUntilReminder = differenceInCalendarDays(reminderDate, now);

      // Calculate days until the actual event date (always based on immediate next occurrence)
      const daysUntilEvent = differenceInCalendarDays(nextOccurrence, now);

      if (event.isRecurring && daysUntilReminder < 0) {
        console.log('Reminder date is in the past for recurring event. Recalculating reminder for next year.');
        const nextYearOccurrence = new Date(Date.UTC(nextOccurrence.getUTCFullYear() + 1, nextOccurrence.getUTCMonth(), nextOccurrence.getUTCDate(), 12, 0, 0));
        reminderDate = addDays(nextYearOccurrence, -event.reminderDays);
        
        // Recalculate ONLY the reminder days based on the next year's occurrence
        daysUntilReminder = differenceInCalendarDays(reminderDate, now);
        // DO NOT recalculate daysUntilEvent here

        console.log('Recalculated reminder for next year:', { 
            nextYearOccurrence: nextYearOccurrence.toISOString(), 
            reminderDate: reminderDate.toISOString(), 
            daysUntilReminder, 
            daysUntilEvent 
        });
      }

      console.log('Final reminder date:', reminderDate.toISOString());
      console.log('Final Days until reminder (calendar days):', daysUntilReminder);
      console.log('Final Days until event (calendar days):', daysUntilEvent);

      return {
        _id: event._id,
        title: event.title,
        eventDate: nextOccurrence.toISOString(),
        reminderDate: reminderDate.toISOString(),
        daysUntilReminder, 
        daysUntilEvent, // Add this field
        isRecurring: event.isRecurring
      };
    }).filter(reminder => {
      console.log('\nFiltering reminder for:', reminder.title);
      // Keep if the *reminder* is today or in the future
      console.log('Days until reminder:', reminder.daysUntilReminder);
      const keep = reminder.daysUntilReminder >= 0;
      console.log('Keep reminder?', keep);
      return keep;
    }).sort((a, b) => a.daysUntilReminder - b.daysUntilReminder); // Still sort by reminder date

    console.log('\nFinal reminders:', reminders);
    res.json(reminders);
  } catch (error: any) {
    console.error('Error in reminders endpoint:', error);
    res.status(500).json({ message: 'Error fetching reminders', error: error.toString() });
  }
});

// Get event stats
router.get('/stats', async (req, res) => {
  try {
    const totalEvents = await SeasonalEvent.countDocuments();
    const now = new Date();
    const upcomingEvents = await SeasonalEvent.countDocuments({
      $or: [
        { isRecurring: true }, // Always count recurring events
        { isRecurring: false, date: { $gte: now } } // Count non-recurring only if upcoming
      ]
    });

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
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching stats', error: error.toString() });
  }
});

// Create new event
router.post('/', async (req, res) => {
  try {
    const event = new SeasonalEvent(req.body);
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
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ message: 'Validation error', error: error.errors });
    } else {
      res.status(500).json({ message: 'Error updating event', error: error.toString() });
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
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting event', error: error.toString() });
  }
});

export default router; 