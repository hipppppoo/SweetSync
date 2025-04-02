import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { format, parseISO, addDays, addYears, isBefore, differenceInYears, differenceInMonths, differenceInMilliseconds, startOfYear, isSameDay, differenceInCalendarDays } from 'date-fns';

// Helper function to format UTC date string using its embedded YYYY-MM-DD (Restored Logic)
const formatUTCDateAsLocal = (dateString: string, formatString: string) => {
  if (!dateString) return ''; // Handle cases where dateString might be empty initially
  // Directly extract YYYY, MM, DD from the ISO string (e.g., '2024-10-23T....Z')
  const year = parseInt(dateString.substring(0, 4), 10);
  const month = parseInt(dateString.substring(5, 7), 10) - 1; // JS months are 0-indexed
  const day = parseInt(dateString.substring(8, 10), 10);

  // Create a new Date using these components. JS Date constructor treats them as local time components.
  // This effectively bypasses timezone conversion during formatting.
  const localDate = new Date(year, month, day);

  // Format this locally-interpreted date
  return format(localDate, formatString);
};

interface SeasonalEvent {
  _id: string;
  title: string;
  date: string;
  type: string;
  isRecurring: boolean;
  reminderDays: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface SeasonalEventStats {
  totalEvents: number;
  upcomingEvents: number;
  eventsByType: {
    [key: string]: number;
  };
}

interface EventReminder {
  _id: string;
  title: string;
  eventDate: string;
  reminderDate: string;
  daysUntilReminder: number;
  daysUntilEvent: number;
  isRecurring: boolean;
}

// --- Updated Component for Progress Bar ---
const EventProgress = ({ dateString, isRecurring }: { dateString: string, isRecurring: boolean }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const calculateProgress = () => {
      try {
        const targetDate = parseISO(dateString);
        const now = new Date();
        let startDate: Date;
        let totalDuration: number;
        let elapsedDuration: number;

        // Check if target date is today
        if (isSameDay(targetDate, now)) {
          setProgress(100); // Force 100% if event is today
          return;
        }
        // Check if target date has passed (for safety, though handled elsewhere)
        if (isBefore(targetDate, now)) {
          setProgress(100); 
          return;
        }

        if (isRecurring) {
          // Recurring: Progress since last year's occurrence
          startDate = addYears(targetDate, -1); 
        } else {
          // Non-recurring (future): Progress since start of current year
          startDate = startOfYear(now); 
          // Handle edge case where event date is before start of year (shouldn't happen with future check)
          if (isBefore(targetDate, startDate)) { 
             setProgress(0);
             return;
          }
        }

        totalDuration = differenceInMilliseconds(targetDate, startDate);
        elapsedDuration = differenceInMilliseconds(now, startDate);
       
        // Calculate progress, ensuring it's between 0 and 100
        if (totalDuration > 0) {
          const calculatedProgress = Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100));
          setProgress(calculatedProgress);
        } else {
          setProgress(0); // Default to 0 if duration is invalid
        }

      } catch (error) {
        console.error("Error calculating event progress:", dateString, error);
        setProgress(0);
      }
    };

    calculateProgress();
    const interval = setInterval(calculateProgress, 60 * 60 * 1000); // Update every hour

    return () => clearInterval(interval);
  }, [dateString, isRecurring]);
  
  // Don't render the bar if progress is 100 unless it's recurring (handled by isSameDay)
  // Or if it's specifically handled as 'Event Passed' outside this component
  // This avoids showing a dynamic 100% bar briefly before the 'Event Passed' state might show
  if (progress === 100 && !isRecurring && !isSameDay(parseISO(dateString), new Date())) {
      // This case is handled by the 'Event Passed' static bar, so render nothing here
      return null;
  } 

  return (
    <div className="mt-3"> 
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-primary-light to-primary h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }} ></div>
      </div>
    </div>
  );
};
// --- End of Updated Component ---

