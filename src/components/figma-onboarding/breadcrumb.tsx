import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  isActive?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center space-x-2 text-sm ${className}`}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          )}
          
          {item.onClick || item.href ? (
            <button
              onClick={item.onClick}
              className={`transition-colors hover:text-primary ${
                item.isActive 
                  ? 'text-primary font-medium' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              type="button"
            >
              {index === 0 && (
                <Home className="w-4 h-4 mr-1 inline-block" />
              )}
              {item.label}
            </button>
          ) : (
            <span className={`${
              item.isActive 
                ? 'text-primary font-medium' 
                : 'text-muted-foreground'
            }`}>
              {index === 0 && (
                <Home className="w-4 h-4 mr-1 inline-block" />
              )}
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}