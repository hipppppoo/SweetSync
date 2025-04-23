import dotenv from 'dotenv';
// Load environment variables FIRST
dotenv.config();

// --- Vercel Startup Debug Logging ---
console.log(`[VERCEL STARTUP] NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`[VERCEL STARTUP] MONGODB_URI set: ${!!process.env.MONGODB_URI}`); // Log if URI is set, not the URI itself for security
console.log(`[VERCEL STARTUP] JWT_SECRET set: ${!!process.env.JWT_SECRET}`); // Log if JWT_SECRET is set
// --- End Vercel Startup Debug Logging ---

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
// import mongoose from 'mongoose'; // Temporarily commented out - not used in simplified version
// import routes from './routes'; // Temporarily commented out

const app = express();

// --- Add Request Logging Middleware ---
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Received Request: ${req.method} ${req.originalUrl}`);
  next(); // Pass control to the next middleware/route handler
});
// ----------------------------------

// Middleware
app.use(cors());
app.use(express.json());

// Routes
// app.use('/api', routes); // Temporarily commented out

// Add a simple test route
app.get('/api/test', (req: Request, res: Response) => {
  console.log('Reached /api/test route handler');
  res.status(200).send('Backend index test route reached successfully!');
});

// --- Add Central Error Handler ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("[GLOBAL ERROR HANDLER]", err.stack); // Log the full error stack
  res.status(500).json({ 
    message: 'An unexpected error occurred', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});
// -------------------------------

// --- DB Connection Temporarily Commented Out ---
// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gfwebsite');
//     console.log('[VERCEL DB] MongoDB Connected successfully.');
//   } catch (error: any) {
//     console.error('[VERCEL DB ERROR] MongoDB connection error:', error.message);
//   }
// };
// connectDB(); 
// -------------------------------------------

// Conditionally start the server only if not in production (e.g., Vercel)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Backend server running locally on port ${PORT}`);
  });
}

// Export the Express app for Vercel using CommonJS syntax
// export default app; // Using ES Module export
module.exports = app; // Using CommonJS export 