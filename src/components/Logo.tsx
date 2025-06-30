
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
      src="/lovable-uploads/da9d7af8-2a96-47b8-9e1f-836c8590d73b.png"
      alt="Matbakh Logo"
      className={`${sizeClasses[size]} ${className}`}
    />
  );
};

export default Logo;