const Events: React.FC = () => {
  const [events, setEvents] = useState<SeasonalEvent[]>([]);
  const [stats, setStats] = useState<SeasonalEventStats | null>(null);
  const [reminders, setReminders] = useState<EventReminder[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [error, setError] = useState('');
  const [editingEvent, setEditingEvent] = useState<SeasonalEvent | null>(null);
  const [newEvent, setNewEvent] = useState<Omit<SeasonalEvent, '_id' | 'createdAt' | 'updatedAt'>>({
    title: '',
    date: '',
    type: '',
    isRecurring: false,
    reminderDays: 7,
    notes: '',
  });
  const [previousReminderDays, setPreviousReminderDays] = useState(7);

  useEffect(() => {
    fetchEvents();
    fetchStats();
    fetchReminders();
  }, []);

  useEffect(() => {
    if (editingEvent && editingEvent.reminderDays > 0) {
        setPreviousReminderDays(editingEvent.reminderDays);
    } else if (!editingEvent) {
        setPreviousReminderDays(7);
    }
}, [editingEvent]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/seasonal-events');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to fetch events');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/seasonal-events/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchReminders = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/seasonal-events/reminders');
      console.log('Fetched reminders:', response.data);
      console.log('Current events:', events);
      setReminders(response.data);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  const handleEdit = (event: SeasonalEvent) => {
    setEditingEvent(event);
    const dateForInput = formatUTCDateAsLocal(event.date, 'yyyy-MM-dd');
    setNewEvent({
      title: event.title,
      date: dateForInput,
      type: event.type,
      isRecurring: event.isRecurring,
      reminderDays: event.reminderDays,
      notes: event.notes || '',
    });
    if (event.reminderDays > 0) {
      setPreviousReminderDays(event.reminderDays);
    } else {
      setPreviousReminderDays(7);
    }
    setIsAddingNew(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    try {
      // Construct payload with UTC noon date
      const [year, month, day] = newEvent.date.split('-').map(Number);
      const dateToSend = new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).toISOString();
      
      const payload = {
        ...newEvent,
        date: dateToSend,
      };

      await axios.put(`http://localhost:3000/api/seasonal-events/${editingEvent._id}`, payload);
      setEditingEvent(null);
      setIsAddingNew(false);
      // Reset form
      setNewEvent({
        title: '',
        date: '',
        type: '',
        isRecurring: false,
        reminderDays: 7,
        notes: '',
      });
      setPreviousReminderDays(7);
      await fetchEvents();
      await fetchStats();
      await fetchReminders();
    } catch (error) {
      console.error('Error updating event:', error);
      setError('Failed to update event');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await handleUpdate(e);
      } else {
        // Construct payload with UTC noon date for new event
        const [year, month, day] = newEvent.date.split('-').map(Number);
        const dateToSend = new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).toISOString();

        const payload = {
          ...newEvent,
          date: dateToSend,
        };

        await axios.post('http://localhost:3000/api/seasonal-events', payload);
        setIsAddingNew(false);
        // Reset form
        setNewEvent({
          title: '',
          date: '',
          type: '',
          isRecurring: false,
          reminderDays: 7,
          notes: '',
        });
        setPreviousReminderDays(7);
        await fetchEvents();
        await fetchStats();
        await fetchReminders();
      }
    } catch (error) {
      console.error('Error creating/updating event:', error);
      setError('Failed to create/update event');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:3000/api/seasonal-events/${id}`);
      await fetchEvents();
      await fetchStats();
      await fetchReminders();
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('Failed to delete event');
    }
  };

  // --- New Grouping Logic --- 
  // Get unique types from the events array (which is already sorted by type from backend)
  const uniqueTypes = events.reduce((acc: string[], event) => {
    if (!acc.includes(event.type)) {
      acc.push(event.type);
    }
    return acc;
  }, []);
  // --------------------------

  // Reset form needs to also reset previousReminderDays
  const resetForm = () => {
     setIsAddingNew(false);
     setEditingEvent(null);
     setNewEvent({
       title: '',
       date: '',
       type: '',
       isRecurring: false,
       reminderDays: 7,
       notes: '',
     });
     setPreviousReminderDays(7);
  };

  // --- Reminder Input Handlers ---
  const handleReminderToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isEnabled = e.target.checked;
    const currentReminderDays = isEnabled ? previousReminderDays : 0;

    setNewEvent({
        ...newEvent,
        reminderDays: isEnabled ? (previousReminderDays > 0 ? previousReminderDays : 7) : 0,
    });
    if (isEnabled && previousReminderDays <= 0) {
        setPreviousReminderDays(7); 
    }
  };

  const handleReminderDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let days = parseInt(e.target.value, 10);
    if (!isNaN(days) && days < 1) {
      days = 1;
    } else if (isNaN(days)) {
      days = 1;
    }
    
    setNewEvent({ ...newEvent, reminderDays: days });
    if (!isNaN(days) && days > 0) {
       setPreviousReminderDays(days);
    }
  };
  // -----------------------------

  return (
    <div className="space-y-8 container mx-auto px-4 max-w-7xl pt-8 pb-16">
      <h1 className="text-4xl font-display text-primary-dark font-bold text-center">
        Events
      </h1>

      <div className="text-center">
        <button onClick={() => setIsAddingNew(true)} className="btn btn-primary px-8">
          Add New Event
        </button>
      </div>

      {stats && (
        <div className="flex justify-center gap-6 mb-8">
          <div className="card bg-white">
            <h3 className="text-xl font-semibold mb-2 text-primary-dark">Total Events</h3>
            <p className="text-3xl text-primary">{stats.totalEvents}</p>
          </div>
          <div className="card bg-white">
            <h3 className="text-xl font-semibold mb-2 text-primary-dark">Upcoming Events</h3>
            <p className="text-3xl text-primary">{stats.upcomingEvents}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg">{error}</div>
      )}

      {isAddingNew && (
        <div className="card max-w-2xl mx-auto">
          <h2 className="text-2xl font-display text-primary-dark mb-4">
            {editingEvent ? 'Edit Event' : 'Add New Event'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, title: e.target.value })
                }
                className="input w-full"
                placeholder="Add a title"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, date: e.target.value })
                  }
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Type</label>
                <input
                  type="text"
                  value={newEvent.type}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, type: e.target.value })
                  }
                  className="input w-full"
                  placeholder="Add a type"
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-gray-700 mb-2">Notes</label>
              <textarea
                value={newEvent.notes}
                onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                className="input w-full h-24"
                placeholder="Add any additional notes..."
              />
            </div>

            {/* Reminder Checkbox and Input Section */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="reminderEnabled"
                  checked={newEvent.reminderDays > 0}
                  onChange={handleReminderToggle}
                  className="form-checkbox h-5 w-5 text-primary"
                />
                <label htmlFor="reminderEnabled" className="ml-2 text-gray-700">Enable Reminder</label>
              </div>
              {newEvent.reminderDays > 0 && (
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={newEvent.reminderDays}
                    onChange={handleReminderDaysChange}
                    className="input w-20"
                    min="1"
                    required
                  />
                  <span className="text-gray-700">days before</span>
                </div>
              )}
            </div>

            {/* Recurring Checkbox */}
            <div>
              <div className="flex items-center mt-2"> 
                <input
                  type="checkbox"
                  checked={newEvent.isRecurring}
                  onChange={(e) =>
                    setNewEvent({
                      ...newEvent,
                      isRecurring: e.target.checked,
                    })
                  }
                  className="form-checkbox h-5 w-5 text-primary"
                />
                <span className="ml-2 text-gray-700">Yearly recurring event</span>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingEvent ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-8">
        {uniqueTypes.map((type, index) => {
          const typeEvents = events.filter(event => event.type === type);
          if (typeEvents.length === 0) return null;

          // Add top margin to the first group's border, padding to subsequent groups' borders
          const groupClasses = index === 0 
            ? "mt-8 border-t border-primary-light" // First group gets margin above border
            : "pt-8 border-t border-primary-light"; // Subsequent groups get padding above border

          return (
            <div key={type} className={groupClasses}>
              <h2 className="text-2xl font-display text-primary-dark mb-4 pt-8"> 
                {type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Uncategorized'} Events
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {typeEvents.map((event) => {
                  const reminder = reminders.find(r => r._id === event._id);
                  return (
                    <div key={event._id} className="card bg-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xl font-display text-primary-dark mb-1">{event.title}</p>
                          <p className="text-sm text-gray-500">
                            {`${formatUTCDateAsLocal(event.date, 'MMMM d, yyyy')} ${event.isRecurring ? '(Recurring)' : '(Not Recurring)'}`}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button onClick={() => handleEdit(event)} className="text-primary-dark hover:text-primary">
                            ✎
                          </button>
                          <button onClick={() => handleDelete(event._id)} className="text-red-500 hover:text-red-700">
                            ×
                          </button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="space-y-1 text-sm">
                          {reminder && event.isRecurring && (
                            <p className="text-primary-dark font-semibold">
                               {(() => {
                                 const daysRemaining = differenceInCalendarDays(parseISO(reminder.eventDate), new Date());
                                 const daysText = daysRemaining === 0 ? 'Today' : `${daysRemaining} days`;
                                 return `Next: ${formatUTCDateAsLocal(reminder.eventDate, 'MMMM d, yyyy')} (${daysText})`;
                               })()}
                            </p>
                          )}
                          {event.isRecurring ? (
                            reminder && <EventProgress dateString={reminder.eventDate} isRecurring={true} />
                          ) : (
                            isBefore(parseISO(event.date), new Date()) && !isSameDay(parseISO(event.date), new Date()) ? (
                              <div className="mt-3"> 
                                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
                                  <div className="bg-gradient-to-r from-primary-light to-primary h-2.5 rounded-full" style={{ width: `100%` }} ></div>
                                </div>
                                 <p className="text-xs text-right text-gray-500 mt-1">Event passed</p> 
                              </div>
                            ) : (
                              // Dynamic bar for future/today events
                              <>
                                <p className="text-primary-dark font-semibold">
                                  {(() => {
                                     const daysRemaining = differenceInCalendarDays(parseISO(event.date), new Date());
                                     const daysText = daysRemaining === 0 ? 'Today' : `${daysRemaining} days`;
                                     return `Next: ${formatUTCDateAsLocal(event.date, 'MMMM d, yyyy')} (${daysText})`;
                                  })()}
                                </p>
                                <EventProgress dateString={event.date} isRecurring={false} />
                              </>
                            )
                          )}
                        </div>
                        {/* Notes section */}
                        <div className="flex items-baseline mt-2">
                          <p className="font-semibold mr-1 flex-shrink-0">Notes:</p>
                          <p className="break-words whitespace-pre-wrap min-w-0">{event.notes ? event.notes : 'N/A'}</p>
                        </div>
                        {/* Reminder text moved here */}
                        <p className="text-sm text-gray-500 mt-2">
                          Reminder: {event.reminderDays} days before
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Events; 