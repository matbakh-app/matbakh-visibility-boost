import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Palette, MessageSquare } from 'lucide-react';

export default function StepBrand() {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    logo: null as File | null,
    primaryColor: '#AA3D2E',
    secondaryColor: '#F4E6D0',
    tone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Save brand data via API
      const response = await fetch('/functions/v1/onboarding-save-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'brand',
          data: {
            primaryColor: formData.primaryColor,
            secondaryColor: formData.secondaryColor,
            tone: formData.tone
          },
          next: 'menu'
        })
      });

      if (response.ok) {
        navigate('/onboarding/menu');
      }
    } catch (error) {
      console.error('Error saving brand data:', error);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, logo: file }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{t('brand.title')}</h1>
        <p className="text-muted-foreground">{t('brand.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {t('brand.logo')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                id="logo-upload"
              />
              <label htmlFor="logo-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Logo hochladen (optional)
                </p>
              </label>
              {formData.logo && (
                <p className="mt-2 text-sm text-green-600">
                  ✓ {formData.logo.name}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Colors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              {t('brand.colors')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primary-color">Hauptfarbe</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary-color"
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                    placeholder="#AA3D2E"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="secondary-color">Akzentfarbe</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary-color"
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    placeholder="#F4E6D0"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tone */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {t('brand.tone')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={formData.tone} onValueChange={(value) => setFormData(prev => ({ ...prev, tone: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Tonalität wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="friendly">{t('brand.toneOptions.friendly')}</SelectItem>
                <SelectItem value="elegant">{t('brand.toneOptions.elegant')}</SelectItem>
                <SelectItem value="casual">{t('brand.toneOptions.casual')}</SelectItem>
                <SelectItem value="traditional">{t('brand.toneOptions.traditional')}</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/onboarding/restaurant')}
          >
            {t('navigation.previous')}
          </Button>
          <Button type="submit">
            {t('navigation.next')}
          </Button>
        </div>
      </form>
    </div>
  );
}