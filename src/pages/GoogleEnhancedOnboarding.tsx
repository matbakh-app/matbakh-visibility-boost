// Phase 2: Google Enhanced Onboarding mit GMB Auto-Population

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Building, MapPin, Phone, Globe, Star, Camera, Edit3, Save, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GMBData {
  businessName: string;
  address: string;
  phone: string;
  website: string;
  description: string;
  categories: string[];
  rating: number;
  reviewCount: number;
  photos: string[];
  hours: Record<string, string>;
  verified: boolean;
}

type LoadingState = 'loading' | 'loaded' | 'error' | 'no_gmb';

export default function GoogleEnhancedOnboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loadingState, setLoadingState] = useState<LoadingState>('loading');
  const [editMode, setEditMode] = useState(false);
  const [gmbData, setGmbData] = useState<GMBData | null>(null);
  const [formData, setFormData] = useState({
    businessName: '',
    address: '',
    phone: '',
    website: '',
    description: '',
    categories: [] as string[]
  });

  useEffect(() => {
    loadGMBData();
  }, []);

  const loadGMBData = async () => {
    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/register');
        return;
      }

      // Skip GMB loading for now - go directly to manual input
      setLoadingState('no_gmb');
      setEditMode(true);

    } catch (error) {
      console.error('Session check error:', error);
      setLoadingState('error');
      setEditMode(true);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    console.log('[DEBUG] handleSaveProfile called');
    console.log('[DEBUG] formData:', formData);
    
    // Quick validation check
    if (!formData.businessName.trim()) {
      alert('Bitte Firmenname eingeben!');
      console.log('[DEBUG] Validation failed: no business name');
      return;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('[DEBUG] User:', user?.email);
      
      if (!user) {
        alert('Fehler: Benutzer nicht authentifiziert');
        return;
      }

      // First create business partner
      const { data: partner, error: partnerError } = await supabase
        .from('business_partners')
        .insert({
          user_id: user.id,
          company_name: formData.businessName,
          contact_email: user.email,
          contact_phone: formData.phone,
          address: formData.address,
          website: formData.website,
          description: formData.description,
          categories: formData.categories,
          google_connected: gmbData ? true : false,
          onboarding_completed: true,
          status: 'active'
        })
        .select()
        .single();

      if (partnerError) {
        console.error('[DEBUG] Partner creation error:', partnerError);
        alert('Fehler: Business Partner konnte nicht erstellt werden: ' + partnerError.message);
        return;
      }
      
      console.log('[DEBUG] Partner created successfully:', partner);

      // Then create business profile using partner_id
      const profileData = {
        partner_id: partner.id,
        business_name: formData.businessName,
        user_id: user.id,
        address: formData.address,
        phone: formData.phone,
        website: formData.website,
        description: formData.description,
        categories: formData.categories,
        registration_type: 'google',
        google_rating: gmbData?.rating || null,
        google_reviews_count: gmbData?.reviewCount || 0,
        business_hours: gmbData?.hours || {},
        profile_verified: gmbData?.verified || false
      };

      console.log('[DEBUG] Creating business profile with data:', profileData);
      
      const { error } = await supabase
        .from('business_profiles')
        .insert(profileData);

      if (error) {
        console.error('[DEBUG] Profile creation error:', error);
        alert('Fehler: Profil konnte nicht gespeichert werden: ' + error.message);
        return;
      }

      console.log('[DEBUG] Profile created successfully!');
      alert('Profil erfolgreich erstellt! Weiterleitung zu Dashboard...');

      // Redirect to dashboard instead of visibility check for now
      navigate('/dashboard');

    } catch (error) {
      console.error('[DEBUG] Unexpected error:', error);
      alert('Unerwarteter Fehler: ' + (error as Error).message);
    }
  };

  const renderLoadingState = () => (
    <Card className="w-full max-w-2xl">
      <CardHeader className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
        <CardTitle>Google My Business Daten werden geladen...</CardTitle>
      </CardHeader>
      <CardContent className="text-center text-gray-600">
        <p>Wir importieren Ihre Geschäftsdaten automatisch für eine schnellere Einrichtung.</p>
      </CardContent>
    </Card>
  );

  const renderNoGMBState = () => (
    <Card className="w-full max-w-2xl">
      <CardHeader className="text-center">
        <Building className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <CardTitle>Kein Google My Business Profil gefunden</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-gray-600">
          Sie haben noch kein Google My Business Profil oder es konnte nicht abgerufen werden.
        </p>
        <p className="text-sm text-gray-500">
          Kein Problem! Sie können Ihre Geschäftsdaten manuell eingeben.
        </p>
      </CardContent>
    </Card>
  );

  const renderMainForm = () => (
    <Card className="w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Geschäftsprofil {gmbData && <Badge variant="secondary">GMB-Daten importiert</Badge>}
          </CardTitle>
        </div>
        {gmbData && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            {editMode ? 'Speichern' : 'Bearbeiten'}
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* GMB Summary (wenn verfügbar) */}
        {gmbData && !editMode && (
          <div className="bg-green-50 p-4 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="font-medium">{gmbData.rating} ★</span>
              <span className="text-sm text-gray-600">({gmbData.reviewCount} Bewertungen)</span>
              {gmbData.verified && (
                <Badge variant="secondary" className="ml-2">
                  Verifiziert
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Kategorien:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {gmbData.categories.map((cat, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Fotos:</span>
                <div className="flex gap-1 mt-1">
                  {gmbData.photos.slice(0, 3).map((_, idx) => (
                    <div key={idx} className="w-8 h-8 bg-gray-200 rounded">
                      <Camera className="w-4 h-4 m-1 text-gray-400" />
                    </div>
                  ))}
                  {gmbData.photos.length > 3 && (
                    <span className="text-xs text-gray-500 self-center">
                      +{gmbData.photos.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Firmenname *</Label>
            <Input
              id="businessName"
              value={formData.businessName}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              disabled={!editMode}
              placeholder="Name Ihres Restaurants"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              disabled={!editMode}
              placeholder="+49 89 123456789"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Adresse *</Label>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              disabled={!editMode}
              placeholder="Straße, PLZ, Stadt"
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-400" />
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              disabled={!editMode}
              placeholder="https://ihre-website.de"
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Beschreibung</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            disabled={!editMode}
            placeholder="Beschreiben Sie Ihr Restaurant..."
            rows={3}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Button 
            onClick={handleSaveProfile}
            className="w-full"
            size="lg"
          >
            <BarChart3 className="w-5 h-5 mr-2" />
            [DEBUG] Profil erstellen
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/register')}
            className="w-full"
          >
            Zurück zur Registrierung
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        {loadingState === 'loading' && renderLoadingState()}
        {loadingState === 'no_gmb' && renderNoGMBState()}
        {loadingState === 'error' && renderNoGMBState()}
        {(loadingState === 'loaded' || loadingState === 'no_gmb' || loadingState === 'error') && renderMainForm()}
      </div>
    </div>
  );
}