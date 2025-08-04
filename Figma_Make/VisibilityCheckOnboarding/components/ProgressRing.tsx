import React, { useEffect, useState } from 'react';

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  thickness?: number;
  color?: 'primary' | 'success' | 'warning' | 'error';
  showValue?: boolean;
  label?: string;
  animated?: boolean;
}

export function ProgressRing({ 
  value, 
  max = 100, 
  size = 'md', 
  thickness = 8, 
  color = 'primary',
  showValue = true,
  label,
  animated = true 
}: ProgressRingProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  const sizes = {
    sm: 64,
    md: 96,
    lg: 128,
    xl: 160
  };

  const radius = (sizes[size] - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(Math.max(value, 0), max) / max;
  const offset = circumference - (animatedValue / max) * circumference;

  const getColor = () => {
    switch (color) {
      case 'success':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'error':
        return '#EF4444';
      default:
        return '#4F46E5';
    }
  };

  const getTextColor = () => {
    if (color === 'success' && percentage >= 0.8) return 'text-success';
    if (color === 'warning' && percentage >= 0.6 && percentage < 0.8) return 'text-warning';
    if (color === 'error' && percentage < 0.6) return 'text-error';
    return 'text-primary';
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'md':
        return 'text-lg';
      case 'lg':
        return 'text-2xl';
      case 'xl':
        return 'text-3xl';
      default:
        return 'text-lg';
    }
  };

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setAnimatedValue(value);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedValue(value);
    }
  }, [value, animated]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={sizes[size]}
        height={sizes[size]}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={sizes[size] / 2}
          cy={sizes[size] / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={thickness}
        />
        
        {/* Progress circle */}
        <circle
          cx={sizes[size] / 2}
          cy={sizes[size] / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={thickness}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={animated ? "transition-all duration-1000 ease-out" : ""}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showValue && (
          <span className={`font-bold ${getFontSize()} ${getTextColor()}`}>
            {Math.round(animatedValue)}%
          </span>
        )}
        {label && (
          <span className="text-xs text-muted-foreground mt-1 text-center max-w-16">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

interface ScoreCardProps {
  title: string;
  score: number;
  maxScore?: number;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreCard({ 
  title, 
  score, 
  maxScore = 100, 
  description, 
  trend = 'neutral',
  trendValue,
  size = 'md' 
}: ScoreCardProps) {
  const getScoreColor = () => {
    const percentage = score / maxScore;
    if (percentage >= 0.8) return 'success';
    if (percentage >= 0.6) return 'warning';
    return 'error';
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '↗️';
      case 'down':
        return '↘️';
      default:
        return '→';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-error';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-start gap-6">
        <ProgressRing 
          value={score} 
          max={maxScore} 
          size={size} 
          color={getScoreColor()}
          animated={true}
        />
        
        <div className="flex-1">
          <h3 className="font-semibold text-card-foreground mb-2">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mb-3">{description}</p>
          )}
          
          {trendValue !== undefined && (
            <div className={`flex items-center gap-2 text-sm ${getTrendColor()}`}>
              <span>{getTrendIcon()}</span>
              <span>
                {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}{Math.abs(trendValue)}% 
                <span className="text-muted-foreground ml-1">seit letztem Monat</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface MultiScoreCardProps {
  title: string;
  scores: {
    label: string;
    value: number;
    color?: 'primary' | 'success' | 'warning' | 'error';
  }[];
  description?: string;
}

export function MultiScoreCard({ title, scores, description }: MultiScoreCardProps) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h3 className="font-semibold text-card-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        {scores.map((score, index) => (
          <div key={index} className="flex flex-col items-center">
            <ProgressRing 
              value={score.value} 
              size="sm" 
              color={score.color || 'primary'}
              label={score.label}
              animated={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
}