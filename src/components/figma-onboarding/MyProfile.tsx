import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LanguageSwitch } from './LanguageSwitch';
import { ThemeToggle } from './ThemeToggle';
import { 
  User, 
  Mail, 
  Calendar, 
  Clock, 
  Building, 
  ArrowRight,
  Bell,
  Settings,
  ChevronRight
} from 'lucide-react';
import { useI18n } from '@/contexts/i18nContext';

interface MyProfileProps {
  onNavigateToCompanyProfile: () => void;
  onBack: () => void;
}

export function MyProfile({ onNavigateToCompanyProfile, onBack }: MyProfileProps) {
  const { language } = useI18n();

  // Mock user data - in real app this would come from props or context
  const userData = {
    name: "Max Mustermann",
    email: "max.mustermann@restaurant.de",
    role: "Restaurant Manager",
    avatar: "", // Empty for placeholder
    dateJoined: "15. März 2024",
    lastLogin: "Heute, 14:30"
  };

  const texts = {
    de: {
      headerTitle: "Mein Profil",
      backToDashboard: "Zurück zum Dashboard",
      
      // User Info Section
      userInfoTitle: "Benutzer-Informationen",
      role: "Position",
      dateJoined: "Beigetreten am",
      lastLogin: "Letzter Login",
      editProfile: "Profil bearbeiten",
      
      // Preferences Section  
      preferencesTitle: "Einstellungen",
      darkModeLabel: "Dark Mode",
      darkModeDesc: "Dunkles Design für bessere Sichtbarkeit",
      languageLabel: "Sprache",
      languageDesc: "Interface-Sprache auswählen",
      notificationsTitle: "Benachrichtigungen",
      emailNotificationsLabel: "E-Mail Benachrichtigungen",
      emailNotificationsDesc: "Erhalte Updates über neue Analysen und Features",
      pushNotificationsLabel: "Push Benachrichtigungen", 
      pushNotificationsDesc: "Browser-Benachrichtigungen für wichtige Updates",
      
      // Navigation Section
      navigationTitle: "Unternehmensprofil",
      companyProfileLabel: "Firmenprofil verwalten",
      companyProfileDesc: "Unternehmensdetails, Logo und Wettbewerber-Tracking",
      goToCompanyProfile: "Zum Firmenprofil",
      
      // Status Badges
      activeStatus: "Aktiv",
      verifiedStatus: "Verifiziert"
    },
    en: {
      headerTitle: "My Profile",
      backToDashboard: "Back to Dashboard",
      
      // User Info Section
      userInfoTitle: "User Information", 
      role: "Role",
      dateJoined: "Date Joined",
      lastLogin: "Last Login",
      editProfile: "Edit Profile",
      
      // Preferences Section
      preferencesTitle: "Preferences",
      darkModeLabel: "Dark Mode",
      darkModeDesc: "Dark design for better visibility",
      languageLabel: "Language",
      languageDesc: "Select interface language",
      notificationsTitle: "Notifications",
      emailNotificationsLabel: "Email Notifications",
      emailNotificationsDesc: "Receive updates about new analyses and features",
      pushNotificationsLabel: "Push Notifications",
      pushNotificationsDesc: "Browser notifications for important updates",
      
      // Navigation Section
      navigationTitle: "Company Profile",
      companyProfileLabel: "Manage Company Profile",
      companyProfileDesc: "Company details, logo and competitor tracking",
      goToCompanyProfile: "Go to Company Profile",
      
      // Status Badges
      activeStatus: "Active",
      verifiedStatus: "Verified"
    }
  };

  const t = texts[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5 theme-transition">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10 theme-transition">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack} className="btn-hover-enhanced">
                <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                {t.backToDashboard}
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold">{t.headerTitle}</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <LanguageSwitch variant="compact" />
              <ThemeToggle variant="icon-only" size="sm" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* User Info Card */}
          <Card className="p-8 card-dark-enhanced">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">{t.userInfoTitle}</h2>
              <div className="flex gap-2">
                <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                  {t.activeStatus}
                </Badge>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  {t.verifiedStatus}
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
                <Button variant="outline" size="sm" className="btn-hover-enhanced">
                  {t.editProfile}
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
                      <div className="font-medium">{t.dateJoined}</div>
                      <div className="text-muted-foreground">{userData.dateJoined}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-success" />
                    <div>
                      <div className="font-medium">{t.lastLogin}</div>
                      <div className="text-muted-foreground">{userData.lastLogin}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Preferences Card */}
          <Card className="p-8 card-dark-enhanced">
            <h2 className="text-xl font-semibold mb-6">{t.preferencesTitle}</h2>
            
            <div className="space-y-6">
              {/* Dark Mode Setting */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="dark-mode" className="text-base font-medium">
                    {t.darkModeLabel}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t.darkModeDesc}
                  </p>
                </div>
                <ThemeToggle variant="icon-only" />
              </div>

              {/* Language Setting */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">
                    {t.languageLabel}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t.languageDesc}
                  </p>
                </div>
                <LanguageSwitch variant="compact" />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  {t.notificationsTitle}
                </h3>
                
                <div className="space-y-4">
                  {/* Email Notifications */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="email-notifications" className="text-base font-medium">
                        {t.emailNotificationsLabel}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {t.emailNotificationsDesc}
                      </p>
                    </div>
                    <Switch id="email-notifications" defaultChecked />
                  </div>

                  {/* Push Notifications */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="push-notifications" className="text-base font-medium">
                        {t.pushNotificationsLabel}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {t.pushNotificationsDesc}
                      </p>
                    </div>
                    <Switch id="push-notifications" defaultChecked={false} />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Company Profile Navigation Card */}
          <Card className="p-8 card-dark-enhanced border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-success/5">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">{t.companyProfileLabel}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t.companyProfileDesc}
                  </p>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={onNavigateToCompanyProfile}
              className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground btn-hover-enhanced"
              size="lg"
            >
              <Building className="w-4 h-4 mr-2" />
              {t.goToCompanyProfile}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}