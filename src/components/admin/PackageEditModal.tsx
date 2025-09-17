import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
// MIGRATED: Supabase removed - use AWS services

interface Package {
  id: string;
  code: string;
  default_name: string;
  is_recurring: boolean;
  interval_months?: number;
  price?: number;
  promo_price?: number;
  promo_active?: boolean;
}

interface PackageEditModalProps {
  package: Package | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PackageEditModal: React.FC<PackageEditModalProps> = ({
  package: pkg,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    default_name: '',
    code: '',
    is_recurring: false,
    interval_months: 1,
    normal_price: '',
    promo_price: '',
    promo_active: false
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (pkg) {
      setFormData({
        default_name: pkg.default_name || '',
        code: pkg.code || '',
        is_recurring: pkg.is_recurring || false,
        interval_months: pkg.interval_months || 1,
        normal_price: pkg.price?.toString() || '',
        promo_price: pkg.promo_price?.toString() || '',
        promo_active: pkg.promo_active || false
      });
    }
  }, [pkg]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkg) return;

    setLoading(true);
    try {
      // Update package
      const { error: packageError } = await supabase
        .from('service_packages')
        .update({
          default_name: formData.default_name,
          code: formData.code,
          is_recurring: formData.is_recurring,
          interval_months: formData.is_recurring ? formData.interval_months : null
        } as any)
        .eq('id', pkg.id as any);

      if (packageError) throw packageError;

      // Update price if provided
      if (formData.normal_price) {
        const { error: priceError } = await supabase
          .from('service_prices')
          .upsert({
            package_id: pkg.id,
            normal_price_cents: Math.round(parseFloat(formData.normal_price) * 100),
            promo_price_cents: formData.promo_price 
              ? Math.round(parseFloat(formData.promo_price) * 100) 
              : null,
            promo_active: formData.promo_active,
            currency: 'EUR'
          } as any);

        if (priceError) throw priceError;
      }

      toast({
        title: "Erfolgreich gespeichert",
        description: "Das Paket wurde erfolgreich aktualisiert."
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating package:', error);
      toast({
        title: "Fehler",
        description: "Das Paket konnte nicht gespeichert werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Paket bearbeiten</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.default_name}
              onChange={(e) => setFormData(prev => ({ ...prev, default_name: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="recurring"
              checked={formData.is_recurring}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_recurring: checked }))}
            />
            <Label htmlFor="recurring">Wiederkehrende Zahlung</Label>
          </div>

          {formData.is_recurring && (
            <div>
              <Label htmlFor="interval">Intervall (Monate)</Label>
              <Input
                id="interval"
                type="number"
                min="1"
                value={formData.interval_months}
                onChange={(e) => setFormData(prev => ({ ...prev, interval_months: parseInt(e.target.value) }))}
              />
            </div>
          )}

          <div>
            <Label htmlFor="price">Normalpreis (€)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.normal_price}
              onChange={(e) => setFormData(prev => ({ ...prev, normal_price: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="promo_price">Aktionspreis (€)</Label>
            <Input
              id="promo_price"
              type="number"
              step="0.01"
              value={formData.promo_price}
              onChange={(e) => setFormData(prev => ({ ...prev, promo_price: e.target.value }))}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="promo_active"
              checked={formData.promo_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, promo_active: checked }))}
            />
            <Label htmlFor="promo_active">Aktion aktiv</Label>
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