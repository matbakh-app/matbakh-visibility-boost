import React, { useState } from 'react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem } from './ui/command';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { cn } from './ui/utils';
import { useI18n, Language } from '../contexts/i18nContext';

const languages = [
  {
    value: 'de' as Language,
    label: 'Deutsch',
    flag: '🇩🇪',
    code: 'DE'
  },
  {
    value: 'en' as Language,
    label: 'English',
    flag: '🇺🇸',
    code: 'EN'
  }
];

interface LanguageSwitchProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export function LanguageSwitch({ variant = 'default', className }: LanguageSwitchProps) {
  const { language, setLanguage } = useI18n();
  const [open, setOpen] = useState(false);
  
  const currentLanguage = languages.find(lang => lang.value === language);

  if (variant === 'compact') {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-auto h-9 px-3 font-medium",
              "hover:bg-muted/50 transition-colors",
              className
            )}
            aria-expanded={open}
          >
            <Globe className="h-4 w-4 mr-2" />
            <span className="min-w-6">{currentLanguage?.code}</span>
            <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-0" align="end">
          <Command>
            <CommandEmpty>No language found.</CommandEmpty>
            <CommandGroup>
              {languages.map((lang) => (
                <CommandItem
                  key={lang.value}
                  value={lang.value}
                  onSelect={() => {
                    setLanguage(lang.value);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <span className="mr-3 text-base">{lang.flag}</span>
                  <span className="flex-1">{lang.label}</span>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      language === lang.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-auto justify-between min-w-32",
            "hover:bg-muted/50 transition-colors",
            className
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">{currentLanguage?.flag}</span>
            <span className="font-medium">{currentLanguage?.label}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="end">
        <Command>
          <CommandEmpty>No language found.</CommandEmpty>
          <CommandGroup>
            {languages.map((lang) => (
              <CommandItem
                key={lang.value}
                value={lang.value}
                onSelect={() => {
                  setLanguage(lang.value);
                  setOpen(false);
                }}
                className="cursor-pointer"
              >
                <span className="mr-3 text-base">{lang.flag}</span>
                <div className="flex flex-col">
                  <span className="font-medium">{lang.label}</span>
                  <span className="text-xs text-muted-foreground">{lang.code}</span>
                </div>
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    language === lang.value ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}