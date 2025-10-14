/**
 * Dashboard Hook
 * Provides dashboard management functionality
 */
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Dashboard {
  id: string;
  name: string;
  description: string;
  type: string;
  layout: any;
  widgets: any[];
  filters: any[];
  permissions: any;
  settings: any;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  dashboard: any;
  preview: string;
  popularity: number;
  rating: number;
}

interface DashboardShare {
  id: string;
  dashboardId: string;
  shareType: 'public' | 'private' | 'embed';
  permissions: any;
  expiresAt?: string;
  accessCount: number;
  lastAccessed?: string;
  createdBy: string;
  createdAt: string;
}

interface DashboardAnalytics {
  dashboardId: string;
  views: number;
  uniqueUsers: number;
  avgSessionDuration: number;
  bounceRate: number;
  popularWidgets: any[];
  performanceMetrics: any;
  userInteractions: any[];
}

const API_BASE = process.env.VITE_DASHBOARD_API_BASE || 'https://api.matbakh.app/dashboard';

class DashboardAPI {
  private async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('auth_token');
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async listDashboards(type?: string, limit = 50, lastKey?: string) {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (limit) params.append('limit', limit.toString());
    if (lastKey) params.append('lastKey', lastKey);

    return this.request(`/dashboards?${params.toString()}`);
  }

  async getDashboard(id: string): Promise<Dashboard> {
    return this.request(`/dashboards/${id}`);
  }

