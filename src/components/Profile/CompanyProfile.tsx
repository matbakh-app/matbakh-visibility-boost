import React from 'react';

interface CompanyProfileProps {
  onSave: (data: any) => void;
  onBack: () => void;
  initialData?: any;
}

export const CompanyProfile: React.FC<CompanyProfileProps> = ({ 
  onSave, 
  onBack, 
  initialData 
}) => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Unternehmensprofil</h1>
        
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4">Unternehmensinformationen</h2>
            <p className="text-muted-foreground mb-4">
              Konfigurieren Sie Ihr Unternehmensprofil für bessere Sichtbarkeit.
            </p>
            
            <button 
              onClick={() => onSave({})}
              className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
            >
              Profil speichern
            </button>
          </div>
        </div>
        
        <button 
          onClick={onBack}
          className="mt-4 text-muted-foreground hover:text-foreground"
        >
          ← Zurück zum persönlichen Profil
        </button>
      </div>
    </div>
  );
};