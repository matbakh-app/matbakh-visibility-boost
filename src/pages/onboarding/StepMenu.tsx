import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Link, Camera } from 'lucide-react';

export default function StepMenu() {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    menuPdf: null as File | null,
    menuUrl: '',
    photos: [] as File[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Save menu data via API
      const response = await fetch('/functions/v1/onboarding-save-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'menu',
          data: {
            menuUrl: formData.menuUrl,
            hasMenuPdf: !!formData.menuPdf,
            photoCount: formData.photos.length
          },
          next: 'channels'
        })
      });

      if (response.ok) {
        navigate('/onboarding/channels');
      }
    } catch (error) {
      console.error('Error saving menu data:', error);
    }
  };

  const handleMenuPdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setFormData(prev => ({ ...prev, menuPdf: file }));
    }
  };

  const handlePhotosUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setFormData(prev => ({ 
      ...prev, 
      photos: [...prev.photos, ...imageFiles].slice(0, 5) // Max 5 photos
    }));
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{t('menu.title')}</h1>
        <p className="text-muted-foreground">{t('menu.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Menu PDF Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('menu.uploadPdf')}
            </CardTitle>
            <CardDescription>
              Optional - Sie können Ihr Menü auch später hinzufügen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".pdf"
                onChange={handleMenuPdfUpload}
                className="hidden"
                id="menu-pdf-upload"
              />
              <label htmlFor="menu-pdf-upload" className="cursor-pointer">
                <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Menü-PDF hochladen
                </p>
              </label>
              {formData.menuPdf && (
                <p className="mt-2 text-sm text-green-600">
                  ✓ {formData.menuPdf.name}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Menu URL */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              {t('menu.menuUrl')}
            </CardTitle>
            <CardDescription>
              Falls Sie bereits ein Online-Menü haben
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              type="url"
              placeholder={t('menu.menuUrlPlaceholder')}
              value={formData.menuUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, menuUrl: e.target.value }))}
            />
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              {t('menu.photos')}
            </CardTitle>
            <CardDescription>
              {t('menu.photosHint')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotosUpload}
                className="hidden"
                id="photos-upload"
                disabled={formData.photos.length >= 5}
              />
              <label htmlFor="photos-upload" className="cursor-pointer">
                <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Fotos hochladen ({formData.photos.length}/5)
                </p>
              </label>
            </div>

            {formData.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-20 object-cover rounded"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={() => removePhoto(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/onboarding/brand')}
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