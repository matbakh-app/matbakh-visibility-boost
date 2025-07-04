
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardCardProps {
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
  error?: string | null;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ 
  title, 
  children, 
  isLoading = false, 
  error = null 
}) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex items-center justify-center h-32 text-red-500">
            <p>Fehler: {error}</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardCard;
