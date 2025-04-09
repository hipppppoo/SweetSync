import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User';

// Extend the Express Request interface to include the user property
// This allows us to attach the fetched user data to the request object
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in .env file for middleware.");
  process.exit(1);
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;
  console.log('\n[Backend Middleware] Running protect middleware for:', req.originalUrl);

  // Check for token in Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    console.log('[Backend Middleware] Authorization header found:', req.headers.authorization.substring(0, 15) + '...');
    try {
      // Get token from header (split 'Bearer TOKEN' and take the token part)
      token = req.headers.authorization.split(' ')[1];
      console.log('[Backend Middleware] Extracted token prefix:', token.substring(0, 10) + '...');

      // Verify token
      console.log('[Backend Middleware] Verifying token...');
      const decoded = jwt.verify(token, JWT_SECRET!) as { id: string }; // Type assertion for decoded payload
      console.log('[Backend Middleware] Token verified. Decoded ID:', decoded.id);

      // Get user from the token ID, excluding the password field
      console.log('[Backend Middleware] Fetching user by ID...');
      req.user = await User.findById(decoded.id).select('-password');
      console.log('[Backend Middleware] User fetched:', req.user ? req.user.email : 'null');

      if (!req.user) {
        console.log('[Backend Middleware] User not found in DB for decoded ID. Rejecting.');
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      console.log('[Backend Middleware] Authentication successful. Proceeding...');
      next(); // Proceed to the next middleware/route handler
    } catch (error) {
      console.error('[Backend Middleware] Token verification failed:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // If no token is found in the header
  if (!token) {
    console.log('[Backend Middleware] No Authorization header found or does not start with Bearer. Rejecting.');
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
}; 