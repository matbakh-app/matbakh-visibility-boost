
import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Upload, X, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PhotoUploaderProps {
  open: boolean;
  onClose: () => void;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({ open, onClose }) => {
  const { t } = useTranslation('dashboard');
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(files);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      // TODO: Implement actual upload logic to Google My Business
      // For now, simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: t('photoUpload.success', { defaultValue: 'Fotos erfolgreich hochgeladen' }),
        description: t('photoUpload.successDesc', { 
          defaultValue: `${selectedFiles.length} Foto(s) wurden zu Google My Business hinzugefügt.` 
        }),
      });
      
      setSelectedFiles([]);
      onClose();
    } catch (error) {
      toast({
        title: t('photoUpload.error', { defaultValue: 'Upload fehlgeschlagen' }),
        description: t('photoUpload.errorDesc', { defaultValue: 'Bitte versuche es erneut.' }),
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        multiple
        onChange={handleFileChange}
      />
      
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              {t('photoUpload.title', { defaultValue: 'Fotos hochladen' })}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedFiles.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  {t('photoUpload.selectPrompt', { defaultValue: 'Wähle Fotos für dein Google My Business Profil aus' })}
                </p>
                <Button onClick={handleFileSelect} variant="outline">
                  📁 {t('photoUpload.selectFiles', { defaultValue: 'Dateien auswählen' })}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedFiles.length} {t('photoUpload.filesSelected', { defaultValue: 'Datei(en) ausgewählt' })}
                  </span>
                  <Button onClick={() => setSelectedFiles([])} variant="outline" size="sm">
                    {t('common.clear', { defaultValue: 'Löschen' })}
                  </Button>
                </div>
                
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm truncate flex-1">{file.name}</span>
                      <Button
                        onClick={() => removeFile(index)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-3 pt-2">
                  <Button onClick={handleFileSelect} variant="outline" className="flex-1">
                    {t('photoUpload.addMore', { defaultValue: 'Weitere hinzufügen' })}
                  </Button>
                  <Button 
                    onClick={handleUpload} 
                    disabled={uploading}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {uploading ? 
                      t('photoUpload.uploading', { defaultValue: 'Hochladen...' }) : 
                      `📤 ${t('photoUpload.upload', { defaultValue: 'Hochladen' })}`
                    }
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
