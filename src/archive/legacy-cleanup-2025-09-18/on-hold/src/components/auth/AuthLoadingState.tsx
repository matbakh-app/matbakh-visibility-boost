import React from 'react';

const AuthLoadingState: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-gray-600">Lade Benutzeroberfläche...</p>
      </div>
    </div>
  );
};

export default AuthLoadingState;