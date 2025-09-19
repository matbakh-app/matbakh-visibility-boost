import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuItem 
} from '@/components/ui/dropdown-menu';
import { useLanguage, Language } from '@/hooks/useLanguage';

interface LanguageSwitchProps {
  variant?: 'button' | 'dropdown' | 'toggle' | 'compact';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showFlag?: boolean;
  disabled?: boolean;
  className?: string;
}

const LanguageSwitch: React.FC<LanguageSwitchProps> = ({
  variant = 'dropdown',
  size = 'md',
  showLabel = false,
  showFlag = true,
  disabled = false,
  className = ''
}) => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  // Language configuration with comprehensive data
  const languages = {
    de: {
      code: 'de',
      name: 'Deutsch',
      nativeName: 'Deutsch',
      flag: '🇩🇪',
      region: 'Deutschland',
      direction: 'ltr'
    },
    en: {
      code: 'en', 
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸',
      region: 'United States',
      direction: 'ltr'
    }
  } as const;

  const currentLang = languages[language];
  const otherLang = languages[language === 'de' ? 'en' : 'de'];

  // Size variants using design system tokens
  const sizeClasses = {
    sm: 'h-8 text-xs px-2',
    md: 'h-10 text-sm px-3',
    lg: 'h-12 text-base px-4'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5', 
    lg: 'w-6 h-6'
  };

  // Accessibility labels
  const getAriaLabel = () => {
    if (language === 'de') {
      return variant === 'toggle' 
        ? `Zu ${otherLang.name} wechseln`
        : 'Sprache auswählen';
    } else {
      return variant === 'toggle'
        ? `Switch to ${otherLang.name}`
        : 'Select language';
    }
  };

  // Toggle between languages (for toggle variant)
  const toggleLanguage = () => {
    if (disabled) return;
    const newLang = language === 'de' ? 'en' : 'de';
    setLanguage(newLang);
  };

  // Switch to specific language
  const switchToLanguage = (newLang: Language) => {
    if (disabled) return;
    setLanguage(newLang);
    setIsOpen(false);
  };

  // Variant implementations
  switch (variant) {
    case 'toggle':
      return (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLanguage}
          disabled={disabled}
          className={`
            language-toggle
            ${sizeClasses[size]}
            relative overflow-hidden
            transition-all duration-200 ease-in-out
            hover:scale-105 active:scale-95
            focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${className}
          `}
          aria-label={getAriaLabel()}
          title={language === 'de' ? `Zu ${otherLang.name} wechseln` : `Switch to ${otherLang.name}`}
        >
          {/* Background transition effect */}
          <div 
            className={`
              absolute inset-0 transition-all duration-300 ease-in-out
              ${language === 'de' 
                ? 'bg-gradient-to-br from-red-50 to-yellow-50' 
                : 'bg-gradient-to-br from-blue-50 to-red-50'
              }
              opacity-20 rounded-md
            `}
          />
          
          {/* Current language flag/indicator */}
          <div className={`
            ${iconSizes[size]}
            transition-all duration-200 ease-in-out
            flex items-center justify-center
            relative z-10
          `}>
            {showFlag ? (
              <span className="text-base">{currentLang.flag}</span>
            ) : (
              <span className="font-medium text-foreground">
                {currentLang.code.toUpperCase()}
              </span>
            )}
          </div>
          
          {/* Ripple effect on click */}
          <div className="absolute inset-0 rounded-md overflow-hidden">
            <div 
              className={`
                absolute inset-0 bg-white dark:bg-slate-200
                rounded-full scale-0 opacity-0
                transition-all duration-200 ease-out
                ${!disabled ? 'active:scale-150 active:opacity-20' : ''}
              `}
            />
          </div>
        </Button>
      );

    case 'button':
      return (
        <div className="flex items-center gap-2">
          {Object.values(languages).map((lang) => (
            <Button
              key={lang.code}
        variant={language === lang.code ? "default" : "ghost"}
        size={size === 'md' ? 'default' : size}
              onClick={() => switchToLanguage(lang.code as Language)}
              disabled={disabled}
              className={`
                ${sizeClasses[size]}
                transition-all duration-200 ease-in-out
                ${language === lang.code ? 'ring-2 ring-primary ring-offset-2' : ''}
                touch-target
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${className}
              `}
              aria-label={language === 'de' ? `Zu ${lang.name} wechseln` : `Switch to ${lang.name}`}
            >
              {showFlag && <span className="mr-2">{lang.flag}</span>}
              <span className="font-medium">
                {showLabel ? lang.name : lang.code.toUpperCase()}
              </span>
              {language === lang.code && (
                <Check className="w-3 h-3 ml-1" />
              )}
            </Button>
          ))}
        </div>
      );

    case 'compact':
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLanguage}
          disabled={disabled}
          className={`
            ${sizeClasses[size]}
            px-2 gap-1
            transition-all duration-200 ease-in-out
            hover:bg-accent
            touch-target
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${className}
          `}
          aria-label={getAriaLabel()}
          title={currentLang.name}
        >
          {showFlag && <span>{currentLang.flag}</span>}
          <span className="font-medium text-foreground">
            {currentLang.code.toUpperCase()}
          </span>
        </Button>
      );

    default: // dropdown
      return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled}
              className={`
                language-dropdown-trigger
                ${sizeClasses[size]}
                gap-2
                transition-all duration-200 ease-in-out
                hover:bg-accent
                data-[state=open]:bg-accent
                touch-target
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${className}
              `}
              aria-label={getAriaLabel()}
              aria-expanded={isOpen}
              aria-haspopup="menu"
            >
              <Globe className={iconSizes[size]} />
              
              {showFlag && (
                <span className="hidden md:inline">{currentLang.flag}</span>
              )}
              
              <span className="font-medium text-foreground hidden md:inline">
                {showLabel ? currentLang.name : currentLang.code.toUpperCase()}
              </span>
              
              <ChevronDown 
                className={`
                  w-3 h-3 
                  transition-transform duration-200
                  ${isOpen ? 'rotate-180' : 'rotate-0'}
                `} 
              />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-48" sideOffset={4}>
            {Object.values(languages).map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => switchToLanguage(lang.code as Language)}
                className={`
                  flex items-center gap-3 p-3 cursor-pointer
                  transition-all duration-150 ease-in-out
                  hover:bg-accent
                  touch-target
                  ${language === lang.code ? 'bg-accent/50' : ''}
                `}
                role="menuitem"
                aria-current={language === lang.code ? 'true' : 'false'}
              >
                <span className="text-lg" role="img" aria-label={`${lang.region} flag`}>
                  {lang.flag}
                </span>
                <div className="flex flex-col flex-1">
                  <span className="text-sm font-medium text-foreground">
                    {lang.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {lang.region}
                  </span>
                </div>
                {language === lang.code && (
                  <Check className="w-4 h-4 text-primary" aria-hidden="true" />
                )}
              </DropdownMenuItem>
            ))}
            
            {/* Optional: Add keyboard shortcut hint */}
            <div className="px-3 py-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {language === 'de' 
                  ? 'Tastenkürzel: Alt + L'
                  : 'Shortcut: Alt + L'
                }
              </p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      );
  }
};

export default LanguageSwitch;