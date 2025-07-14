
import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-8 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-16 w-auto',
    xl: 'h-20 w-auto',
    hero: 'h-48 w-auto md:h-60 lg:h-72'
  };

  return (
    <img
      src="/lovable-uploads/ae05f535-e3d9-4e92-bee2-510cdb845f90.png"
      alt="Matbakh Logo"
      className={`${sizeClasses[size]} ${className}`}
    />
  );
};

export default Logo;
