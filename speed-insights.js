// Vercel Speed Insights integration
// This script injects the Speed Insights tracking code
import { injectSpeedInsights } from './speed-insights.mjs';

// Initialize Speed Insights
// The script will automatically track web vitals and performance metrics
injectSpeedInsights({
  // No debug logging in production
  debug: false,
  // Sample rate at 50% of events in production
  sampleRate: 0.5
});
