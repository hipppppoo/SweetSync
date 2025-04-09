import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User'; // Import the User model and IUser interface

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in .env file.");
  process.exit(1); // Exit if JWT secret is missing
}

// Function to generate JWT
const generateToken = (userId: string) => {
  // Ensure userId is a string before signing
  if (typeof userId !== 'string') {
    throw new Error('User ID must be a string for JWT generation');
  }
  return jwt.sign({ id: userId }, JWT_SECRET!, {
    expiresIn: '30d', // Token expires in 30 days
  });
};

// Controller for user signup (registration)
export const signup = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Validate password (add more robust validation as needed)
    if (!password || password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Create a new user
    const user: IUser = new User({ email, password });
    await user.save();

    // Ensure user._id exists and convert to string
    const userIdString = user._id?.toString();
    if (!userIdString) {
        throw new Error('User ID not generated after save');
    }

    // Generate token and send response
    const token = generateToken(userIdString);

    // Respond without sending the password hash
    res.status(201).json({
        message: "User created successfully",
        token,
        user: {
            id: userIdString, // Use the confirmed string ID
            email: user.email
        }
    });

  } catch (error: any) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: 'Server error during signup', error: error.message });
  }
};

// Controller for user login
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' }); // Use generic message for security
    }

    // Compare submitted password with stored hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' }); // Use generic message
    }

    // Ensure user._id exists and convert to string
    const userIdString = user._id?.toString();
    if (!userIdString) {
        throw new Error('User ID not found for logged in user'); // Should not happen if user exists
    }

    // Generate token and send response
    const token = generateToken(userIdString);

    // Respond without sending the password hash
    res.status(200).json({
        message: "Login successful",
        token,
        user: {
            id: userIdString, // Use the confirmed string ID
            email: user.email
        }
    });

  } catch (error: any) {
    console.error("Login Error:", error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
}; 