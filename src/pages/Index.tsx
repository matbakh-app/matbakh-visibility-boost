
import React from 'react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🚀 matbakh.app
          </h1>
          <p className="text-gray-600 mb-6">
            Provider Architecture Fixed!
          </p>

          <div className="space-y-3">
            <a
              href="/test"
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              🧪 Test Page
            </a>
            <a
              href="/auth-debug"
              className="block w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
            >
              🔧 Auth Debug
            </a>
          </div>

          <div className="mt-6 p-3 bg-green-50 rounded">
            <p className="text-sm text-green-700">
              ✅ Task 6.4.4 Provider Architecture Stabilization
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
