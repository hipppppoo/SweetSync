import dotenv from 'dotenv';
// Load environment variables FIRST
dotenv.config();

// --- Vercel Startup Debug Logging ---
console.log(`[VERCEL STARTUP] NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`[VERCEL STARTUP] MONGODB_URI set: ${!!process.env.MONGODB_URI}`); // Log if URI is set, not the URI itself for security
console.log(`[VERCEL STARTUP] JWT_SECRET set: ${!!process.env.JWT_SECRET}`); // Log if JWT_SECRET is set
// --- End Vercel Startup Debug Logging ---

import express, { Request, Response, NextFunction } from 'express';
// import cors from 'cors'; // Temporarily commented out
// import mongoose from 'mongoose'; // Temporarily commented out
// import routes from './routes'; // Temporarily commented out

const app = express();

// --- Add Request Logging Middleware --- // Keep this basic middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Received Request: ${req.method} ${req.originalUrl}`);
  next();
});
// ----------------------------------

// Middleware
// app.use(cors()); // Temporarily commented out
// app.use(express.json()); // Keep json parser if needed for health check? (No)

// Routes
// app.use('/api', routes); // Temporarily commented out

// Add a simple health check route
app.get('/api/health', (req, res) => {
  console.log('[VERCEL TEST] Handling /api/health');
  res.status(200).json({ status: 'minimal ok', timestamp: new Date().toISOString() });
});

// Optional: Catch-all for other /api routes during this test
app.all('/api/*', (req, res) => {
  console.log(`[VERCEL TEST] Handling other API route: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'API route not found in minimal db/route test' });
});


// --- Add Central Error Handler --- // Keep basic error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("[GLOBAL ERROR HANDLER]", err.stack);
  res.status(500).json({ 
    message: 'An unexpected minimal error occurred', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});
// -------------------------------

// MongoDB connection - ENTIRELY COMMENTED OUT FOR NOW
// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gfwebsite');
//     console.log('[VERCEL DB] MongoDB Connected successfully.');
//   } catch (error: any) {
//     console.error('[VERCEL DB ERROR] MongoDB connection error:', error.message);
//   }
// };
// connectDB();

// Conditionally start the server - COMMENTED OUT (not needed for Vercel export)
// if (process.env.NODE_ENV !== 'production') {
//   const PORT = process.env.PORT || 3000;
//   app.listen(PORT, () => {
//     console.log(`Backend server running locally on port ${PORT}`);
//   });
// }

// Export the Express app for Vercel (needs to be top-level)
console.log("[VERCEL TEST] Exporting app after commenting out DB/Routes...");
export default app; 