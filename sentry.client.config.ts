import * as Sentry from "@sentry/astro"

Sentry.init({
  // DSN should be set via PUBLIC_SENTRY_DSN environment variable
  // or configure it here directly
  
  // Performance Monitoring
  tracesSampleRate: 1.0, // Adjust this value in production
  
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  integrations: [
    Sentry.replayIntegration(),
  ],
})
