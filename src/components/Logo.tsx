
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
    hero: 'h-96 w-auto md:h-120 lg:h-144'
  };

  return (
    <img
      src="/lovable-uploads/686a6e80-4e5c-437b-9ac7-fc0267935fa4.png"
      alt="Matbakh Logo"
      className={`${sizeClasses[size]} ${className}`}
    />
  );
};

export default Logo;