  async createDashboard(dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<Dashboard> {
    return this.request('/dashboards', {
      method: 'POST',
      body: JSON.stringify(dashboard),
    });
  }

  async updateDashboard(id: string, updates: Partial<Dashboard>): Promise<Dashboard> {
    return this.request(`/dashboards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteDashboard(id: string): Promise<void> {
    return this.request(`/dashboards/${id}`, {
      method: 'DELETE',
    });
  }

  async cloneDashboard(id: string, name?: string): Promise<Dashboard> {
    return this.request(`/dashboards/${id}/clone`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async shareDashboard(id: string, shareConfig: any): Promise<DashboardShare> {
    return this.request(`/dashboards/${id}/share`, {
      method: 'POST',
      body: JSON.stringify(shareConfig),
    });
  }

  async getDashboardAnalytics(id: string, timeRange?: { start: string; end: string }): Promise<DashboardAnalytics> {
    const params = new URLSearchParams();
    if (timeRange) {
      params.append('start', timeRange.start);
      params.append('end', timeRange.end);
    }

    return this.request(`/dashboards/${id}/analytics?${params.toString()}`);
  }

  async listTemplates(category?: string, limit = 50): Promise<{ templates: DashboardTemplate[] }> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (limit) params.append('limit', limit.toString());

    return this.request(`/dashboards/templates?${params.toString()}`);
  }

  async createFromTemplate(templateId: string, customizations?: any): Promise<Dashboard> {
    return this.request(`/dashboards/templates/${templateId}/create`, {
      method: 'POST',
      body: JSON.stringify(customizations || {}),
    });
  }

  async renderVisualization(widget: any, data: any[], options?: any) {
    return this.request('/visualizations/render', {
      method: 'POST',
      body: JSON.stringify({ widget, data, options }),
    });
  }

  async exportVisualization(widget: any, data: any[], format: string, options?: any) {
    return this.request('/visualizations/export', {
      method: 'POST',
      body: JSON.stringify({ widget, data, format, options }),
    });
  }

  async queryData(dataSource: any) {
    return this.request('/data/query', {
      method: 'POST',
      body: JSON.stringify(dataSource),
    });
  }

  async getDataSources() {
    return this.request('/data/sources');
  }
}

const dashboardAPI = new DashboardAPI();

export const useDashboards = (type?: string, limit = 50) => {
  return useQuery({
    queryKey: ['dashboards', type, limit],
    queryFn: () => dashboardAPI.listDashboards(type, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useDashboard = (id: string | undefined) => {
  return useQuery({
    queryKey: ['dashboard', id],
    queryFn: () => dashboardAPI.getDashboard(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useDashboardTemplates = (category?: string) => {
  return useQuery({
    queryKey: ['dashboard-templates', category],
    queryFn: () => dashboardAPI.listTemplates(category),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useDashboardAnalytics = (id: string | undefined, timeRange?: { start: string; end: string }) => {
  return useQuery({
    queryKey: ['dashboard-analytics', id, timeRange],
    queryFn: () => dashboardAPI.getDashboardAnalytics(id!, timeRange),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useDashboardMutations = () => {
  const queryClient = useQueryClient();

  const createDashboard = useMutation({
    mutationFn: dashboardAPI.createDashboard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
    },
  });

  const updateDashboard = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Dashboard> }) =>
      dashboardAPI.updateDashboard(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
    },
  });

  const deleteDashboard = useMutation({
    mutationFn: dashboardAPI.deleteDashboard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
    },
  });

  const cloneDashboard = useMutation({
    mutationFn: ({ id, name }: { id: string; name?: string }) =>
      dashboardAPI.cloneDashboard(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
    },
  });

  const shareDashboard = useMutation({
    mutationFn: ({ id, shareConfig }: { id: string; shareConfig: any }) =>
      dashboardAPI.shareDashboard(id, shareConfig),
  });

  const createFromTemplate = useMutation({
    mutationFn: ({ templateId, customizations }: { templateId: string; customizations?: any }) =>
      dashboardAPI.createFromTemplate(templateId, customizations),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
    },
  });

  return {
    createDashboard,
    updateDashboard,
    deleteDashboard,
    cloneDashboard,
    shareDashboard,
    createFromTemplate,
  };
};

export const useVisualization = () => {
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const renderVisualization = useCallback(async (widget: any, data: any[], options?: any) => {
    setIsRendering(true);
    setRenderError(null);

    try {
      const result = await dashboardAPI.renderVisualization(widget, data, options);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Rendering failed';
      setRenderError(errorMessage);
      throw error;
    } finally {
      setIsRendering(false);
    }
  }, []);

  const exportVisualization = useCallback(async (widget: any, data: any[], format: string, options?: any) => {
    setIsRendering(true);
    setRenderError(null);

    try {
      const result = await dashboardAPI.exportVisualization(widget, data, format, options);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      setRenderError(errorMessage);
      throw error;
    } finally {
      setIsRendering(false);
    }
  }, []);

  return {
    renderVisualization,
    exportVisualization,
    isRendering,
    renderError,
  };
};

export const useDataQuery = () => {
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  const queryData = useCallback(async (dataSource: any) => {
    setIsQuerying(true);
    setQueryError(null);

    try {
      const result = await dashboardAPI.queryData(dataSource);
      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Query failed';
      setQueryError(errorMessage);
      throw error;
    } finally {
      setIsQuerying(false);
    }
  }, []);

  const getDataSources = useCallback(async () => {
    try {
      const result = await dashboardAPI.getDataSources();
      return result.sources;
    } catch (error) {
      console.error('Failed to get data sources:', error);
      return [];
    }
  }, []);

  return {
    queryData,
    getDataSources,
    isQuerying,
    queryError,
  };
};

export const useDashboardBuilder = (initialDashboard?: Dashboard) => {
  const [dashboard, setDashboard] = useState<Dashboard | null>(initialDashboard || null);
  const [isDirty, setIsDirty] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);

  const { updateDashboard, createDashboard } = useDashboardMutations();

  const updateDashboardData = useCallback((updates: Partial<Dashboard>) => {
    setDashboard(prev => prev ? { ...prev, ...updates } : null);
    setIsDirty(true);
  }, []);

  const addWidget = useCallback((widget: any) => {
    setDashboard(prev => prev ? {
      ...prev,
      widgets: [...prev.widgets, widget],
    } : null);
    setIsDirty(true);
  }, []);

  const updateWidget = useCallback((widgetId: string, updates: any) => {
    setDashboard(prev => prev ? {
      ...prev,
      widgets: prev.widgets.map(w => w.id === widgetId ? { ...w, ...updates } : w),
    } : null);
    setIsDirty(true);
  }, []);

  const removeWidget = useCallback((widgetId: string) => {
    setDashboard(prev => prev ? {
      ...prev,
      widgets: prev.widgets.filter(w => w.id !== widgetId),
    } : null);
    setIsDirty(true);
    
    if (selectedWidget === widgetId) {
      setSelectedWidget(null);
    }
  }, [selectedWidget]);

  const saveDashboard = useCallback(async () => {
    if (!dashboard) return;

    try {
      if (dashboard.id) {
        await updateDashboard.mutateAsync({ id: dashboard.id, updates: dashboard });
      } else {
        const newDashboard = await createDashboard.mutateAsync(dashboard);
        setDashboard(newDashboard);
      }
      setIsDirty(false);
    } catch (error) {
      console.error('Failed to save dashboard:', error);
      throw error;
    }
  }, [dashboard, updateDashboard, createDashboard]);

  return {
    dashboard,
    isDirty,
    selectedWidget,
    setSelectedWidget,
    updateDashboardData,
    addWidget,
    updateWidget,
    removeWidget,
    saveDashboard,
    isSaving: updateDashboard.isPending || createDashboard.isPending,
  };
};