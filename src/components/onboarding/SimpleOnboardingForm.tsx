import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface SimpleOnboardingFormProps {
  onComplete: (data: any) => void;
}

// Vereinfachte Kategorien für schnelle Verifikation
const SIMPLE_CATEGORIES = [
  { id: 'restaurant', name: 'Restaurant', description: 'Speiserestaurant' },
  { id: 'cafe', name: 'Café', description: 'Café oder Bistro' },
  { id: 'bar', name: 'Bar', description: 'Bar oder Kneipe' },
  { id: 'delivery', name: 'Lieferdienst', description: 'Essenslieferung' },
  { id: 'catering', name: 'Catering', description: 'Catering-Service' },
  { id: 'hotel', name: 'Hotel', description: 'Hotel oder Pension' }
];

export const SimpleOnboardingForm: React.FC<SimpleOnboardingFormProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    companyName: '',
    address: '',
    phone: '',
    website: '',
    description: '',
    categories: [] as string[]
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addCategory = (categoryId: string) => {
    if (!formData.categories.includes(categoryId) && formData.categories.length < 3) {
      updateField('categories', [...formData.categories, categoryId]);
    }
  };

  const removeCategory = (categoryId: string) => {
    updateField('categories', formData.categories.filter(id => id !== categoryId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Minimale Validierung für Verifikation
    if (!formData.companyName.trim()) {
      alert('Bitte geben Sie einen Firmennamen ein');
      return;
    }
    
    if (formData.categories.length === 0) {
      alert('Bitte wählen Sie mindestens eine Kategorie');
      return;
    }

    // Zusätzliche Daten für die Verifikation hinzufügen
    const completedData = {
      ...formData,
      googleConnected: false,
      selectedServices: [],
      kpiData: {},
      businessModel: [],
      revenueStreams: [],
      targetAudience: [],
      seatingCapacity: null,
      openingHours: [],
      specialFeatures: []
    };

    onComplete(completedData);
  };

  const isFormValid = formData.companyName.trim() && formData.categories.length > 0;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
              Vereinfachtes Onboarding
            </CardTitle>
            <p className="text-center text-muted-foreground">
              Für Verifikationszwecke - Nur die wichtigsten Daten
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Firmenname */}
              <div className="space-y-2">
                <Label htmlFor="companyName">
                  Firmenname *
                </Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  placeholder="z.B. Restaurant Beispiel"
                  required
                />
              </div>

              {/* Adresse */}
              <div className="space-y-2">
                <Label htmlFor="address">
                  Adresse
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="z.B. Musterstraße 123, 80331 München"
                />
              </div>

              {/* Telefon */}
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Telefon
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="z.B. +49 89 123456"
                />
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label htmlFor="website">
                  Website
                </Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  placeholder="z.B. https://restaurant-beispiel.de"
                />
              </div>

              {/* Kategorien */}
              <div className="space-y-4">
                <Label>
                  Kategorien auswählen * (max. 3)
                </Label>
                
                <Select onValueChange={addCategory} disabled={formData.categories.length >= 3}>
                  <SelectTrigger>
                    <SelectValue placeholder={
                      formData.categories.length >= 3 
                        ? "Maximum erreicht" 
                        : "Kategorie hinzufügen"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {SIMPLE_CATEGORIES
                      .filter(cat => !formData.categories.includes(cat.id))
                      .map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          <div>
                            <div className="font-medium">{category.name}</div>
                            <div className="text-sm text-muted-foreground">{category.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {/* Gewählte Kategorien */}
                {formData.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.categories.map(categoryId => {
                      const category = SIMPLE_CATEGORIES.find(c => c.id === categoryId);
                      return category ? (
                        <Badge key={categoryId} variant="secondary" className="flex items-center gap-1">
                          {category.name}
                          <button
                            type="button"
                            onClick={() => removeCategory(categoryId)}
                            className="ml-1 hover:bg-background/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
                
                <p className="text-sm text-muted-foreground">
                  {formData.categories.length} / 3 Kategorien ausgewählt
                </p>
              </div>

              {/* Beschreibung */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Kurze Beschreibung
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Beschreiben Sie Ihr Unternehmen kurz..."
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={!isFormValid}
                >
                  Onboarding abschließen
                </Button>
                
                {!isFormValid && (
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    Bitte füllen Sie Firmenname und mindestens eine Kategorie aus
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};