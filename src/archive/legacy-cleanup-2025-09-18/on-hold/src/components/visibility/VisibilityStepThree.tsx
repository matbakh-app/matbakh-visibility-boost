
import React, { useEffect } from 'react';
import { LoaderCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface Props {
  loading?: boolean;
  success?: boolean;
  onRestart: () => void;
  onDone?: () => void;
  restaurantName?: string;
}

const VisibilityStepThree: React.FC<Props> = ({ 
  loading = true, 
  success = false, 
  onRestart, 
  onDone, 
  restaurantName 
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    // Optional: Trigger automatische Weiterleitung oder Report-Abruf
    if (success && onDone) {
      const timeout = setTimeout(onDone, 3000); // Auto-redirect in 3s
      return () => clearTimeout(timeout);
    }
  }, [success, onDone]);

  return (
    <div className="text-center py-16 px-6 max-w-xl mx-auto">
      {loading && (
        <>
          <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-muted-foreground" />
          <h2 className="text-xl font-semibold mt-4">
            Auswertung wird erstellt …
          </h2>
          <p className="text-muted-foreground mt-2">
            Wir analysieren die Online-Sichtbarkeit von <strong>{restaurantName}</strong> auf Google, Instagram & Facebook.
          </p>
        </>
      )}

      {success && (
        <>
          <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />
          <h2 className="text-xl font-semibold mt-4">
            Analyse abgeschlossen!
          </h2>
          <p className="text-muted-foreground mt-2">
            Ihr individueller Sichtbarkeits-Report wurde erfolgreich erstellt.
          </p>
          <div className="mt-6 space-x-4">
            <Button variant="default" onClick={onDone}>
              Report anzeigen
            </Button>
            <Button variant="outline" onClick={onRestart}>
              Neue Analyse starten
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default VisibilityStepThree;
