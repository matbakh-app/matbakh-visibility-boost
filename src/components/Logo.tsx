
import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-8 w-auto',
    md: 'h-10 w-auto',
    lg: 'h-12 w-auto'
  };

  return (
    <img
      src="/lovable-uploads/b4e594ac-85de-4f6c-994d-a5277cc31b74.png"
      alt="Matbakh Logo"
      className={`${sizeClasses[size]} ${className}`}
    />
  );
};

export default Logo;
