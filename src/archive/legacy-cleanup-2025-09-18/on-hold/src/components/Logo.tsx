
import React, { useState } from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'h-8 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-16 w-auto',
    xl: 'h-20 w-auto',
    hero: 'h-48 w-auto md:h-60 lg:h-72'
  };

  if (imgError) {
    // Fallback-Text anzeigen wenn Logo nicht lädt
    return (
      <div className="flex items-center">
        <span className={`font-bold text-black ${sizeClasses[size].includes('h-8') ? 'text-lg' : 'text-xl'} ${className}`}>
          Matbakh
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <img
        src="/lovable-uploads/cac34de9-55d9-46d4-a2ad-62bc4d429666.png"
        alt="Matbakh - Visibility for Hospitality"
        className={`${sizeClasses[size]} ${className}`}
        onError={(e) => {
          console.error('Logo failed to load:', e);
          setImgError(true);
        }}
        onLoad={() => {
          console.log('Logo loaded successfully');
        }}
        draggable={false}
      />
    </div>
  );
};

export default Logo;
