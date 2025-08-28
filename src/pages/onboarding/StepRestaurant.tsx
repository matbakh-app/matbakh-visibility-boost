import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, Clock, Phone, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const restaurantSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben'),
  street: z.string().min(5, 'Straße und Hausnummer eingeben'),
  city: z.string().min(2, 'Stadt eingeben'),
  zip: z.string().min(4, 'PLZ eingeben'),
  country: z.string().default('DE'),
  phone: z.string().optional(),
  email: z.string().email('Gültige E-Mail eingeben').optional().or(z.literal('')),
});

type RestaurantFormData = z.infer<typeof restaurantSchema>;

const OPENING_HOURS_TEMPLATE = {
  mon: [['09:00', '22:00']],
  tue: [['09:00', '22:00']],
  wed: [['09:00', '22:00']],
  thu: [['09:00', '22:00']],
  fri: [['09:00', '23:00']],
  sat: [['09:00', '23:00']],
  sun: [['10:00', '21:00']]
};

export default function StepRestaurant() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<RestaurantFormData>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: {
      country: 'DE'
    }
  });

  const onSubmit = async (data: RestaurantFormData) => {
    setIsLoading(true);
    
    try {
      const session = await supabase.auth.getSession();
      
      const response = await fetch('/functions/v1/onboarding-save-step', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token}`
        },
        body: JSON.stringify({
          step: 'restaurant',
          data: {
            ...data,
            opening_hours: OPENING_HOURS_TEMPLATE // Default opening hours
          },
          next: 'brand'
        })
      });

      if (response.ok) {
        navigate('/onboarding/brand');
      } else {
        throw new Error('Failed to save restaurant data');
      }
    } catch (error) {
      console.error('Error saving restaurant data:', error);
      // Continue anyway for now
      navigate('/onboarding/brand');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mx-auto mb-3">
          <MapPin className="w-6 h-6 text-primary" />
        </div>
        
        <h1 className="text-2xl font-bold">Basisdaten</h1>
        <p className="text-muted-foreground">
          Adresse & Öffnungszeiten – für Maps & Gäste
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Restaurant Name */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Restaurant-Name</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name deines Restaurants *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="z.B. Bella Vista, Zur Alten Post..."
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Adresse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="street">Straße und Hausnummer *</Label>
              <Input
                id="street"
                {...register('street')}
                placeholder="z.B. Hauptstraße 123"
                className={errors.street ? 'border-destructive' : ''}
              />
              {errors.street && (
                <p className="text-sm text-destructive mt-1">{errors.street.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="zip">PLZ *</Label>
                <Input
                  id="zip"
                  {...register('zip')}
                  placeholder="12345"
                  className={errors.zip ? 'border-destructive' : ''}
                />
                {errors.zip && (
                  <p className="text-sm text-destructive mt-1">{errors.zip.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="city">Stadt *</Label>
                <Input
                  id="city"
                  {...register('city')}
                  placeholder="Berlin"
                  className={errors.city ? 'border-destructive' : ''}
                />
                {errors.city && (
                  <p className="text-sm text-destructive mt-1">{errors.city.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="country">Land</Label>
              <Select defaultValue="DE" onValueChange={(value) => setValue('country', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DE">Deutschland</SelectItem>
                  <SelectItem value="AT">Österreich</SelectItem>
                  <SelectItem value="CH">Schweiz</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kontakt (optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="phone" className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>Telefonnummer</span>
              </Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="+49 30 12345678"
                type="tel"
              />
            </div>

            <div>
              <Label htmlFor="email" className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>E-Mail</span>
              </Label>
              <Input
                id="email"
                {...register('email')}
                placeholder="info@restaurant.de"
                type="email"
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Opening Hours Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Öffnungszeiten</h3>
                <p className="text-sm text-muted-foreground">
                  Wir setzen erstmal Standard-Zeiten (Mo-Do 9-22, Fr-Sa 9-23, So 10-21). 
                  Du kannst sie später im Dashboard anpassen.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col space-y-3">
          <Button 
            type="submit" 
            size="lg" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Speichere...' : 'Weiter zur Marke'}
          </Button>
          
          <Button 
            type="button"
            variant="ghost" 
            onClick={() => navigate('/onboarding')}
            className="w-full"
          >
            Zurück
          </Button>
        </div>
      </form>
    </div>
  );
}