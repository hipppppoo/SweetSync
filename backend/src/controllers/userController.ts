import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import bcrypt from 'bcryptjs';

// GET /api/users/profile
export const getUserProfile = async (req: Request, res: Response) => {
  // req.user is attached by the protect middleware
  const user = await User.findById(req.user?._id).select('-password');

  if (user) {
    res.json({
      _id: user._id,
      email: user.email,
      // Add other non-sensitive fields if needed
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// PUT /api/users/profile
export const updateUserProfile = async (req: Request, res: Response) => {
  const user = await User.findById(req.user?._id);

  if (user) {
    user.email = req.body.email || user.email;
    // Update other fields as needed
    // Example: user.name = req.body.name || user.name;

    // If password is being updated (handle separately or disallow here)
    // if (req.body.password) {
    //   user.password = req.body.password; // Ensure hashing happens via pre-save hook
    // }

    try {
      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        email: updatedUser.email,
        // Send back updated fields
      });
    } catch (error) {
      res.status(400).json({ message: 'Error updating profile', error });
    }

  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// PUT /api/users/change-password
export const changePassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  // Basic validation
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Please provide current and new passwords' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters long' });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({ message: 'New password cannot be the same as the current password' });
  }

  try {
    // Need to fetch user WITH password to compare
    const user = await User.findById(req.user?._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if current password matches
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect current password' });
    }

    // Hash new password (pre-save hook will handle this if saving the user object)
    user.password = newPassword; 
    await user.save(); // Let the pre-save hook hash the password

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server error changing password' });
  }
}; 