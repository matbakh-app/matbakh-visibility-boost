/**
 * Worker Resource Limits Setup
 */

// Set memory limits
if (process.env.NODE_ENV === 'test') {
  // Increase memory limit for test workers
  if (!process.env.NODE_OPTIONS) {
    process.env.NODE_OPTIONS = '--max-old-space-size=4096';
  }
  
  // Set up graceful worker shutdown
  process.on('SIGTERM', () => {
    console.log('Worker received SIGTERM, shutting down gracefully');
    process.exit(0);
  });
  
  // Handle uncaught exceptions in workers
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception in worker:', error);
    process.exit(1);
  });
}
