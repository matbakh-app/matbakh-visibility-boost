/**
 * Performance Test Page
 * Dedicated page for performance testing operations
 */

import React from 'react';
import PerformanceTestDashboard from '@/components/performance-testing/PerformanceTestDashboard';

export default function PerformanceTestPage() {
  const handleResultsChange = (results: any) => {
    console.log('Performance test results:', results);
    // Could store results in global state or send to analytics
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Performance Testing</h1>
        <p className="text-muted-foreground mt-2">
          Run comprehensive performance tests to ensure optimal system performance under various load conditions.
        </p>
      </div>
      
      <PerformanceTestDashboard 
        defaultTarget={import.meta.env.VITE_PUBLIC_API_BASE || 'http://localhost:3000'}
        onResultsChange={handleResultsChange}
      />
    </div>
  );
}