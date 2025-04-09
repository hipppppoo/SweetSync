import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { format, parseISO, addDays } from 'date-fns';
import RatingInput from '../components/RatingInput';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface MoodEntry {
  _id: string;
  date: string;
  energy: number;
  notes: string;
  sleepHours: number;
  sleepQuality: number;
  stressLevel: number;
  physicalHealth: number;
  happinessLevel: number;
}

interface MoodStats {
  totalEntries: number;
  averageEnergy: number;
  averageStress: number;
  averageHealth: number;
  averageSleep: number;
  averageSleepQuality: number;
  averageHappiness: number;
}

const MoodTracker = () => {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [stats, setStats] = useState<MoodStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<MoodEntry | null>(null);
  const [newEntry, setNewEntry] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    energy: 5,
    notes: '',
    sleepHours: 8,
    sleepQuality: 5,
    stressLevel: 5,
    physicalHealth: 5,
    happinessLevel: 5,
  });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [error, setError] = useState('');
  const [hoveredLineKey, setHoveredLineKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchMoodEntries(), fetchStats()]);
      } catch (err) {
        console.error('Error loading mood data:', err);
        setError('Error loading mood data. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchMoodEntries = async () => {
    try {
      const response = await api.get('/moods');
      setMoodEntries(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching mood entries:', err);
      setError('Error fetching mood entries');
      throw err;
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/moods/stats');
      console.log('Received stats from backend:', response.data);
      setStats(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError('Error fetching statistics');
      throw err;
    }
  };

  const resetForm = (preserveValues = false) => {
    setNewEntry(prev => ({
      date: preserveValues ? prev.date : format(new Date(), 'yyyy-MM-dd'),
      energy: 5,
      notes: '',
      sleepHours: 8,
      sleepQuality: 5,
      stressLevel: 5,
      physicalHealth: 5,
      happinessLevel: 5,
    }));
  };

  const handleEdit = (entry: MoodEntry) => {
    const formattedDate = format(addDays(parseISO(entry.date), 1), 'yyyy-MM-dd');
    
    setEditingEntry(entry);
    setNewEntry({
      date: formattedDate,
      energy: entry.energy,
      notes: entry.notes,
      sleepHours: entry.sleepHours,
      sleepQuality: entry.sleepQuality || 5,
      stressLevel: entry.stressLevel,
      physicalHealth: entry.physicalHealth,
      happinessLevel: entry.happinessLevel,
    });
    setIsAddingNew(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    try {
      const updateData = {
        date: format(parseISO(newEntry.date), 'yyyy-MM-dd'),
        energy: Number(newEntry.energy) || 5,
        notes: newEntry.notes,
        sleepHours: Number(newEntry.sleepHours) || 8,
        sleepQuality: Number(newEntry.sleepQuality) || 5,
        stressLevel: Number(newEntry.stressLevel) || 5,
        physicalHealth: Number(newEntry.physicalHealth) || 5,
        happinessLevel: Number(newEntry.happinessLevel) || 5,
      };

      await api.put(`/moods/${editingEntry._id}`, updateData);
      setEditingEntry(null);
      setIsAddingNew(false);
      resetForm(true);
      fetchMoodEntries();
      fetchStats();
    } catch (err) {
      setError('Error updating mood entry');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEntry) {
        await handleUpdate(e);
      } else {
        const submissionData = {
          date: new Date(newEntry.date).toISOString(),
          energy: Number(newEntry.energy) || 5,
          notes: newEntry.notes,
          sleepHours: Number(newEntry.sleepHours) || 8,
          sleepQuality: Number(newEntry.sleepQuality) || 5,
          stressLevel: Number(newEntry.stressLevel) || 5,
          physicalHealth: Number(newEntry.physicalHealth) || 5,
          happinessLevel: Number(newEntry.happinessLevel) || 5,
        };
        
        console.log('=== Debug Information ===');
        console.log('1. Raw form data:', JSON.stringify(newEntry, null, 2));
        console.log('2. Processed submission data:', JSON.stringify(submissionData, null, 2));
        
        try {
          const response = await api.post('/moods', submissionData);
          console.log('3. Success Response:', {
            status: response.status,
            data: response.data
          });
          setIsAddingNew(false);
          resetForm(true);
          fetchMoodEntries();
          fetchStats();
        } catch (axiosError: any) {
          console.log('3. Error Response:', {
            error: axiosError,
            response: JSON.stringify(axiosError.response?.data, null, 2),
            status: axiosError.response?.status,
            headers: axiosError.response?.headers,
            requestData: JSON.stringify(axiosError.config?.data, null, 2)
          });
          throw axiosError;
        }
      }
    } catch (err: any) {
      console.error('=== Error Details ===');
      if (err.isAxiosError) {
        console.error('1. Error type: Axios Error');
        console.error('2. Status:', err.response?.status);
        console.error('3. Response data:', JSON.stringify(err.response?.data, null, 2));
        console.error('4. Request config:', {
          url: err.config?.url,
          method: err.config?.method,
          data: JSON.stringify(err.config?.data, null, 2)
        });
        const errorMessage = err.response?.data?.message || err.message;
        setError(`Error creating mood entry: ${errorMessage}`);
      } else {
        console.error('1. Error type: Non-Axios Error');
        console.error('2. Error object:', err);
        setError('Error creating mood entry: Unknown error occurred');
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/moods/${id}`);
      fetchMoodEntries();
      fetchStats();
    } catch (err) {
      setError('Error deleting mood entry');
    }
  };

  // Prepare data for the chart using useMemo
  const { chartData, yAxisMax, yAxisTicks } = useMemo(() => {
    const processedData = [...moodEntries]
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
      .map(entry => ({
        date: format(parseISO(entry.date), 'MM/dd'),
        Happiness: entry.happinessLevel ?? 5,
        Energy: entry.energy ?? 5,
        Stress: entry.stressLevel ?? 5,
        Health: entry.physicalHealth ?? 5,
        SleepQuality: entry.sleepQuality ?? 5,
        SleepHours: entry.sleepHours ?? 8, // Include SleepHours
      }));

    // Calculate max Y value needed, ensuring it's at least 10
    let calculatedMax = 10;
    if (processedData.length > 0) {
      calculatedMax = processedData.reduce((max, entry) => {
        return Math.max(
          max,
          entry.Happiness,
          entry.Energy,
          entry.Stress,
          entry.Health,
          entry.SleepQuality,
          entry.SleepHours
        );
      }, 10); // Start with 10 as minimum max
    }

    // Calculate preliminary limit with +2 buffer
    const prelimLimit = Math.ceil(calculatedMax) + 2;
    // Ensure the final limit is an even number
    const yAxisLimit = prelimLimit % 2 !== 0 ? prelimLimit + 1 : prelimLimit;

    // Generate ticks from 0 to the final even limit, FILTERING FOR EVEN NUMBERS
    const ticks = Array.from({ length: yAxisLimit + 1 }, (_, i) => i)
                       .filter(tick => tick % 2 === 0);

    return { chartData: processedData, yAxisMax: yAxisLimit, yAxisTicks: ticks };
  }, [moodEntries]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-2xl font-display text-primary-dark mb-4">Loading...</div>
          <div className="text-gray-600">Please wait while we fetch your mood data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 container mx-auto px-4 max-w-7xl pt-8 pb-16">
      <h1 className="text-4xl font-display text-primary-dark font-bold text-center">
        Wellness Tracker
      </h1>

      <div className="text-center">
        <button onClick={() => setIsAddingNew(true)} className="btn btn-primary px-8">
          Log New Entry
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg text-center">
          {error}
          <button 
            onClick={() => window.location.reload()} 
            className="ml-4 underline hover:no-underline"
          >
            Refresh Page
          </button>
        </div>
      )}

      {stats && (
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <div className="card bg-white w-auto px-6 text-center">
            <h3 className="text-xl font-display mb-2 text-primary-dark">Total Entries</h3>
            <p className="text-3xl text-primary">{stats.totalEntries || 0}</p>
          </div>
          <div className="card bg-white w-auto px-6 text-center">
            <h3 className="text-xl font-display mb-2 text-primary-dark">Avg Happiness</h3>
            <p className="text-3xl text-primary">{(stats.averageHappiness || 5).toFixed(1)}/10</p>
          </div>
          <div className="card bg-white w-auto px-6 text-center">
            <h3 className="text-xl font-display mb-2 text-primary-dark">Avg Energy</h3>
            <p className="text-3xl text-primary">{(stats.averageEnergy || 5).toFixed(1)}/10</p>
          </div>
          <div className="card bg-white w-auto px-6 text-center">
            <h3 className="text-xl font-display mb-2 text-primary-dark">Avg Stress</h3>
            <p className="text-3xl text-primary">{(stats.averageStress || 5).toFixed(1)}/10</p>
          </div>
          <div className="card bg-white w-auto px-6 text-center">
            <h3 className="text-xl font-display mb-2 text-primary-dark">Avg Health</h3>
            <p className="text-3xl text-primary">{(stats.averageHealth || 5).toFixed(1)}/10</p>
          </div>
          <div className="card bg-white w-auto px-6 text-center">
            <h3 className="text-xl font-display mb-2 text-primary-dark">Avg Sleep</h3>
            <p className="text-3xl text-primary">{(stats.averageSleep || 8).toFixed(1)}h</p>
          </div>
          <div className="card bg-white w-auto px-6 text-center">
            <h3 className="text-xl font-display mb-2 text-primary-dark">Avg Sleep Quality</h3>
            <p className="text-3xl text-primary">{(stats.averageSleepQuality || 5).toFixed(1)}/10</p>
          </div>
        </div>
      )}
      {stats && <div className="mt-8 border-t border-primary-light"></div>}

      {/* Add the Longitudinal Graph */} 
      {chartData.length > 1 && ( // Only show chart if there's enough data
        <div className="card max-w-4xl mx-auto mt-8">
          <h2 className="text-2xl font-display text-primary-dark mb-6 text-center">Trends Over Time</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 0,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="date" stroke="#4a4a4a" />
              <YAxis 
                domain={[0, yAxisMax]} 
                ticks={yAxisTicks}
                allowDataOverflow={true}
                stroke="#4a4a4a" 
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #cccccc' }} 
                labelStyle={{ color: '#333333' }} 
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }} 
                onMouseEnter={(e: any) => setHoveredLineKey(e.dataKey)}
                onMouseLeave={() => setHoveredLineKey(null)}
              />
              <Line 
                type="monotone" 
                dataKey="Happiness" 
                stroke="#2ecc71" 
                strokeWidth={2} 
                activeDot={{ r: 6 }} 
                name="Happiness"
                strokeOpacity={hoveredLineKey === null || hoveredLineKey === 'Happiness' ? 1 : 0}
              />
              <Line 
                type="monotone" 
                dataKey="Energy" 
                stroke="#f1c40f" 
                strokeWidth={2} 
                activeDot={{ r: 6 }} 
                name="Energy"
                strokeOpacity={hoveredLineKey === null || hoveredLineKey === 'Energy' ? 1 : 0}
              />
              <Line 
                type="monotone" 
                dataKey="Stress" 
                stroke="#e74c3c" 
                strokeWidth={2} 
                activeDot={{ r: 6 }} 
                name="Stress"
                strokeOpacity={hoveredLineKey === null || hoveredLineKey === 'Stress' ? 1 : 0}
              />
              <Line 
                type="monotone" 
                dataKey="Health" 
                stroke="#3498db" 
                strokeWidth={2} 
                activeDot={{ r: 6 }} 
                name="Health"
                strokeOpacity={hoveredLineKey === null || hoveredLineKey === 'Health' ? 1 : 0}
              />
              <Line 
                type="monotone" 
                dataKey="SleepQuality" 
                stroke="#9b59b6" 
                strokeWidth={2} 
                activeDot={{ r: 6 }} 
                name="Sleep Quality"
                strokeOpacity={hoveredLineKey === null || hoveredLineKey === 'SleepQuality' ? 1 : 0}
              />
              <Line 
                type="monotone" 
                dataKey="SleepHours"
                stroke="#ff7300"
                strokeWidth={2} 
                activeDot={{ r: 6 }} 
                name="Sleep Hours"
                strokeOpacity={hoveredLineKey === null || hoveredLineKey === 'SleepHours' ? 1 : 0}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {isAddingNew && (
        <div className="card max-w-2xl mx-auto">
          <h2 className="text-2xl font-display text-primary-dark mb-6">
            {editingEntry ? 'Edit Entry' : 'Log New Entry'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <RatingInput
                label="Happiness Level"
                value={newEntry.happinessLevel || 5}
                onChange={(value) => setNewEntry({ ...newEntry, happinessLevel: value })}
              />
              <RatingInput
                label="Energy Level"
                value={newEntry.energy || 5}
                onChange={(value) => setNewEntry({ ...newEntry, energy: value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <RatingInput
                label="Stress Level"
                value={newEntry.stressLevel || 5}
                onChange={(value) => setNewEntry({ ...newEntry, stressLevel: value })}
              />
              <RatingInput
                label="Physical Health"
                value={newEntry.physicalHealth || 5}
                onChange={(value) => setNewEntry({ ...newEntry, physicalHealth: value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <RatingInput
                label="Sleep Quality"
                value={newEntry.sleepQuality || 5}
                onChange={(value) => setNewEntry({ ...newEntry, sleepQuality: value })}
              />
              <div>
                <label className="block text-gray-700 mb-2">Sleep Hours</label>
                <input
                  type="number"
                  value={newEntry.sleepHours}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, sleepHours: Number(e.target.value) })
                  }
                  className="input w-full"
                  min="0"
                  max="24"
                  step="0.5"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Notes</label>
              <textarea
                value={newEntry.notes}
                onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                className="input w-full h-24"
                placeholder="Add any additional notes..."
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(false);
                  setEditingEntry(null);
                  resetForm(true);
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingEntry ? 'Update Entry' : 'Save Entry'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {moodEntries.map((entry, index) => (
          <div key={entry._id} className="card bg-white">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-xl font-display text-primary-dark mb-1">Entry {moodEntries.length - index}</p>
                <p className="text-sm text-gray-500">
                  {format(addDays(parseISO(entry.date), 1), 'MMMM d, yyyy')}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(entry)}
                  className="text-primary-dark hover:text-primary"
                >
                  ✎
                </button>
                <button
                  onClick={() => handleDelete(entry._id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <p className="text-primary-dark font-semibold">Happiness: {entry.happinessLevel || 5}/10</p>
                <p className="text-primary-dark font-semibold">Energy: {entry.energy || 5}/10</p>
                <p className="text-primary-dark font-semibold">Stress: {entry.stressLevel || 5}/10</p>
                <p className="text-primary-dark font-semibold">Health: {entry.physicalHealth || 5}/10</p>
                <p className="text-primary-dark font-semibold">Sleep: {entry.sleepHours || 8}h</p>
                <p className="text-primary-dark font-semibold">Sleep Quality: {entry.sleepQuality || 5}/10</p>
              </div>
              <div className="flex items-baseline">
                <p className="font-semibold mr-1 flex-shrink-0">Notes:</p>
                <p className="break-words whitespace-pre-wrap min-w-0">{entry.notes ? entry.notes : 'N/A'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MoodTracker; 