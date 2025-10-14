/**
 * Persona Adaptive UI Components
 * 
 * These components automatically adapt their behavior and appearance
 * based on the detected user persona, following the psychology and
 * AIDA framework integration from the Advanced Persona System.
 */

import React, { ReactNode } from 'react';
import { usePersona } from '@/contexts/PersonaContext';
import { PersonaType } from '@/types/persona';
import { Clock, Shield, TrendingUp, Building2 } from 'lucide-react';

interface AdaptiveContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Adaptive Container that adjusts layout based on persona
 */
export function AdaptiveContainer({ children, className = '' }: AdaptiveContainerProps) {
  const { currentPersona, getPersonaPreferences } = usePersona();
  const preferences = getPersonaPreferences();

  // Persona-specific styling
  const getContainerStyles = () => {
    switch (currentPersona) {
      case 'Solo-Sarah':
        return 'max-w-md mx-auto space-y-4'; // Compact, mobile-first
      case 'Bewahrer-Ben':
        return 'max-w-2xl mx-auto space-y-6'; // Spacious, comfortable
      case 'Wachstums-Walter':
        return 'max-w-4xl mx-auto space-y-5'; // Wide, data-focused
      case 'Ketten-Katrin':
        return 'max-w-6xl mx-auto space-y-4'; // Full-width, enterprise
      default:
        return 'max-w-3xl mx-auto space-y-5';
    }
  };

  return (
    <div className={`adaptive-container ${getContainerStyles()} ${className}`}>
      {children}
    </div>
  );
}

interface AdaptiveButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Adaptive Button that changes style and behavior based on persona
 */
export function AdaptiveButton({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  className = '' 
}: AdaptiveButtonProps) {
  const { currentPersona, getPersonaPreferences } = usePersona();
  const preferences = getPersonaPreferences();

  // Persona-specific button styling
  const getButtonStyles = () => {
    const baseStyles = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2';
    
    // Size variations
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    // Persona-specific adaptations
    const personaStyles = {
      'Solo-Sarah': {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
        secondary: 'bg-blue-100 hover:bg-blue-200 text-blue-800 focus:ring-blue-500',
        outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
      },
      'Bewahrer-Ben': {
        primary: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
        secondary: 'bg-green-100 hover:bg-green-200 text-green-800 focus:ring-green-500',
        outline: 'border-2 border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-500',
      },
      'Wachstums-Walter': {
        primary: 'bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500',
        secondary: 'bg-purple-100 hover:bg-purple-200 text-purple-800 focus:ring-purple-500',
        outline: 'border-2 border-purple-600 text-purple-600 hover:bg-purple-50 focus:ring-purple-500',
      },
      'Ketten-Katrin': {
        primary: 'bg-orange-600 hover:bg-orange-700 text-white focus:ring-orange-500',
        secondary: 'bg-orange-100 hover:bg-orange-200 text-orange-800 focus:ring-orange-500',
        outline: 'border-2 border-orange-600 text-orange-600 hover:bg-orange-50 focus:ring-orange-500',
      },
    };

    return `${baseStyles} ${sizeStyles[size]} ${personaStyles[currentPersona][variant]}`;
  };

  return (
    <button
      onClick={onClick}
      className={`adaptive-button ${getButtonStyles()} ${className}`}
    >
      {children}
    </button>
  );
}

interface AdaptiveContentProps {
  shortVersion: ReactNode;
  mediumVersion?: ReactNode;
  longVersion?: ReactNode;
  className?: string;
}

/**
 * Adaptive Content that shows different versions based on persona preferences
 */
export function AdaptiveContent({ 
  shortVersion, 
  mediumVersion, 
  longVersion, 
  className = '' 
}: AdaptiveContentProps) {
  const { getPersonaConfig } = usePersona();
  const config = getPersonaConfig();

  const getContent = () => {
    switch (config.uiPreferences.contentLength) {
      case 'short':
        return shortVersion;
      case 'medium':
        return mediumVersion || shortVersion;
      case 'long':
        return longVersion || mediumVersion || shortVersion;
      default:
        return shortVersion;
    }
  };

  return (
    <div className={`adaptive-content ${className}`}>
      {getContent()}
    </div>
  );
}

