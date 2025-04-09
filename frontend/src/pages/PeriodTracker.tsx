import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // Remove direct axios import
import api from '../services/api'; // Import configured api instance
import { format, addDays, differenceInDays, parseISO } from 'date-fns';

// Helper function to handle date timezone issues
const formatDateForDisplay = (dateString: string) => {
  const date = new Date(dateString);
  return format(date, 'yyyy-MM-dd');
};

const formatDateForAPI = (dateString: string) => {
  // Create date at noon to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0);
  return date.toISOString();
};

interface CycleEntry {
  _id: string;
  startDate: string;
  endDate: string;
  symptoms: string[];
  moods: string[];
  notes: string;
  cycleNumber: number;
}

interface CycleStats {
  averageCycleLength: number;
  averagePeriodLength: number;
  nextPredictedDate: string;
  commonSymptoms: string[];
  commonMoods: string[];
  totalCycles: number;
}

const PeriodTracker = () => {
  const [cycles, setCycles] = useState<CycleEntry[]>([]);
  const [stats, setStats] = useState<CycleStats | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingCycle, setEditingCycle] = useState<CycleEntry | null>(null);
  const [error, setError] = useState('');
  const [newSymptom, setNewSymptom] = useState('');
  const [newMood, setNewMood] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [newEntry, setNewEntry] = useState<Omit<CycleEntry, '_id'>>({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
    symptoms: [],
    moods: [],
    notes: '',
    cycleNumber: 0,
  });

  useEffect(() => {
    fetchCycles();
  }, []);

  const fetchCycles = async () => {
    setIsLoading(true);
    try {
      // Use 'api' and relative path
      const response = await api.get('/cycles'); 
      const sortedCycles = response.data.cycles.sort((a: CycleEntry, b: CycleEntry) => 
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
      const numberedCycles = sortedCycles.map((cycle: CycleEntry, index: number) => ({
        ...cycle,
        cycleNumber: sortedCycles.length - index
      }));
      setCycles(numberedCycles);
      setStats(response.data.stats);
    } catch (err) {
      setError('Error fetching cycle data');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setNewEntry({
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
      symptoms: [],
      moods: [],
      notes: '',
      cycleNumber: 0,
    });
    setEditingCycle(null);
    setIsAddingNew(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCycle) {
        await handleUpdate(e);
      } else {
        const cycleData = {
          ...newEntry,
          startDate: formatDateForAPI(newEntry.startDate),
          endDate: formatDateForAPI(newEntry.endDate),
        };
        // Use 'api' and relative path
        await api.post('/cycles', cycleData);
        resetForm();
        fetchCycles();
      }
    } catch (err) {
      setError('Error adding cycle entry');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Use 'api' and relative path
      await api.delete(`/cycles/${id}`);
      fetchCycles();
    } catch (err) {
      setError('Error deleting cycle entry');
    }
  };

  const handleEdit = (cycle: CycleEntry) => {
    setEditingCycle(cycle);
    setNewEntry({
      startDate: formatDateForDisplay(cycle.startDate),
      endDate: formatDateForDisplay(cycle.endDate),
      symptoms: [...cycle.symptoms],
      moods: [...cycle.moods],
      notes: cycle.notes,
      cycleNumber: cycle.cycleNumber,
    });
    setIsAddingNew(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCycle) return;

    try {
      const cycleData = {
        ...newEntry,
        startDate: formatDateForAPI(newEntry.startDate),
        endDate: formatDateForAPI(newEntry.endDate),
      };
      // Use 'api' and relative path
      const response = await api.put(`/cycles/${editingCycle._id}`, cycleData);
      const { cycle, stats: updatedStats } = response.data;
      setCycles(prevCycles => {
        const updatedCycles = prevCycles.map(c => c._id === cycle._id ? cycle : c);
        return updatedCycles.sort((a, b) => 
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        ).map((c, index) => ({
          ...c,
          cycleNumber: prevCycles.length - index
        }));
      });
      setStats(updatedStats);
      resetForm();
    } catch (err) {
      setError('Error updating cycle entry');
    }
  };

  const handleAddSymptom = () => {
    if (newSymptom.trim() && !newEntry.symptoms.includes(newSymptom.trim())) {
      setNewEntry({
        ...newEntry,
        symptoms: [...newEntry.symptoms, newSymptom.trim()],
      });
      setNewSymptom('');
    }
  };

  const handleRemoveSymptom = (symptom: string) => {
    setNewEntry({
      ...newEntry,
      symptoms: newEntry.symptoms.filter((s) => s !== symptom),
    });
  };

  const handleAddMood = () => {
    if (newMood.trim() && !newEntry.moods.includes(newMood.trim())) {
      setNewEntry({
        ...newEntry,
        moods: [...newEntry.moods, newMood.trim()],
      });
      setNewMood('');
    }
  };

  const handleRemoveMood = (mood: string) => {
    setNewEntry({
      ...newEntry,
      moods: newEntry.moods.filter((m) => m !== mood),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-2xl font-display text-primary-dark mb-4">Loading...</div>
          <div className="text-gray-600">Please wait while we fetch your cycle data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 container mx-auto px-4 max-w-7xl pt-8 pb-16">
      <h1 className="text-4xl font-display text-primary-dark font-bold text-center">
        Period Tracker
      </h1>

      <div className="text-center">
        <button onClick={() => setIsAddingNew(true)} className="btn btn-primary px-8">
          Log New Cycle
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg text-center">
          {error}
        </div>
      )}

      {stats && (
        <div className="flex flex-wrap justify-center gap-6 mb-8">
          <div className="card bg-white w-auto px-6">
            <h3 className="text-xl font-semibold mb-2 text-primary-dark text-center">Next Predicted Period</h3>
            <p className="text-3xl text-primary text-center">
              {stats.totalCycles > 0 
                ? format(new Date(stats.nextPredictedDate), 'MMMM d, yyyy')
                : 'N/A'}
            </p>
            <p className="text-sm text-gray-500 mt-2 text-center">
              {stats.totalCycles > 0 
                ? 'Based on your cycle history' 
                : 'Log cycles for predictions'}
            </p>
          </div>
          <div className="card bg-white w-auto px-6">
            <h3 className="text-xl font-semibold mb-2 text-primary-dark text-center">Average Cycle Length</h3>
            <p className="text-3xl text-primary text-center">
              {stats.totalCycles > 0 ? `${stats.averageCycleLength} days` : 'N/A'}
            </p>
            <p className="text-sm text-gray-500 mt-2 text-center">
              {stats.totalCycles > 0 
                ? `Based on ${stats.totalCycles} cycles`
                : 'N/A'}
            </p>
          </div>
          <div className="card bg-white w-auto px-6">
            <h3 className="text-xl font-semibold mb-2 text-primary-dark text-center">Average Period Length</h3>
            <p className="text-3xl text-primary text-center">
              {stats.totalCycles > 0 ? `${stats.averagePeriodLength} days` : 'N/A'}
            </p>
          </div>
        </div>
      )}

      {stats && <div className="mt-8 border-t border-primary-light"></div>}

      {isAddingNew && (
        <div className="card max-w-2xl mx-auto">
          <h2 className="text-2xl font-display text-primary-dark mb-6">
            {editingCycle ? 'Edit Cycle' : 'Log New Cycle'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={newEntry.startDate}
                  onChange={(e) => setNewEntry({ ...newEntry, startDate: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={newEntry.endDate}
                  onChange={(e) => setNewEntry({ ...newEntry, endDate: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Symptoms</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newSymptom}
                  onChange={(e) => setNewSymptom(e.target.value)}
                  className="input flex-grow"
                  placeholder="Enter a symptom"
                />
                <button
                  type="button"
                  onClick={handleAddSymptom}
                  className="btn btn-secondary px-4"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {newEntry.symptoms.map((symptom) => (
                  <span
                    key={symptom}
                    className="px-3 py-1 bg-primary-light/20 rounded-full text-primary-dark flex items-center"
                  >
                    {symptom}
                    <button
                      type="button"
                      onClick={() => handleRemoveSymptom(symptom)}
                      className="ml-2 text-primary-dark hover:text-primary"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Moods</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newMood}
                  onChange={(e) => setNewMood(e.target.value)}
                  className="input flex-grow"
                  placeholder="Enter a mood"
                />
                <button
                  type="button"
                  onClick={handleAddMood}
                  className="btn btn-secondary px-4"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {newEntry.moods.map((mood) => (
                  <span
                    key={mood}
                    className="px-3 py-1 bg-primary-light/20 rounded-full text-primary-dark flex items-center"
                  >
                    {mood}
                    <button
                      type="button"
                      onClick={() => handleRemoveMood(mood)}
                      className="ml-2 text-primary-dark hover:text-primary"
                    >
                      ×
                    </button>
                  </span>
                ))}
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
                onClick={resetForm}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingCycle ? 'Update Cycle' : 'Save Cycle'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-2xl font-display text-primary-dark">Cycle History</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cycles.map((cycle) => (
            <div key={cycle._id} className="card">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-xl font-semibold text-primary-dark">
                    Cycle {cycle.cycleNumber}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {`${format(new Date(cycle.startDate), 'MMMM d, yyyy')} - ${format(new Date(cycle.endDate), 'MMMM d, yyyy')} (${differenceInDays(new Date(cycle.endDate), new Date(cycle.startDate)) + 1} days)`}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(cycle)}
                    className="text-primary-dark hover:text-primary"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => handleDelete(cycle._id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="mt-2 space-y-2">
                <div className="flex items-baseline">
                  <p className="font-semibold mr-2 flex-shrink-0">Symptoms:</p>
                  {cycle.symptoms.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {cycle.symptoms.map((symptom, index) => (
                        <span key={index} className="text-sm px-2 py-1 bg-primary-light/20 rounded-full text-primary-dark">
                          {symptom}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span>N/A</span>
                  )}
                </div>
                <div className="flex items-baseline">
                  <p className="font-semibold mr-2 flex-shrink-0">Moods:</p>
                  {cycle.moods.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {cycle.moods.map((mood, index) => (
                        <span key={index} className="text-sm px-2 py-1 bg-primary-light/20 rounded-full text-primary-dark">
                          {mood}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span>N/A</span>
                  )}
                </div>
                <div className="flex items-baseline">
                  <p className="font-semibold mr-2 flex-shrink-0">Notes:</p>
                  <p className="break-words whitespace-pre-wrap min-w-0">
                    {cycle.notes ? cycle.notes : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PeriodTracker; 