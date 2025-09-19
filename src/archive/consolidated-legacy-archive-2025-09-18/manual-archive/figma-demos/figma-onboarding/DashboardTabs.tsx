import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart2, 
  Zap, 
  Calendar, 
  FileText, 
  Settings
} from 'lucide-react';

interface DashboardTabsProps {
  isAdmin: boolean;
}

export function DashboardTabs({ isAdmin }: DashboardTabsProps) {
  return (
    <TabsList className="grid w-full grid-cols-5 mb-6">
      <TabsTrigger value="dashboard" className="flex items-center gap-2">
        <BarChart2 className="w-4 h-4" />
        Overview
      </TabsTrigger>
      
      <TabsTrigger value="analytics" className="flex items-center gap-2">
        <Zap className="w-4 h-4" />
        Analysis
      </TabsTrigger>
      
      <TabsTrigger value="scheduling" className="flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        Scheduling
      </TabsTrigger>
      
      <TabsTrigger value="results" className="flex items-center gap-2">
        <FileText className="w-4 h-4" />
        Results
      </TabsTrigger>
      
      <TabsTrigger value="settings" className="flex items-center gap-2">
        <Settings className="w-4 h-4" />
        Settings
      </TabsTrigger>
    </TabsList>
  );
}