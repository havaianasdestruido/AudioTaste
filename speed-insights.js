// Vercel Speed Insights integration
// This script injects the Speed Insights tracking code
import { injectSpeedInsights } from './speed-insights.mjs';

// Initialize Speed Insights
// The script will automatically track web vitals and performance metrics
injectSpeedInsights({
  // Enable debug logging in development (will not track data in dev mode anyway)
  debug: true,
  // Sample rate set to 1 (100% of events sent in production)
  sampleRate: 1
});
