import React, { useState } from 'react';
import { changePassword } from '../services/userService';

const AccountSettingsPage: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // State for password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const response = await changePassword({
        currentPassword,
        newPassword,
      });
      setSuccessMessage(response.message || 'Password changed successfully!');
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to change password. Please check current password.');
      console.error('Change password error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 container mx-auto px-4 max-w-xl pt-12 pb-16">
      <h1 className="text-3xl font-display text-primary-dark font-bold text-center">
        Account Settings
      </h1>

      <div className="card bg-white">
        <h2 className="text-xl font-semibold text-primary-dark mb-4">Change Password</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded" role="alert">
              {successMessage}
            </div>
          )}

          {/* Current Password Field */}
          <div className="relative">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="currentPassword">
              Current Password
            </label>
            <input
              className="input w-full pr-10" // Add padding for the button
              id="currentPassword"
              type={showCurrentPassword ? 'text' : 'password'} // Dynamic type
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-sm leading-5 text-gray-500 hover:text-gray-700"
              aria-label={showCurrentPassword ? "Hide password" : "Show password"}
            >
              {showCurrentPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {/* New Password Field */}
          <div className="relative">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newPassword">
              New Password (min. 6 characters)
            </label>
            <input
              className="input w-full pr-10"
              id="newPassword"
              type={showNewPassword ? 'text' : 'password'} // Dynamic type
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
             <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-sm leading-5 text-gray-500 hover:text-gray-700"
              aria-label={showNewPassword ? "Hide password" : "Show password"}
            >
              {showNewPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {/* Confirm New Password Field */}
          <div className="relative">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmNewPassword">
              Confirm New Password
            </label>
            <input
              className="input w-full pr-10"
              id="confirmNewPassword"
              type={showConfirmNewPassword ? 'text' : 'password'} // Dynamic type
              placeholder="Confirm new password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />
             <button
              type="button"
              onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
              className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-sm leading-5 text-gray-500 hover:text-gray-700"
              aria-label={showConfirmNewPassword ? "Hide password" : "Show password"}
            >
              {showConfirmNewPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <div className="flex items-center justify-end">
            <button
              className={`btn btn-primary ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Add other settings sections here later if needed */}

    </div>
  );
};

export default AccountSettingsPage; 