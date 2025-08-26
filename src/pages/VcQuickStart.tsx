import React from 'react';
import VcQuickOnboarding from '@/components/vc/VcQuickOnboarding';

export default function VcQuickStart() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <VcQuickOnboarding />
      </div>
    </div>
  );
}