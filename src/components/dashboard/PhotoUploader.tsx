
import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Upload, X, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/ui/image-upload';

interface PhotoUploaderProps {
  open: boolean;
  onClose: () => void;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({ open, onClose }) => {
  const { t } = useTranslation('dashboard');
  const { toast } = useToast();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            {t('photoUpload.title', { defaultValue: 'Fotos hochladen' })}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <ImageUpload
            bucket="matbakh-files-profile"
            folder="gmb-photos"
            multiple={true}
            maxSize={10 * 1024 * 1024} // 10MB
            acceptedTypes={['image/jpeg', 'image/jpg', 'image/png']}
            placeholder={t('photoUpload.selectPrompt', { 
              defaultValue: 'Wähle Fotos für dein Google My Business Profil aus' 
            })}
            onUploadSuccess={(fileUrl, result) => {
              toast({
                title: t('photoUpload.success', { defaultValue: 'Fotos erfolgreich hochgeladen' }),
                description: t('photoUpload.successDesc', { 
                  defaultValue: 'Foto wurde zu deinem Profil hinzugefügt.' 
                }),
              });
              // TODO: Sync uploaded photos to Google My Business
              console.log('Photo uploaded to S3:', fileUrl);
            }}
            onUploadError={(error) => {
              toast({
                title: t('photoUpload.error', { defaultValue: 'Upload fehlgeschlagen' }),
                description: error.message,
                variant: 'destructive',
              });
            }}
          />
          
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              {t('common.close', { defaultValue: 'Schließen' })}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
