import React from 'react';

interface MyProfileProps {
  onNavigateToCompanyProfile: () => void;
  onBack: () => void;
}

export const MyProfile: React.FC<MyProfileProps> = ({ 
  onNavigateToCompanyProfile, 
  onBack 
}) => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Mein Profil</h1>
        
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4">Persönliche Informationen</h2>
            <p className="text-muted-foreground mb-4">
              Vervollständigen Sie Ihr persönliches Profil, bevor Sie zum Unternehmensprofil wechseln.
            </p>
            
            <button 
              onClick={onNavigateToCompanyProfile}
              className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
            >
              Zum Unternehmensprofil
            </button>
          </div>
        </div>
        
        <button 
          onClick={onBack}
          className="mt-4 text-muted-foreground hover:text-foreground"
        >
          ← Zurück
        </button>
      </div>
    </div>
  );
};