interface PersonaHeaderProps {
  title: string;
  subtitle?: string;
  showPersonaIndicator?: boolean;
  className?: string;
}

/**
 * Persona-aware header with appropriate messaging
 */
export function PersonaHeader({ 
  title, 
  subtitle, 
  showPersonaIndicator = true, 
  className = '' 
}: PersonaHeaderProps) {
  const { currentPersona, getPersonaConfig } = usePersona();
  const config = getPersonaConfig();

  // Persona-specific icons
  const personaIcons = {
    'Solo-Sarah': <Clock className="h-5 w-5" />,
    'Bewahrer-Ben': <Shield className="h-5 w-5" />,
    'Wachstums-Walter': <TrendingUp className="h-5 w-5" />,
    'Ketten-Katrin': <Building2 className="h-5 w-5" />,
  };

  // Persona-specific greeting
  const getPersonaGreeting = () => {
    switch (currentPersona) {
      case 'Solo-Sarah':
        return 'Quick insights for busy owners';
      case 'Bewahrer-Ben':
        return 'Secure and trusted solutions';
      case 'Wachstums-Walter':
        return 'Growth-focused analytics';
      case 'Ketten-Katrin':
        return 'Enterprise-grade management';
      default:
        return 'Personalized for your needs';
    }
  };

  return (
    <div className={`persona-header ${className}`}>
      <div className="flex items-center space-x-3 mb-2">
        {showPersonaIndicator && (
          <div className="flex items-center space-x-2 text-gray-600">
            {personaIcons[currentPersona]}
            <span className="text-sm font-medium">{config.name}</span>
          </div>
        )}
      </div>
      
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {title}
      </h1>
      
      {subtitle && (
        <p className="text-gray-600 mb-2">
          {subtitle}
        </p>
      )}
      
      <p className="text-sm text-gray-500">
        {getPersonaGreeting()}
      </p>
    </div>
  );
}

interface AdaptiveCardProps {
  title: string;
  children: ReactNode;
  priority?: 'low' | 'medium' | 'high';
  className?: string;
}

/**
 * Adaptive Card that adjusts styling based on persona and priority
 */
export function AdaptiveCard({ 
  title, 
  children, 
  priority = 'medium', 
  className = '' 
}: AdaptiveCardProps) {
  const { currentPersona, getPersonaPreferences } = usePersona();
  const preferences = getPersonaPreferences();

  // Persona-specific card styling
  const getCardStyles = () => {
    const baseStyles = 'bg-white rounded-lg shadow-sm border p-6';
    
    // Priority-based styling
    const priorityStyles = {
      low: 'border-gray-200',
      medium: 'border-gray-300',
      high: 'border-2 border-blue-300 shadow-md',
    };

    // Persona-specific adaptations
    const personaStyles = {
      'Solo-Sarah': 'hover:shadow-md transition-shadow duration-200',
      'Bewahrer-Ben': 'border-l-4 border-l-green-500',
      'Wachstums-Walter': 'hover:border-purple-300 transition-colors duration-200',
      'Ketten-Katrin': 'shadow-md border-gray-400',
    };

    return `${baseStyles} ${priorityStyles[priority]} ${personaStyles[currentPersona]}`;
  };

  return (
    <div className={`adaptive-card ${getCardStyles()} ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

/**
 * Persona-specific loading states
 */
export function AdaptiveLoadingState({ message = 'Loading...' }: { message?: string }) {
  const { currentPersona } = usePersona();

  const getLoadingMessage = () => {
    switch (currentPersona) {
      case 'Solo-Sarah':
        return 'Getting your quick insights...';
      case 'Bewahrer-Ben':
        return 'Securely processing your data...';
      case 'Wachstums-Walter':
        return 'Analyzing growth opportunities...';
      case 'Ketten-Katrin':
        return 'Processing enterprise data...';
      default:
        return message;
    }
  };

  return (
    <div className="adaptive-loading flex items-center justify-center p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{getLoadingMessage()}</p>
      </div>
    </div>
  );
}