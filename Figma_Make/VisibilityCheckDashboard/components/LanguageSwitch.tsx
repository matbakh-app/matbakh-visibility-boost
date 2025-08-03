import React from 'react';
import { useLanguage, Language } from '../hooks/useLanguage';
import { Button } from './ui/button';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const LanguageSwitch: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: 'de' as Language, name: 'Deutsch', flag: '🇩🇪' },
    { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="touch-target flex items-center gap-2 hover:bg-accent/80 transition-colors duration-200"
          aria-label={language === 'de' ? 'Sprache wechseln' : 'Switch language'}
        >
          <Globe className="icon-sm" />
          <span className="hidden md:inline-flex items-center gap-1">
            <span className="text-sm">{currentLanguage?.flag}</span>
            <span className="text-sm font-medium">{currentLanguage?.code.toUpperCase()}</span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-40">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`flex items-center gap-3 cursor-pointer touch-target ${
              language === lang.code ? 'bg-accent text-accent-foreground' : ''
            }`}
          >
            <span className="text-base">{lang.flag}</span>
            <span className="body-md">{lang.name}</span>
            {language === lang.code && (
              <span className="ml-auto w-2 h-2 bg-primary rounded-full"></span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitch;