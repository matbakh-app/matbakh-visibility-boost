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
import { InputField, SelectField } from './ProfileFields';
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
  language: z.enum(['de', 'en']),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    darkMode: z.boolean()
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
      language: 'de',
      role: 'user',
      notifications: {
        email: true,
        push: false,
        darkMode: false
      }
    }
  });

  // Reset form when data loads
  useEffect(() => {
    if (data) {
      reset({
        name: data.name || '',
        language: (data.language as 'de' | 'en') || 'de',
        role: (data.role as 'user' | 'admin' | 'manager') || 'user',
        notifications: {
          email: true,
          push: false,
          darkMode: false
        }
      });
    }
  }, [data, reset]);

  const onSubmit = async (values: ProfileFormData) => {
    try {
      console.log('Submitting profile data:', values);
      const result = await save({
        name: values.name,
        language: values.language,
        role: values.role
      });
      
      if (result) {
        toast({
          title: "Profil gespeichert",
          description: "Ihre Änderungen wurden erfolgreich gespeichert.",
        });
        navigate('/company-profile');
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

  const languageOptions = [
    { value: 'de', label: 'Deutsch' },
    { value: 'en', label: 'English' }
  ];

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

                  <Controller
                    name="language"
                    control={control}
                    render={({ field }) => (
                      <SelectField
                        label="Sprache"
                        value={field.value}
                        onChange={field.onChange}
                        options={languageOptions}
                        description="Wählen Sie Ihre bevorzugte Sprache für die Benutzeroberfläche"
                        error={errors.language?.message}
                        required
                      />
                    )}
                  />
                </ProfileSection>
              </Card>

            {/* Settings Card */}
            <Card className="p-6">
              <ProfileSection
                title="Benachrichtigungseinstellungen"
                description="Verwalten Sie Ihre Benachrichtigungspräferenzen"
              >
                <div className="space-y-4">
                  {/* Dark Mode Setting */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="dark-mode" className="text-base font-medium">
                        Dark Mode
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Dunkles Design für bessere Sichtbarkeit
                      </p>
                    </div>
                    <Switch id="dark-mode" />
                  </div>

                  {/* Email Notifications */}
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

                  {/* Push Notifications */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="push-notifications" className="text-base font-medium">
                        Push Benachrichtigungen
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Browser-Benachrichtigungen für wichtige Updates
                      </p>
                    </div>
                    <Switch id="push-notifications" defaultChecked={false} />
                  </div>
                </div>
              </ProfileSection>
            </Card>
          </div>
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
                    type="submit"
                    disabled={!isDirty || isSubmitting}
                    variant="default"
                    className="w-full"
                    size="sm"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent" />
                        Speichern...
                      </>
                    ) : (
                      <>
                        <Building className="w-4 h-4 mr-2" />
                        Zum Firmenprofil
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </form>
      </ProfileContent>
    </ProfileLayout>
  );
};