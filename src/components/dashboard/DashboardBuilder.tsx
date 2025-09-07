/**
 * Dashboard Builder Component
 * Provides drag-and-drop interface for creating and editing dashboards
 */
import React, { useState, useCallback, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Settings, 
  Save, 
  Eye, 
  Grid, 
  BarChart3, 
  LineChart, 
  PieChart, 
  Table, 
  Gauge,
  Map,
  Image,
  Type,
  Trash2,
  Copy,
  Move
} from 'lucide-react';

interface DashboardBuilderProps {
  dashboardId?: string;
  onSave?: (dashboard: any) => void;
  onPreview?: (dashboard: any) => void;
}

interface Widget {
  id: string;
  type: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  dataSource?: any;
  visualization?: any;
}

interface DashboardConfig {
  id?: string;
  name: string;
  description: string;
  type: string;
  layout: {
    columns: number;
    rows: number;
    gridSize: { width: number; height: number };
  };
  widgets: Widget[];
  filters: any[];
  settings: any;
}

const WIDGET_TYPES = [
  { type: 'line_chart', icon: LineChart, label: 'Line Chart', category: 'Charts' },
  { type: 'bar_chart', icon: BarChart3, label: 'Bar Chart', category: 'Charts' },
  { type: 'pie_chart', icon: PieChart, label: 'Pie Chart', category: 'Charts' },
  { type: 'table', icon: Table, label: 'Table', category: 'Data' },
  { type: 'metric_card', icon: Gauge, label: 'Metric Card', category: 'KPIs' },
  { type: 'gauge', icon: Gauge, label: 'Gauge', category: 'KPIs' },
  { type: 'map', icon: Map, label: 'Map', category: 'Geo' },
  { type: 'text', icon: Type, label: 'Text', category: 'Content' },
  { type: 'image', icon: Image, label: 'Image', category: 'Content' },
];

const DASHBOARD_TYPES = [
  { value: 'analytics', label: 'Analytics Dashboard' },
  { value: 'business_intelligence', label: 'Business Intelligence' },
  { value: 'operational', label: 'Operational Dashboard' },
  { value: 'executive', label: 'Executive Summary' },
  { value: 'custom', label: 'Custom Dashboard' },
];

