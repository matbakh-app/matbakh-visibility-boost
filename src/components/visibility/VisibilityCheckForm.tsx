
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, MapPin, Building2, Tag, Benchmark, Globe, Facebook, Instagram } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CategoryOption {
  id: string;
  name: string;
  subcategories?: CategoryOption[];
}

interface MatbakhTag {
  id: string;
  name: string;
  description: string;
}

interface VisibilityCheckData {
  businessName: string;
  location: string;
  mainCategory: string;
  subCategory: string;
  matbakhTags: string[];
  website?: string;
  facebookName?: string;
  instagramName?: string;
  benchmarks: string[];
  email?: string;
}

const VisibilityCheckForm: React.FC = () => {
  const { t } = useTranslation();
  
  // Form State
  const [formData, setFormData] = useState<VisibilityCheckData>({
    businessName: '',
    location: '',
    mainCategory: '',
    subCategory: '',
    matbakhTags: [],
    website: '',
    facebookName: '',
    instagramName: '',
    benchmarks: ['', '', ''],
    email: ''
  });

  // UI State
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [subcategories, setSubcategories] = useState<CategoryOption[]>([]);
  const [matbakhTags, setMatbakhTags] = useState<MatbakhTag[]>([]);

  // Load categories from GMB database
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('gmb_categories')
        .select('category_id, name_de, parent_id')
        .is('parent_id', null)
        .order('sort_order');

      if (error) throw error;

      const categoryOptions = data?.map(cat => ({
        id: cat.category_id,
        name: cat.name_de
      })) || [];

      setCategories(categoryOptions);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadSubcategories = async (mainCategoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('gmb_categories')
        .select('category_id, name_de')
        .eq('parent_id', mainCategoryId)
        .order('sort_order');

      if (error) throw error;

      const subcategoryOptions = data?.map(cat => ({
        id: cat.category_id,
        name: cat.name_de
      })) || [];

      setSubcategories(subcategoryOptions);
    } catch (error) {
      console.error('Error loading subcategories:', error);
    }
  };

  const loadMatbakhTags = async (categoryId: string) => {
    // Load Matbakh-specific tags based on category
    const mockTags: MatbakhTag[] = [
      { id: 'outdoor_seating', name: 'Außenbereich', description: 'Terrasse oder Biergarten' },
      { id: 'delivery', name: 'Lieferservice', description: 'Lieferung nach Hause' },
      { id: 'vegan_options', name: 'Vegane Optionen', description: 'Vegane Gerichte verfügbar' },
      { id: 'live_music', name: 'Live Musik', description: 'Regelmäßige Live-Auftritte' },
      { id: 'parking', name: 'Parkplätze', description: 'Eigene Parkplätze vorhanden' },
      { id: 'wheelchair_accessible', name: 'Barrierefrei', description: 'Rollstuhlgerecht' }
    ];
    setMatbakhTags(mockTags);
  };

  const handleCategoryChange = async (categoryId: string) => {
    setFormData(prev => ({ ...prev, mainCategory: categoryId, subCategory: '', matbakhTags: [] }));
    await loadSubcategories(categoryId);
    await loadMatbakhTags(categoryId);
  };

  const handleTagToggle = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      matbakhTags: prev.matbakhTags.includes(tagId)
        ? prev.matbakhTags.filter(id => id !== tagId)
        : prev.matbakhTags.length < 6
        ? [...prev.matbakhTags, tagId]
        : prev.matbakhTags
    }));
  };

  const handleBenchmarkChange = (index: number, value: string) => {
    const newBenchmarks = [...formData.benchmarks];
    newBenchmarks[index] = value;
    setFormData(prev => ({ ...prev, benchmarks: newBenchmarks }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('enhanced-visibility-check', {
        body: formData
      });

      if (error) throw error;

      // Handle successful analysis
      console.log('Analysis complete:', data);
      
    } catch (error) {
      console.error('Error during analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    return formData.businessName && 
           formData.location && 
           formData.mainCategory && 
           formData.subCategory;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {[1, 2, 3].map((stepNum) => (
          <div key={stepNum} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= stepNum ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {stepNum}
            </div>
            {stepNum < 3 && <div className="w-12 h-0.5 bg-gray-200 mx-2" />}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Information */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Grundinformationen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Unternehmensname *
                </label>
                <Input
                  value={formData.businessName}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                  placeholder="z.B. Restaurant Zur Sonne"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Standort *
                </label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="z.B. München, Deutschland"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Hauptkategorie *
                </label>
                <Select onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kategorie wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {subcategories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Unterkategorie *
                  </label>
                  <Select onValueChange={(value) => setFormData(prev => ({ ...prev, subCategory: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unterkategorie wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories.map((subcat) => (
                        <SelectItem key={subcat.id} value={subcat.id}>
                          {subcat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Matbakh Tags */}
            {matbakhTags.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Spezielle Eigenschaften (max. 6)
                </label>
                <div className="flex flex-wrap gap-2">
                  {matbakhTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={formData.matbakhTags.includes(tag.id) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/10"
                      onClick={() => handleTagToggle(tag.id)}
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag.name}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.matbakhTags.length}/6 ausgewählt
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <Button 
                onClick={() => setStep(2)}
                disabled={!canProceed()}
              >
                Weiter zu optionalen Angaben
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Optional Information */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Optionale Angaben
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Website
                </label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://ihre-website.de"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Facebook className="w-4 h-4 inline mr-1" />
                  Facebook Name
                </label>
                <Input
                  value={formData.facebookName}
                  onChange={(e) => setFormData(prev => ({ ...prev, facebookName: e.target.value }))}
                  placeholder="Ihr Facebook Seitenname"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Instagram className="w-4 h-4 inline mr-1" />
                  Instagram Name
                </label>
                <Input
                  value={formData.instagramName}
                  onChange={(e) => setFormData(prev => ({ ...prev, instagramName: e.target.value }))}
                  placeholder="@ihr_instagram_name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Benchmark className="w-4 h-4 inline mr-1" />
                Vergleichbare Unternehmen (Benchmarks)
              </label>
              <div className="space-y-2">
                {formData.benchmarks.map((benchmark, index) => (
                  <Input
                    key={index}
                    value={benchmark}
                    onChange={(e) => handleBenchmarkChange(index, e.target.value)}
                    placeholder={`Benchmark ${index + 1} (Name oder Website)`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Falls leer gelassen, findet unsere KI automatisch passende Vergleichsunternehmen
              </p>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Zurück
              </Button>
              <Button onClick={() => setStep(3)}>
                Weiter zur Analyse
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Analysis & Email */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Sichtbarkeits-Analyse starten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                E-Mail für detaillierten Bericht (optional)
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="ihre@email.de"
              />
              <p className="text-xs text-gray-500 mt-1">
                DSGVO-konform • Detaillierter PDF-Report mit Handlungsempfehlungen
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Was wird analysiert:</h4>
              <ul className="text-sm space-y-1">
                <li>✓ Google My Business Profil-Vollständigkeit</li>
                <li>✓ Facebook Sichtbarkeit & Engagement</li>
                <li>✓ Instagram Business-Features</li>
                <li>✓ Benchmark-Vergleich mit Wettbewerbern</li>
                <li>✓ Gesamtrating & Verbesserungspotential</li>
              </ul>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Zurück
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={loading}
                className="bg-primary hover:bg-primary/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyse läuft...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Sichtbarkeits-Check starten
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VisibilityCheckForm;
