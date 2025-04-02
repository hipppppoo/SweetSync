import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, parseISO, addDays } from 'date-fns';

interface SharedGoal {
  _id: string;
  title: string;
  description?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'on_hold';
  startDate: string;
  targetDate: string;
  progress: number;
  milestones: {
    title: string;
    completed: boolean;
    targetDate: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface SharedGoalStats {
  totalGoals: number;
  plannedGoals: number;
  completedGoals: number;
  inProgressGoals: number;
  onHoldGoals: number;
  averageProgress: number;
  categoryDistribution: string[];
  upcomingDeadlines: {
    title: string;
    targetDate: string;
    progress: number;
  }[];
}

const SharedGoals: React.FC = () => {
  const [goals, setGoals] = useState<SharedGoal[]>([]);
  const [stats, setStats] = useState<SharedGoalStats | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [error, setError] = useState<string>('');
  const [editingGoal, setEditingGoal] = useState<SharedGoal | null>(null);
  const [newGoal, setNewGoal] = useState<Partial<SharedGoal>>({
    title: '',
    description: '',
    status: 'planned',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    targetDate: format(new Date(), 'yyyy-MM-dd'),
    progress: 0,
    milestones: [],
  });
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    targetDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [showForm, setShowForm] = useState(false);

  const statuses = ['in_progress', 'planned', 'on_hold', 'completed'];

  useEffect(() => {
    fetchGoals();
    fetchStats();
  }, [selectedStatus]);

  const fetchGoals = async () => {
    try {
      let url = 'http://localhost:3000/api/shared-goals';
      if (selectedStatus !== 'all') {
        url = `http://localhost:3000/api/shared-goals/status/${selectedStatus}`;
      }
      const response = await axios.get(url);
      setGoals(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching shared goals:', err);
      setError('Error fetching shared goals. Please try again.');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/shared-goals/stats');
      setStats(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError('Error fetching statistics. Please try again.');
    }
  };

  const handleEdit = (goal: SharedGoal) => {
    setEditingGoal(goal);
    const startDate = new Date(goal.startDate);
    const targetDate = new Date(goal.targetDate);
    startDate.setMinutes(startDate.getMinutes() + startDate.getTimezoneOffset());
    targetDate.setMinutes(targetDate.getMinutes() + targetDate.getTimezoneOffset());
    
    setNewGoal({
      title: goal.title,
      description: goal.description,
      status: goal.status,
      startDate: format(startDate, 'yyyy-MM-dd'),
      targetDate: format(targetDate, 'yyyy-MM-dd'),
      progress: goal.progress,
      milestones: [...goal.milestones],
    });
    setShowForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal) return;

    try {
      await axios.put(`http://localhost:3000/api/shared-goals/${editingGoal._id}`, newGoal);
      setEditingGoal(null);
      setNewGoal({
        title: '',
        description: '',
        status: 'planned',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        targetDate: format(new Date(), 'yyyy-MM-dd'),
        progress: 0,
        milestones: [],
      });
      setShowForm(false);
      setError('');
      await fetchGoals();
      await fetchStats();
    } catch (err) {
      console.error('Error updating shared goal:', err);
      setError('Error updating shared goal. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGoal) {
        await handleUpdate(e);
      } else {
        await axios.post('http://localhost:3000/api/shared-goals', newGoal);
        setNewGoal({
          title: '',
          description: '',
          status: 'planned',
          startDate: format(new Date(), 'yyyy-MM-dd'),
          targetDate: format(new Date(), 'yyyy-MM-dd'),
          progress: 0,
          milestones: [],
        });
        setShowForm(false);
        setError('');
        await fetchGoals();
        await fetchStats();
      }
    } catch (err) {
      console.error('Error creating shared goal:', err);
      setError('Error creating shared goal. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:3000/api/shared-goals/${id}`);
      setError('');
      await fetchGoals();
      await fetchStats();
    } catch (err) {
      console.error('Error deleting shared goal:', err);
      setError('Error deleting shared goal. Please try again.');
    }
  };

  const handleUpdateProgress = async (id: string, progress: number) => {
    try {
      const goal = goals.find(g => g._id === id);
      if (!goal) return;

      let newStatus = goal.status;
      if (progress === 100) {
        newStatus = 'completed';
      } else if (progress > 0 && goal.status === 'planned') {
        newStatus = 'in_progress';
      } else if (progress < 100 && goal.status === 'completed') {
        newStatus = 'in_progress';
      }

      await axios.put(`http://localhost:3000/api/shared-goals/${id}`, {
        progress,
        status: newStatus
      });

      setGoals(goals.map(goal =>
        goal._id === id
          ? { ...goal, progress, status: newStatus }
          : goal
      ));
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleAddMilestone = () => {
    if (newMilestone.title && newMilestone.targetDate) {
      setNewGoal({
        ...newGoal,
        milestones: [
          ...(newGoal.milestones || []),
          { ...newMilestone, completed: false },
        ],
      });
      setNewMilestone({ title: '', targetDate: format(new Date(), 'yyyy-MM-dd') });
    }
  };

  const handleRemoveMilestone = (index: number) => {
    const updatedMilestones = [...(newGoal.milestones || [])];
    updatedMilestones.splice(index, 1);
    setNewGoal({ ...newGoal, milestones: updatedMilestones });
  };

  return (
    <div className="min-h-screen">
      <div className="space-y-8 container mx-auto px-4 max-w-7xl pt-8 pb-16">
        <h1 className="text-4xl font-display text-primary-dark font-bold text-center">
          Shared Goals
        </h1>

        <div className="text-center">
          <button onClick={() => setShowForm(true)} className="btn btn-primary px-8">
            Add New Goal
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg">{error}</div>
        )}

        {stats && (
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <div className="card bg-white w-auto px-6">
              <h3 className="text-xl font-semibold mb-2 text-primary-dark text-center">Total Goals</h3>
              <p className="text-3xl text-primary text-center">{stats.totalGoals}</p>
            </div>
            <div className="card bg-white w-auto px-6">
              <h3 className="text-xl font-semibold mb-2 text-primary-dark text-center">In Progress</h3>
              <p className="text-3xl text-primary text-center">{stats.inProgressGoals}</p>
            </div>
            <div className="card bg-white w-auto px-6">
              <h3 className="text-xl font-semibold mb-2 text-primary-dark text-center">Planned</h3>
              <p className="text-3xl text-primary text-center">{stats.plannedGoals}</p>
            </div>
            <div className="card bg-white w-auto px-6">
              <h3 className="text-xl font-semibold mb-2 text-primary-dark text-center">On Hold</h3>
              <p className="text-3xl text-primary text-center">{stats.onHoldGoals}</p>
            </div>
            <div className="card bg-white w-auto px-6">
              <h3 className="text-xl font-semibold mb-2 text-primary-dark text-center">Completed</h3>
              <p className="text-3xl text-primary text-center">{stats.completedGoals}</p>
            </div>
          </div>
        )}

        {showForm && (
          <div className="card max-w-2xl mx-auto">
            <h2 className="text-2xl font-display text-primary-dark mb-6">
              {editingGoal ? 'Edit Goal' : 'Add New Goal'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="input w-full"
                  placeholder="Add a title"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={newGoal.startDate}
                    onChange={(e) => setNewGoal({ ...newGoal, startDate: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Target Date</label>
                  <input
                    type="date"
                    value={newGoal.targetDate}
                    onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">Status</label>
                  <select
                    value={newGoal.status}
                    onChange={(e) => {
                      const status = e.target.value as SharedGoal['status'];
                      setNewGoal({ 
                        ...newGoal, 
                        status,
                        progress: status === 'planned' ? 0 : status === 'completed' ? 100 : newGoal.progress
                      });
                    }}
                    className="input w-full"
                    required
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Progress (%)</label>
                  <input
                    type="number"
                    value={newGoal.progress}
                    onChange={(e) => setNewGoal({ ...newGoal, progress: Number(e.target.value) })}
                    className={`input w-full ${(newGoal.status === 'planned' || newGoal.status === 'completed') ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                    min="0"
                    max="100"
                    required
                    disabled={newGoal.status === 'planned' || newGoal.status === 'completed'}
                  />
                  {newGoal.status === 'planned' && (
                    <p className="text-sm text-gray-500 mt-1">Progress must be 0% for planned goals</p>
                  )}
                  {newGoal.status === 'completed' && (
                    <p className="text-sm text-gray-500 mt-1">Progress must be 100% for completed goals</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Notes</label>
                <textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  className="input w-full h-24"
                  placeholder="Add any additional notes..."
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingGoal(null);
                    setNewGoal({
                      title: '',
                      description: '',
                      status: 'planned',
                      startDate: format(new Date(), 'yyyy-MM-dd'),
                      targetDate: format(new Date(), 'yyyy-MM-dd'),
                      progress: 0,
                      milestones: [],
                    });
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingGoal ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-8">
          {statuses.map((status) => {
            const statusGoals = goals.filter(goal => goal.status === status);
            if (statusGoals.length === 0) return null;

            return (
              <div key={status} className="pt-8 border-t border-primary-light">
                <h2 className="text-2xl font-display text-primary-dark mb-4">
                  {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Goals
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {statusGoals.map((goal) => (
                    <div key={goal._id} className="card bg-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-display text-primary-dark mb-1">{goal.title}</h3>
                          <p className="text-sm text-gray-500 -mt-1">
                            {`${format(addDays(parseISO(goal.startDate), 1), 'MMMM d, yyyy')} - ${format(addDays(parseISO(goal.targetDate), 1), 'MMMM d, yyyy')}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(goal)}
                            className="text-primary-dark hover:text-primary"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => handleDelete(goal._id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      <div>
                        <div className="mt-2">
                          <div className="flex justify-between mb-1">
                            <span className="text-primary-dark font-semibold">Progress</span>
                            <span className="text-primary-dark">{goal.progress}%</span>
                          </div>
                          <div className="relative">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-primary h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${goal.progress}%` }}
                              ></div>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={goal.progress}
                              onChange={(e) => handleUpdateProgress(goal._id, Number(e.target.value))}
                              className="absolute top-0 w-full h-2.5 bg-transparent cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-pink-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-pink-600 [&::-webkit-slider-thumb]:shadow-none [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:-mt-[5.75px] [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-pink-500 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-pink-600 [&::-moz-range-thumb]:shadow-none [&::-moz-range-thumb]:cursor-pointer"
                            />
                          </div>
                        </div>
                        <div className="flex items-baseline mt-4">
                          <p className="font-semibold mr-1 flex-shrink-0">Notes:</p>
                          <p className="break-words whitespace-pre-wrap min-w-0">{goal.description ? goal.description : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SharedGoals; 