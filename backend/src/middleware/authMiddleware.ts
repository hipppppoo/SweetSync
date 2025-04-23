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

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;
  // Check JWT_SECRET *inside* protect when needed
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('[AUTH MIDDLEWARE ERROR] JWT_SECRET is not defined.');
    // Return 500 for server config error, as the middleware cannot function
    return res.status(500).json({ message: 'Server configuration error: JWT secret not set.' });
  }

  console.log('\n[Backend Middleware] Running protect middleware for:', req.originalUrl);

  // Check for token in Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    console.log('[Backend Middleware] Authorization header found:', req.headers.authorization.substring(0, 15) + '...');
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log('[Backend Middleware] Extracted token prefix:', token.substring(0, 10) + '...');

      // Verify token using the checked 'secret'
      console.log('[Backend Middleware] Verifying token...');
      const decoded = jwt.verify(token, secret) as { id: string }; 
      console.log('[Backend Middleware] Token verified. Decoded ID:', decoded.id);

      // Get user from the token ID
      console.log('[Backend Middleware] Fetching user by ID...');
      req.user = await User.findById(decoded.id).select('-password');
      console.log('[Backend Middleware] User fetched:', req.user ? req.user.email : 'null');

      if (!req.user) {
        console.log('[Backend Middleware] User not found in DB for decoded ID. Rejecting.');
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      console.log('[Backend Middleware] Authentication successful. Proceeding...');
      next(); 
    } catch (error) {
      console.error('[Backend Middleware] Token verification failed:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    // If no Authorization header or doesn't start with Bearer
    console.log('[Backend Middleware] No Authorization header found or does not start with Bearer. Rejecting.');
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  // This part is likely unreachable now due to the `else` block above, but kept for structure
  if (!token) {
    // Log added for clarity, although likely never hit
    console.log('[Backend Middleware] No token variable set after checking header. Rejecting.'); 
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
}; 