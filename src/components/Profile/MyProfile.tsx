import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { useProfile } from '@/hooks/useProfile';
import { 
  User, 
  Mail, 
  Calendar, 
  Clock, 
  Building, 
  ArrowRight,
  Bell,
  ChevronRight
} from 'lucide-react';

interface MyProfileProps {
  onNavigateToCompanyProfile?: () => void;
  onBack?: () => void;
}

export const MyProfile: React.FC<MyProfileProps> = ({ 
  onNavigateToCompanyProfile, 
  onBack 
}) => {
  const navigate = useNavigate();
  const { data, isLoading, isError, save } = useProfile();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: ''
  });

  useEffect(() => {
    if (data) {
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone: data.phone || '',
        role: data.role || ''
      });
    }
  }, [data]);

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorBanner message="Profil konnte nicht geladen werden" />;

  const handleSave = async () => {
    const success = await save(formData);
    if (success) {
      navigate('/company-profile');
    }
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const userData = {
    name: `${formData.first_name} ${formData.last_name}`.trim() || "Max Mustermann",
    email: formData.email || "max.mustermann@restaurant.de",
    role: formData.role || "Restaurant Manager",
    avatar: "",
    dateJoined: "15. März 2024",
    lastLogin: "Heute, 14:30"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={handleBack}>
                <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                Zurück zum Dashboard
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold">Mein Profil</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* User Info Card */}
          <Card className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Benutzer-Informationen</h2>
              <div className="flex gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                  Aktiv
                </Badge>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                  Verifiziert
                </Badge>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center">
                <Avatar className="w-32 h-32 mb-4">
                  <AvatarImage src={userData.avatar} alt={userData.name} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {userData.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm">
                  Profil bearbeiten
                </Button>
              </div>

              {/* User Details */}
              <div className="flex-1 space-y-4 text-center md:text-left">
                <div>
                  <h3 className="text-2xl font-bold mb-1">{userData.name}</h3>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground mb-2">
                    <Mail className="w-4 h-4" />
                    <span>{userData.email}</span>
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                    <Building className="w-4 h-4" />
                    <span>{userData.role}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-primary" />
                    <div>
                      <div className="font-medium">Beigetreten am</div>
                      <div className="text-muted-foreground">{userData.dateJoined}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-green-600" />
                    <div>
                      <div className="font-medium">Letzter Login</div>
                      <div className="text-muted-foreground">{userData.lastLogin}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Preferences Card */}
          <Card className="p-8">
            <h2 className="text-xl font-semibold mb-6">Einstellungen</h2>
            
            <div className="space-y-6">
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

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Benachrichtigungen
                </h3>
                
                <div className="space-y-4">
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
              </div>
            </div>
          </Card>

          {/* Company Profile Navigation Card */}
          <Card className="p-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">Firmenprofil verwalten</h3>
                  <p className="text-muted-foreground mb-4">
                    Unternehmensdetails, Logo und Wettbewerber-Tracking
                  </p>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleSave}
              className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
              size="lg"
            >
              <Building className="w-4 h-4 mr-2" />
              Zum Firmenprofil
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};