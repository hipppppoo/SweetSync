// backend/src/index.ts - TEMPORARY MINIMAL TEST
import express from 'express';

// Log right at the start
console.log('[MINIMAL TEST] Function starting up...');

const app = express();

// Log incoming requests
app.use((req, res, next) => {
  console.log(`[MINIMAL TEST] Received Request: ${req.method} ${req.originalUrl}`);
  next();
});

// Basic health check route
app.get('/api/health', (req, res) => {
  console.log('[MINIMAL TEST] Handling /api/health');
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Catch-all for other /api routes for testing
app.all('/api/*', (req, res) => {
  console.log(`[MINIMAL TEST] Handling other API route: ${req.method} ${req.originalUrl}`);
  // Respond with 404 for any other /api route, including /api/auth/login
  res.status(404).json({ error: 'API route not found in minimal test' });
});

// Export the minimal app for Vercel
console.log('[MINIMAL TEST] Exporting minimal app...');
export default app; 