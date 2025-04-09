import React, { useState, useEffect } from "react";
// import axios from "axios"; // Remove direct axios import
import api from "../services/api"; // Import configured api instance
import { format, parseISO, addDays, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, differenceInMonths, differenceInYears, addYears, addMonths, isBefore, differenceInMilliseconds, differenceInCalendarDays } from "date-fns";

interface Anniversary {
  _id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  reminderEnabled: boolean;
  reminderDays: number;
  monthlyReminder: boolean;
}

// --- Define Stats interface ---
interface AnniversaryStats {
  totalAnniversaries: number;
}
// --------------------------

const validTypes = ['relationship', 'birthday', 'wedding', 'first date', 'other'] as const;

const isValidAnniversaryType = (type: string): boolean => {
  return type.trim().length > 0;
};

const TimeSinceAnniversary = ({ date }: { date: string }) => {
  const [timeSince, setTimeSince] = useState({
    years: 0,
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const updateTime = () => {
      try {
        const anniversaryDate = parseISO(date);
        const now = new Date();

        if (isBefore(now, anniversaryDate)) {
          setTimeSince({ years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
          return;
        }

        const years = differenceInYears(now, anniversaryDate);
        const dateAfterYears = addYears(anniversaryDate, years);
        
        const months = differenceInMonths(now, dateAfterYears);
        const dateAfterMonths = addMonths(dateAfterYears, months);
        
        const days = differenceInDays(now, dateAfterMonths);
        
        const hours = differenceInHours(now, anniversaryDate) % 24;
        const minutes = differenceInMinutes(now, anniversaryDate) % 60;
        const seconds = differenceInSeconds(now, anniversaryDate) % 60;

        setTimeSince({ years, months, days, hours, minutes, seconds });

      } catch (error) {
        setTimeSince({ years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [date]);

  return (
    <div className="text-sm text-gray-500">
      Time since: {timeSince.years > 0 ? `${timeSince.years} years, ` : ''}
      {timeSince.months > 0 ? `${timeSince.months} months, ` : ''}
      {timeSince.days} days, {timeSince.hours} hours, {timeSince.minutes} minutes, {timeSince.seconds} seconds
    </div>
  );
};

// --- Updated Component for Progress Bar ---
const AnniversaryProgress = ({ dateString }: { dateString: string }) => {
  const [progress, setProgress] = useState(0);
  const [nextAnniversaryDate, setNextAnniversaryDate] = useState<Date | null>(null);

  useEffect(() => {
    const calculateProgress = () => {
      try {
        const anniversaryDate = parseISO(dateString);
        const now = new Date();

        // Calculate next anniversary date
        let nextAnniversary = new Date(anniversaryDate);
        nextAnniversary.setFullYear(now.getFullYear());
        if (isBefore(nextAnniversary, now)) {
          nextAnniversary = addYears(nextAnniversary, 1);
        }
        setNextAnniversaryDate(nextAnniversary);

        // Calculate last anniversary date
        let lastAnniversary = new Date(nextAnniversary);
        if (differenceInYears(nextAnniversary, now) >= 1 && differenceInMonths(nextAnniversary, now) >=0 && differenceInDays(nextAnniversary, now) > 0) {
             lastAnniversary = addYears(nextAnniversary, -1);
        } else {
             let anniversaryThisYear = new Date(anniversaryDate);
             anniversaryThisYear.setFullYear(now.getFullYear());
             if(isBefore(anniversaryThisYear, now)) {
                 lastAnniversary = anniversaryThisYear;
             } else {
                 lastAnniversary = addYears(anniversaryThisYear, -1);
             }
        }
       
        const totalDuration = differenceInMilliseconds(nextAnniversary, lastAnniversary);
        const elapsedDuration = differenceInMilliseconds(now, lastAnniversary);

        if (totalDuration > 0 && elapsedDuration >= 0) {
          const calculatedProgress = Math.min(100, (elapsedDuration / totalDuration) * 100);
          setProgress(calculatedProgress);
        } else {
          setProgress(0);
        }

      } catch (error) {
        setProgress(0);
        setNextAnniversaryDate(null);
      }
    };

    calculateProgress();
    const interval = setInterval(calculateProgress, 60 * 60 * 1000); 

    return () => clearInterval(interval);
  }, [dateString]);

  return (
    <div className="mb-4">
      {nextAnniversaryDate && (
         <p className="text-primary-dark font-semibold mb-1">
           {(() => {
             const daysRemaining = differenceInCalendarDays(nextAnniversaryDate, new Date());
             const daysText = daysRemaining === 0 ? 'Today' : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`;
             return `Next: ${format(nextAnniversaryDate, 'MMMM d, yyyy')} (${daysText})`;
           })()}
         </p>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-primary-light to-primary h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }} ></div>
      </div>
    </div>
  );
};
// --- End of Updated Component ---

const Anniversaries = () => {
  const [anniversaries, setAnniversaries] = useState<Anniversary[]>([]);
  const [editingAnniversary, setEditingAnniversary] = useState<Anniversary | null>(null);
  const [newAnniversary, setNewAnniversary] = useState<Omit<Anniversary, '_id'>>({
    title: '',
    date: '',
    time: '00:00',
    description: '',
    reminderEnabled: true,
    reminderDays: 7,
    monthlyReminder: false,
  });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [error, setError] = useState('');
  // --- Add state for stats ---
  const [stats, setStats] = useState<AnniversaryStats | null>(null);
  // --------------------------

  useEffect(() => {
    fetchAnniversaries();
    fetchStats();
  }, []);

  const fetchAnniversaries = async () => {
    try {
      // Use 'api' and relative path
      const response = await api.get('/anniversaries');
      setAnniversaries(response.data);
    } catch (err) {
      setError('Error fetching anniversaries');
    }
  };

  const fetchStats = async () => {
    try {
      // Use 'api' and relative path
      const response = await api.get('/anniversaries/stats');
      setStats(response.data);
    } catch (err) {
      // Error fetching stats, ignore for now or add user-facing error handling
    }
  };

  const handleEdit = (anniversary: Anniversary) => {
    setEditingAnniversary(anniversary);
    const date = new Date(anniversary.date);
    const formattedDate = format(date, 'yyyy-MM-dd');
    const formattedTime = format(date, 'HH:mm');
    setNewAnniversary({
      title: anniversary.title,
      date: formattedDate,
      time: formattedTime,
      description: anniversary.description,
      reminderEnabled: anniversary.reminderEnabled,
      reminderDays: anniversary.reminderDays,
      monthlyReminder: anniversary.monthlyReminder,
    });
    setIsAddingNew(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnniversary) return;

    try {
      const [year, month, day] = newAnniversary.date.split('-').map(Number);
      const [hours, minutes] = newAnniversary.time.split(':').map(Number);
      const date = new Date(year, month - 1, day, hours, minutes);
      
      // Use 'api' and relative path
      await api.put(`/anniversaries/${editingAnniversary._id}`, {
        ...newAnniversary,
        date: date.toISOString(),
      });
      
      setEditingAnniversary(null);
      setIsAddingNew(false);
      setNewAnniversary({
        title: '',
        date: '',
        time: '00:00',
        description: '',
        reminderEnabled: true,
        reminderDays: 7,
        monthlyReminder: false,
      });
      fetchAnniversaries();
    } catch (err) {
      setError('Error updating anniversary');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const [year, month, day] = newAnniversary.date.split('-').map(Number);
      const [hours, minutes] = newAnniversary.time.split(':').map(Number);
      const date = new Date(year, month - 1, day, hours, minutes);

      if (editingAnniversary) {
        await handleUpdate(e); // handleUpdate already uses 'api'
      } else {
        // Use 'api' and relative path
        await api.post('/anniversaries', {
          ...newAnniversary,
          date: date.toISOString(),
        });
      }
      
      setNewAnniversary({
        title: '',
        date: '',
        time: '00:00',
        description: '',
        reminderEnabled: true,
        reminderDays: 7,
        monthlyReminder: false,
      });
      setIsAddingNew(false);
      fetchAnniversaries();
    } catch (err) {
      setError('Error saving anniversary');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Use 'api' and relative path
      await api.delete(`/anniversaries/${id}`);
      fetchAnniversaries();
      fetchStats(); // Fetch stats again after delete
    } catch (err) {
      setError('Error deleting anniversary');
    }
  };

  return (
    <div className="space-y-8 container mx-auto px-4 max-w-7xl pt-8 pb-16">
      <h1 className="text-4xl font-display text-primary-dark font-bold text-center">
        Anniversaries
      </h1>

      <div className="text-center">
        <button
          onClick={() => setIsAddingNew(true)}
          className="btn btn-primary px-8"
        >
          Add Anniversary
        </button>
      </div>

      {/* --- Display Stats Card (Simplified Layout) --- */}
      {stats && (
        <div className="mb-8 flex justify-center"> 
          <div className="card bg-white w-auto px-6">
            <h3 className="text-xl font-semibold mb-2 text-primary-dark text-center">Total Anniversaries</h3>
            <p className="text-3xl text-primary text-center">{stats.totalAnniversaries}</p>
          </div>
        </div>
      )}
      {/* --- Add Separator Line Below Stats --- */}
      {stats && <div className="mt-8 border-t border-primary-light"></div>}
      {/* ------------------------------------------- */}

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg text-center">{error}</div>
      )}

      {isAddingNew && (
        <div className="card max-w-2xl mx-auto">
          <h2 className="text-2xl font-display text-primary-dark mb-4">
            {editingAnniversary ? 'Edit Anniversary' : 'Add New Anniversary'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={newAnniversary.title}
                onChange={(e) =>
                  setNewAnniversary({ ...newAnniversary, title: e.target.value })
                }
                className="input w-full"
                placeholder="Add a title"
                required
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={newAnniversary.date}
                  onChange={(e) =>
                    setNewAnniversary({ ...newAnniversary, date: e.target.value })
                  }
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  value={newAnniversary.time}
                  onChange={(e) =>
                    setNewAnniversary({ ...newAnniversary, time: e.target.value })
                  }
                  className="input w-full"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Notes</label>
              <textarea
                value={newAnniversary.description}
                onChange={(e) =>
                  setNewAnniversary({
                    ...newAnniversary,
                    description: e.target.value,
                  })
                }
                className="input w-full h-24"
                placeholder="Add any additional notes..."
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newAnniversary.reminderEnabled}
                  onChange={(e) =>
                    setNewAnniversary({
                      ...newAnniversary,
                      reminderEnabled: e.target.checked,
                    })
                  }
                  className="form-checkbox h-5 w-5 text-primary"
                />
                <label className="ml-2 text-gray-700">Enable Reminder</label>
              </div>
              {newAnniversary.reminderEnabled && (
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={newAnniversary.reminderDays}
                    onChange={(e) =>
                      setNewAnniversary({
                        ...newAnniversary,
                        reminderDays: parseInt(e.target.value),
                      })
                    }
                    className="input w-20"
                    min="1"
                    max="90"
                  />
                  <span className="text-gray-700">days before</span>
                </div>
              )}
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={newAnniversary.monthlyReminder}
                onChange={(e) =>
                  setNewAnniversary({
                    ...newAnniversary,
                    monthlyReminder: e.target.checked,
                  })
                }
                className="form-checkbox h-5 w-5 text-primary"
              />
              <label className="ml-2 text-gray-700">Enable Monthly Reminders</label>
            </div>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(false);
                  setEditingAnniversary(null);
                  setNewAnniversary({
                    title: '',
                    date: '',
                    time: '00:00',
                    description: '',
                    reminderEnabled: true,
                    reminderDays: 7,
                    monthlyReminder: false,
                  });
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingAnniversary ? 'Update Anniversary' : 'Save Anniversary'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {anniversaries.map((anniversary) => (
          <div key={anniversary._id} className="card bg-white">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0 pr-4">
                <h3 className="text-lg font-semibold text-primary-dark truncate">
                  {anniversary.title}
                </h3>
                <p className="text-sm text-gray-500">
                  {format(parseISO(anniversary.date), 'MMMM d, yyyy')} at {format(parseISO(anniversary.date), 'h:mm a')}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleEdit(anniversary)}
                  className="text-primary-dark hover:text-primary"
                >
                  ✎
                </button>
                <button
                  onClick={() => handleDelete(anniversary._id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="space-y-2 mt-2">
              <AnniversaryProgress dateString={anniversary.date} />
              <div className="mt-4">
                <div className="flex items-baseline">
                  <p className="font-semibold mr-1 flex-shrink-0">Notes:</p>
                  <p className="break-words whitespace-pre-wrap min-w-0">{anniversary.description ? anniversary.description : 'N/A'}</p>
                </div>
              </div>
              <div className="space-y-2 mt-2">
                <TimeSinceAnniversary date={anniversary.date} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Anniversaries; 