export const DashboardBuilder: React.FC<DashboardBuilderProps> = ({
  dashboardId,
  onSave,
  onPreview,
}) => {
  const [dashboard, setDashboard] = useState<DashboardConfig>({
    name: 'New Dashboard',
    description: '',
    type: 'analytics',
    layout: {
      columns: 12,
      rows: 8,
      gridSize: { width: 100, height: 100 },
    },
    widgets: [],
    filters: [],
    settings: {
      theme: { name: 'default' },
      autoRefresh: false,
      refreshInterval: 300,
    },
  });

  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('design');
  const [draggedWidget, setDraggedWidget] = useState<Widget | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const handleDashboardChange = useCallback((field: string, value: any) => {
    setDashboard(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleLayoutChange = useCallback((field: string, value: any) => {
    setDashboard(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        [field]: value,
      },
    }));
  }, []);

  const addWidget = useCallback((widgetType: string) => {
    const newWidget: Widget = {
      id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: widgetType,
      title: `New ${WIDGET_TYPES.find(w => w.type === widgetType)?.label || 'Widget'}`,
      position: { x: 0, y: 0 },
      size: { width: 4, height: 3 },
      dataSource: {
        id: 'default',
        type: 'static',
        connection: {},
        query: { query: '', parameters: {} },
        cache: { enabled: false, ttl: 300 },
        security: { encryption: false, accessControl: { roles: [], permissions: [] }, auditLogging: false },
      },
      visualization: {
        chartType: widgetType,
        axes: [],
        series: [],
        colors: { scheme: 'categorical', palette: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'] },
        legend: { enabled: true, position: 'bottom' },
        tooltip: { enabled: true },
        animation: { enabled: true, duration: 300 },
        interaction: { zoom: false, pan: false, brush: false, crossfilter: false, drill: { enabled: false, levels: [] } },
        formatting: {},
      },
    };

    setDashboard(prev => ({
      ...prev,
      widgets: [...prev.widgets, newWidget],
    }));

    setSelectedWidget(newWidget.id);
  }, []);

  const updateWidget = useCallback((widgetId: string, updates: Partial<Widget>) => {
    setDashboard(prev => ({
      ...prev,
      widgets: prev.widgets.map(widget =>
        widget.id === widgetId ? { ...widget, ...updates } : widget
      ),
    }));
  }, []);

  const deleteWidget = useCallback((widgetId: string) => {
    setDashboard(prev => ({
      ...prev,
      widgets: prev.widgets.filter(widget => widget.id !== widgetId),
    }));
    
    if (selectedWidget === widgetId) {
      setSelectedWidget(null);
    }
  }, [selectedWidget]);

  const duplicateWidget = useCallback((widgetId: string) => {
    const widget = dashboard.widgets.find(w => w.id === widgetId);
    if (!widget) return;

    const duplicatedWidget: Widget = {
      ...widget,
      id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `${widget.title} (Copy)`,
      position: { x: widget.position.x + 1, y: widget.position.y + 1 },
    };

    setDashboard(prev => ({
      ...prev,
      widgets: [...prev.widgets, duplicatedWidget],
    }));
  }, [dashboard.widgets]);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(dashboard);
    }
  }, [dashboard, onSave]);

  const handlePreview = useCallback(() => {
    if (onPreview) {
      onPreview(dashboard);
    }
  }, [dashboard, onPreview]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Input
                value={dashboard.name}
                onChange={(e) => handleDashboardChange('name', e.target.value)}
                className="text-lg font-semibold border-none p-0 h-auto bg-transparent"
                placeholder="Dashboard Name"
              />
              <Badge variant="secondary">{dashboard.type}</Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handlePreview}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Sidebar */}
          <div className="w-80 bg-white border-r flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="data">Data</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="design" className="flex-1 p-4 space-y-4">
                <div>
                  <Label className="text-sm font-medium">Widget Library</Label>
                  <div className="mt-2 space-y-2">
                    {Object.entries(
                      WIDGET_TYPES.reduce((acc, widget) => {
                        if (!acc[widget.category]) acc[widget.category] = [];
                        acc[widget.category].push(widget);
                        return acc;
                      }, {} as Record<string, typeof WIDGET_TYPES>)
                    ).map(([category, widgets]) => (
                      <div key={category}>
                        <Label className="text-xs text-gray-500 uppercase tracking-wide">
                          {category}
                        </Label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          {widgets.map((widget) => (
                            <WidgetLibraryItem
                              key={widget.type}
                              widget={widget}
                              onAdd={() => addWidget(widget.type)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {selectedWidget && (
                  <WidgetProperties
                    widget={dashboard.widgets.find(w => w.id === selectedWidget)!}
                    onUpdate={(updates) => updateWidget(selectedWidget, updates)}
                    onDelete={() => deleteWidget(selectedWidget)}
                    onDuplicate={() => duplicateWidget(selectedWidget)}
                  />
                )}
              </TabsContent>

              <TabsContent value="data" className="flex-1 p-4">
                <div className="space-y-4">
                  <div>
                    <Label>Data Sources</Label>
                    <p className="text-sm text-gray-500 mt-1">
                      Configure data connections for your widgets
                    </p>
                  </div>
                  {/* Data source configuration would go here */}
                </div>
              </TabsContent>

              <TabsContent value="settings" className="flex-1 p-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="dashboard-type">Dashboard Type</Label>
                    <Select
                      value={dashboard.type}
                      onValueChange={(value) => handleDashboardChange('type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DASHBOARD_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dashboard-description">Description</Label>
                    <Input
                      id="dashboard-description"
                      value={dashboard.description}
                      onChange={(e) => handleDashboardChange('description', e.target.value)}
                      placeholder="Dashboard description..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="grid-columns">Grid Columns</Label>
                      <Input
                        id="grid-columns"
                        type="number"
                        value={dashboard.layout.columns}
                        onChange={(e) => handleLayoutChange('columns', parseInt(e.target.value))}
                        min="1"
                        max="24"
                      />
                    </div>
                    <div>
                      <Label htmlFor="grid-rows">Grid Rows</Label>
                      <Input
                        id="grid-rows"
                        type="number"
                        value={dashboard.layout.rows}
                        onChange={(e) => handleLayoutChange('rows', parseInt(e.target.value))}
                        min="1"
                        max="20"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Main Canvas */}
          <div className="flex-1 p-6">
            <DashboardCanvas
              ref={gridRef}
              dashboard={dashboard}
              selectedWidget={selectedWidget}
              onWidgetSelect={setSelectedWidget}
              onWidgetUpdate={updateWidget}
              onWidgetDelete={deleteWidget}
            />
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

interface WidgetLibraryItemProps {
  widget: typeof WIDGET_TYPES[0];
  onAdd: () => void;
}

const WidgetLibraryItem: React.FC<WidgetLibraryItemProps> = ({ widget, onAdd }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'widget',
    item: { type: widget.type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
        isDragging ? 'opacity-50' : ''
      }`}
      onClick={onAdd}
    >
      <div className="flex flex-col items-center space-y-1">
        <widget.icon className="w-5 h-5 text-gray-600" />
        <span className="text-xs text-center">{widget.label}</span>
      </div>
    </div>
  );
};

interface WidgetPropertiesProps {
  widget: Widget;
  onUpdate: (updates: Partial<Widget>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const WidgetProperties: React.FC<WidgetPropertiesProps> = ({
  widget,
  onUpdate,
  onDelete,
  onDuplicate,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Widget Properties</Label>
        <div className="flex space-x-1">
          <Button size="sm" variant="outline" onClick={onDuplicate}>
            <Copy className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={onDelete}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="widget-title">Title</Label>
        <Input
          id="widget-title"
          value={widget.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="widget-width">Width</Label>
          <Input
            id="widget-width"
            type="number"
            value={widget.size.width}
            onChange={(e) => onUpdate({ 
              size: { ...widget.size, width: parseInt(e.target.value) } 
            })}
            min="1"
            max="12"
          />
        </div>
        <div>
          <Label htmlFor="widget-height">Height</Label>
          <Input
            id="widget-height"
            type="number"
            value={widget.size.height}
            onChange={(e) => onUpdate({ 
              size: { ...widget.size, height: parseInt(e.target.value) } 
            })}
            min="1"
            max="8"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="widget-x">X Position</Label>
          <Input
            id="widget-x"
            type="number"
            value={widget.position.x}
            onChange={(e) => onUpdate({ 
              position: { ...widget.position, x: parseInt(e.target.value) } 
            })}
            min="0"
          />
        </div>
        <div>
          <Label htmlFor="widget-y">Y Position</Label>
          <Input
            id="widget-y"
            type="number"
            value={widget.position.y}
            onChange={(e) => onUpdate({ 
              position: { ...widget.position, y: parseInt(e.target.value) } 
            })}
            min="0"
          />
        </div>
      </div>
    </div>
  );
};

interface DashboardCanvasProps {
  dashboard: DashboardConfig;
  selectedWidget: string | null;
  onWidgetSelect: (widgetId: string | null) => void;
  onWidgetUpdate: (widgetId: string, updates: Partial<Widget>) => void;
  onWidgetDelete: (widgetId: string) => void;
}

const DashboardCanvas = React.forwardRef<HTMLDivElement, DashboardCanvasProps>(
  ({ dashboard, selectedWidget, onWidgetSelect, onWidgetUpdate, onWidgetDelete }, ref) => {
    const [{ isOver }, drop] = useDrop({
      accept: 'widget',
      drop: (item: { type: string }, monitor) => {
        const offset = monitor.getClientOffset();
        if (offset && ref && 'current' in ref && ref.current) {
          const rect = ref.current.getBoundingClientRect();
          const x = Math.floor((offset.x - rect.left) / (rect.width / dashboard.layout.columns));
          const y = Math.floor((offset.y - rect.top) / (rect.height / dashboard.layout.rows));
          
          // This would trigger adding a new widget at the dropped position
          console.log('Drop widget', item.type, 'at', x, y);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    });

    return (
      <div
        ref={(node) => {
          drop(node);
          if (ref && 'current' in ref) {
            (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }
        }}
        className={`relative w-full h-full border-2 border-dashed border-gray-300 rounded-lg ${
          isOver ? 'border-blue-500 bg-blue-50' : ''
        }`}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${dashboard.layout.columns}, 1fr)`,
          gridTemplateRows: `repeat(${dashboard.layout.rows}, 1fr)`,
          gap: '8px',
          padding: '16px',
        }}
        onClick={() => onWidgetSelect(null)}
      >
        {dashboard.widgets.map((widget) => (
          <DashboardWidget
            key={widget.id}
            widget={widget}
            isSelected={selectedWidget === widget.id}
            onSelect={() => onWidgetSelect(widget.id)}
            onUpdate={(updates) => onWidgetUpdate(widget.id, updates)}
            onDelete={() => onWidgetDelete(widget.id)}
          />
        ))}
        
        {dashboard.widgets.length === 0 && (
          <div className="col-span-full row-span-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Grid className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Start building your dashboard</p>
              <p className="text-sm">Drag widgets from the sidebar or click to add them</p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

interface DashboardWidgetProps {
  widget: Widget;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<Widget>) => void;
  onDelete: () => void;
}

const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  widget,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'widget-move',
    item: { id: widget.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const widgetIcon = WIDGET_TYPES.find(w => w.type === widget.type)?.icon || Grid;

  return (
    <Card
      ref={drag}
      className={`cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${isDragging ? 'opacity-50' : ''}`}
      style={{
        gridColumn: `${widget.position.x + 1} / span ${widget.size.width}`,
        gridRow: `${widget.position.y + 1} / span ${widget.size.height}`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {React.createElement(widgetIcon, { className: "w-4 h-4" })}
            <span>{widget.title}</span>
          </div>
          {isSelected && (
            <div className="flex space-x-1">
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                <Move className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                <Settings className="w-3 h-3" />
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-24 bg-gray-100 rounded flex items-center justify-center text-gray-500">
          <span className="text-xs">Widget Preview</span>
        </div>
      </CardContent>
    </Card>
  );
};

DashboardCanvas.displayName = 'DashboardCanvas';