import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import {
  ProfileLayout,
  ProfileHeader,
  ProfileContent,
  ProfileSection
} from './ProfileLayout';
import { InputField, SelectField, TextAreaField } from './ProfileFields';
import { 
  User, 
  Mail, 
  Calendar, 
  Clock, 
  Building, 
  ArrowRight,
  Bell,
  Save
} from 'lucide-react';

// Form validation schema
const ProfileSchema = z.object({
  name: z.string()
    .min(2, 'Name muss mindestens 2 Zeichen lang sein')
    .max(100, 'Name darf maximal 100 Zeichen lang sein'),
  role: z.enum(['user', 'admin', 'manager']),
  private_email: z.string()
    .email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
  phone: z.string()
    .min(5, 'Telefonnummer muss mindestens 5 Zeichen lang sein'),
  address: z.string()
    .min(5, 'Adresse muss mindestens 5 Zeichen lang sein'),
  notifications: z.object({
    email: z.boolean()
  }).optional()
});

type ProfileFormData = z.infer<typeof ProfileSchema>;

export const MyProfile: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data, isLoading, isError, save } = useProfile();
  
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
    reset
  } = useForm<ProfileFormData>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      name: '',
      role: 'user',
      private_email: '',
      phone: '',
      address: '',
      notifications: {
        email: true
      }
    }
  });

  // Reset form when data loads
  useEffect(() => {
    if (data) {
      reset({
        name: data.name || '',
        role: (data.role as 'user' | 'admin' | 'manager') || 'user',
        private_email: data.private_email || '',
        phone: data.phone || '',
        address: data.address || '',
        notifications: {
          email: true
        }
      });
    }
  }, [data, reset]);

  const onSubmit = async (values: ProfileFormData) => {
    try {
      console.log('Submitting profile data:', values);
      const result = await save({
        name: values.name,
        role: values.role,
        private_email: values.private_email,
        phone: values.phone,
        address: values.address
      });
      
      if (result) {
        toast({
          title: "Profil gespeichert",
          description: "Ihre Änderungen wurden erfolgreich gespeichert.",
        });
        
        // Route based on role
        if (values.role === 'admin') {
          navigate('/admin-panel');
        } else if (values.role === 'manager') {
          navigate('/company-profile');
        } else {
          navigate('/company-profile');
        }
      } else {
        throw new Error('Speichern fehlgeschlagen');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Fehler beim Speichern",
        description: "Ihre Änderungen konnten nicht gespeichert werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    navigate(-1); // Go back to previous page in history
  };

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorBanner message="Profil konnte nicht geladen werden" />;

  const userData = {
    name: data?.name || "Max Mustermann",
    email: "max.mustermann@restaurant.de", // Email kommt von auth.user, nicht profiles
    role: data?.role || "Restaurant Manager",
    avatar: "",
    dateJoined: "15. März 2024",
    lastLogin: "Heute, 14:30"
  };

  const roleOptions = [
    { value: 'user', label: 'Benutzer' },
    { value: 'admin', label: 'Administrator' },
    { value: 'manager', label: 'Manager' }
  ];

  return (
    <ProfileLayout>
      <ProfileHeader
        title="Mein Profil"
        subtitle="Verwalten Sie Ihre persönlichen Informationen"
        onBack={handleBack}
        actions={
          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
              Aktiv
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
              Verifiziert
            </Badge>
          </div>
        }
      />

      <ProfileContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Profile Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <ProfileSection
                  title="Persönliche Informationen"
                  description="Aktualisieren Sie Ihre persönlichen Daten"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller
                      name="name"
                      control={control}
                      render={({ field }) => (
                        <InputField
                          label="Vollständiger Name"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="z.B. Max Mustermann"
                          error={errors.name?.message}
                          required
                        />
                      )}
                    />
                    
                    <Controller
                      name="role"
                      control={control}
                      render={({ field }) => (
                        <SelectField
                          label="Rolle"
                          value={field.value}
                          onChange={field.onChange}
                          options={roleOptions}
                          error={errors.role?.message}
                          required
                        />
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller
                      name="private_email"
                      control={control}
                      render={({ field }) => (
                        <InputField
                          label="E-Mail privat"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="max@example.com"
                          type="email"
                          error={errors.private_email?.message}
                          required
                        />
                      )}
                    />
                    
                    <Controller
                      name="phone"
                      control={control}
                      render={({ field }) => (
                        <InputField
                          label="Telefonnummer"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="+49 89 12345678"
                          type="tel"
                          error={errors.phone?.message}
                          required
                        />
                      )}
                    />
                  </div>

                  <Controller
                    name="address"
                    control={control}
                    render={({ field }) => (
                      <TextAreaField
                        label="Privatadresse"
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Musterstraße 123, 80331 München"
                        rows={2}
                        error={errors.address?.message}
                        required
                      />
                    )}
                  />
                </ProfileSection>
              </Card>

              {/* Benachrichtigungen Card - Only Email */}
              <Card className="p-6">
                <ProfileSection
                  title="Benachrichtigungseinstellungen"
                  description="E-Mail Benachrichtigungen verwalten"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="email-notifications" className="text-base font-medium">
                        E-Mail Benachrichtigungen
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Erhalte Updates über neue Analysen und Features
                      </p>
                    </div>
                    <Switch id="email-notifications" defaultChecked />
                  </div>
                </ProfileSection>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* User Info Card */}
            <Card className="p-6">
              <div className="text-center space-y-4">
                <Avatar className="w-24 h-24 mx-auto">
                  <AvatarImage src={userData.avatar} alt={userData.name} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {userData.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h3 className="text-xl font-bold">{userData.name}</h3>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                    <Mail className="w-4 h-4" />
                    <span>{userData.email}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mt-1">
                    <Building className="w-4 h-4" />
                    <span>{userData.role}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <div className="text-left">
                      <div className="font-medium">Beigetreten am</div>
                      <div className="text-muted-foreground">{userData.dateJoined}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-600" />
                    <div className="text-left">
                      <div className="font-medium">Letzter Login</div>
                      <div className="text-muted-foreground">{userData.lastLogin}</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                type="submit"
                disabled={!isDirty || isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Speichern...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Änderungen speichern
                  </>
                )}
              </Button>

              <Button 
                type="button"
                variant="outline"
                onClick={handleBack}
                className="w-full"
              >
                Zurück
              </Button>

              {/* Company Profile Navigation */}
              <Card className="p-4 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                    <Building className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Firmenprofil</h3>
                    <p className="text-sm text-muted-foreground">
                      Unternehmensdetails verwalten
                    </p>
                  </div>
                  <Button 
                    type="button"
                    onClick={() => navigate('/company-profile')}
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    <Building className="w-4 h-4 mr-2" />
                    Zum Firmenprofil
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
            </div>
            </div>
          </div>
        </form>
      </ProfileContent>
    </ProfileLayout>
  );
};