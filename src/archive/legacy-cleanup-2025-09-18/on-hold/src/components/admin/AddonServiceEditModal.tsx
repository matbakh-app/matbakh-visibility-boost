import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
// MIGRATED: Supabase removed - use AWS services

interface AddonService {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  original_price?: number;
  features: string[];
  period: string;
  category: string;
  compatible_packages: string[];
  is_active: boolean;
  sort_order?: number;
}

interface AddonServiceEditModalProps {
  service: AddonService | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddonServiceEditModal: React.FC<AddonServiceEditModalProps> = ({
  service,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    original_price: '',
    features: '',
    period: 'monthly',
    category: '',
    compatible_packages: '',
    is_active: true,
    sort_order: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || '',
        slug: service.slug || '',
        description: service.description || '',
        price: service.price?.toString() || '',
        original_price: service.original_price?.toString() || '',
        features: service.features?.join('\n') || '',
        period: service.period || 'monthly',
        category: service.category || '',
        compatible_packages: service.compatible_packages?.join(', ') || '',
        is_active: service.is_active ?? true,
        sort_order: service.sort_order?.toString() || ''
      });
    }
  }, [service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('addon_services')
        .update({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || null,
          price: parseFloat(formData.price),
          original_price: formData.original_price ? parseFloat(formData.original_price) : null,
          features: formData.features.split('\n').filter(f => f.trim()),
          period: formData.period,
          category: formData.category,
          compatible_packages: formData.compatible_packages.split(',').map(p => p.trim()).filter(p => p),
          is_active: formData.is_active,
          sort_order: formData.sort_order ? parseInt(formData.sort_order) : null
        } as any)
        .eq('id', service.id as any);

      if (error) throw error;

      toast({
        title: "Erfolgreich gespeichert",
        description: "Der Add-on Service wurde erfolgreich aktualisiert."
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating addon service:', error);
      toast({
        title: "Fehler",
        description: "Der Add-on Service konnte nicht gespeichert werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add-on Service bearbeiten</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price">Preis (€)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="original_price">Ursprungspreis (€)</Label>
              <Input
                id="original_price"
                type="number"
                step="0.01"
                value={formData.original_price}
                onChange={(e) => setFormData(prev => ({ ...prev, original_price: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="sort_order">Sortierung</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData(prev => ({ ...prev, sort_order: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="period">Zeitraum</Label>
              <Select value={formData.period} onValueChange={(value) => setFormData(prev => ({ ...prev, period: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-time">Einmalig</SelectItem>
                  <SelectItem value="monthly">Monatlich</SelectItem>
                  <SelectItem value="yearly">Jährlich</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category">Kategorie</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="features">Features (eine pro Zeile)</Label>
            <Textarea
              id="features"
              value={formData.features}
              onChange={(e) => setFormData(prev => ({ ...prev, features: e.target.value }))}
              rows={4}
              placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
            />
          </div>

          <div>
            <Label htmlFor="compatible_packages">Kompatible Pakete (durch Komma getrennt)</Label>
            <Input
              id="compatible_packages"
              value={formData.compatible_packages}
              onChange={(e) => setFormData(prev => ({ ...prev, compatible_packages: e.target.value }))}
              placeholder="google-business-setup, profilpflege-basis"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">Aktiv</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Speichere...' : 'Speichern'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};