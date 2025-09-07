/**
 * Types for Dashboard & Visualization System
 */
export interface Dashboard {
  id: string;
  name: string;
  description: string;
  type: DashboardType;
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  filters: DashboardFilter[];
  permissions: DashboardPermissions;
  settings: DashboardSettings;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type DashboardType = 
  | 'analytics'
  | 'business_intelligence'
  | 'operational'
  | 'executive'
  | 'custom';

export interface DashboardLayout {
  columns: number;
  rows: number;
  gridSize: {
    width: number;
    height: number;
  };
  responsive: boolean;
  breakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  position: WidgetPosition;
  size: WidgetSize;
  dataSource: DataSource;
  visualization: VisualizationConfig;
  filters: WidgetFilter[];
  refreshInterval: number; // seconds
  cacheEnabled: boolean;
  permissions: WidgetPermissions;
  settings: WidgetSettings;
}

export type WidgetType = 
  | 'line_chart'
  | 'bar_chart'
  | 'pie_chart'
  | 'donut_chart'
  | 'area_chart'
  | 'scatter_plot'
  | 'heatmap'
  | 'table'
  | 'metric_card'
  | 'gauge'
  | 'funnel'
  | 'treemap'
  | 'sankey'
  | 'map'
  | 'text'
  | 'image'
  | 'iframe';

export interface WidgetPosition {
  x: number;
  y: number;
  z?: number; // for layering
}

export interface WidgetSize {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface DataSource {
  id: string;
  type: DataSourceType;
  connection: DataSourceConnection;
  query: DataQuery;
  cache: CacheConfig;
  security: SecurityConfig;
}

export type DataSourceType = 
  | 'analytics_api'
  | 'timestream'
  | 'dynamodb'
  | 'postgresql'
  | 'redis'
  | 's3'
  | 'external_api'
  | 'static';

export interface DataSourceConnection {
  endpoint?: string;
  credentials?: string; // Secret ARN
  region?: string;
  database?: string;
  table?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface DataQuery {
  query: string;
  parameters: Record<string, any>;
  timeRange?: TimeRange;
  aggregation?: AggregationConfig;
  sorting?: SortConfig[];
  limit?: number;
  offset?: number;
}

export interface TimeRange {
  start: string;
  end: string;
  relative?: RelativeTimeRange;
}

export interface RelativeTimeRange {
  amount: number;
  unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
  anchor: 'now' | 'start_of_day' | 'start_of_week' | 'start_of_month';
}

export interface AggregationConfig {
  groupBy: string[];
  metrics: MetricAggregation[];
  having?: FilterCondition[];
}

export interface MetricAggregation {
  field: string;
  function: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'distinct_count' | 'percentile';
  alias?: string;
  percentile?: number; // for percentile function
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // seconds
  key?: string;
  invalidationTriggers?: string[];
}

export interface SecurityConfig {
  encryption: boolean;
  accessControl: AccessControlConfig;
  auditLogging: boolean;
}

export interface AccessControlConfig {
  roles: string[];
  permissions: string[];
  rowLevelSecurity?: RowLevelSecurityConfig;
}

export interface RowLevelSecurityConfig {
  enabled: boolean;
  rules: SecurityRule[];
}

export interface SecurityRule {
  condition: string;
  action: 'allow' | 'deny';
  priority: number;
}

export interface VisualizationConfig {
  chartType: string;
  axes: AxisConfig[];
  series: SeriesConfig[];
  colors: ColorConfig;
  legend: LegendConfig;
  tooltip: TooltipConfig;
  animation: AnimationConfig;
  interaction: InteractionConfig;
  formatting: FormattingConfig;
}

export interface AxisConfig {
  type: 'x' | 'y' | 'y2';
  field: string;
  label?: string;
  scale: 'linear' | 'logarithmic' | 'time' | 'category';
  min?: number;
  max?: number;
  format?: string;
  grid?: boolean;
  ticks?: TickConfig;
}

export interface TickConfig {
  count?: number;
  interval?: number;
  format?: string;
  rotation?: number;
}

export interface SeriesConfig {
  field: string;
  label?: string;
  type?: string;
  color?: string;
  style?: SeriesStyle;
  markers?: MarkerConfig;
}

export interface SeriesStyle {
  lineWidth?: number;
  fillOpacity?: number;
  strokeDashArray?: string;
  pointRadius?: number;
}

export interface MarkerConfig {
  enabled: boolean;
  shape: 'circle' | 'square' | 'triangle' | 'diamond';
  size: number;
}

export interface ColorConfig {
  scheme: 'categorical' | 'sequential' | 'diverging' | 'custom';
  palette: string[];
  opacity?: number;
}

export interface LegendConfig {
  enabled: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
  alignment: 'start' | 'center' | 'end';
  orientation: 'horizontal' | 'vertical';
}

export interface TooltipConfig {
  enabled: boolean;
  format?: string;
  fields?: string[];
  customTemplate?: string;
}

export interface AnimationConfig {
  enabled: boolean;
  duration: number;
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  delay?: number;
}

export interface InteractionConfig {
  zoom: boolean;
  pan: boolean;
  brush: boolean;
  crossfilter: boolean;
  drill: DrillConfig;
}

export interface DrillConfig {
  enabled: boolean;
  levels: DrillLevel[];
}

export interface DrillLevel {
  field: string;
  label: string;
  dashboard?: string; // Link to another dashboard
  widget?: string; // Link to another widget
}

export interface FormattingConfig {
  numberFormat?: NumberFormatConfig;
  dateFormat?: DateFormatConfig;
  currencyFormat?: CurrencyFormatConfig;
}

export interface NumberFormatConfig {
  decimals: number;
  thousandsSeparator: string;
  decimalSeparator: string;
  prefix?: string;
  suffix?: string;
}

export interface DateFormatConfig {
  format: string;
  timezone?: string;
  locale?: string;
}

export interface CurrencyFormatConfig {
  currency: string;
  symbol: string;
  position: 'before' | 'after';
}

export interface DashboardFilter {
  id: string;
  type: FilterType;
  field: string;
  label: string;
  defaultValue?: any;
  options?: FilterOption[];
  validation?: FilterValidation;
  dependencies?: FilterDependency[];
}

export type FilterType = 
  | 'text'
  | 'number'
  | 'date'
  | 'date_range'
  | 'select'
  | 'multi_select'
  | 'checkbox'
  | 'radio'
  | 'slider'
  | 'range_slider';

export interface FilterOption {
  label: string;
  value: any;
  group?: string;
}

export interface FilterValidation {
  required: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  customValidator?: string;
}

export interface FilterDependency {
  field: string;
  condition: FilterCondition;
}

export interface FilterCondition {
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'between' | 'contains';
  value: any;
}

export interface WidgetFilter extends DashboardFilter {
  scope: 'widget' | 'dashboard' | 'global';
}

export interface DashboardPermissions {
  view: string[];
  edit: string[];
  admin: string[];
  share: string[];
}

export interface WidgetPermissions {
  view: string[];
  edit: string[];
  export: string[];
}

export interface DashboardSettings {
  theme: ThemeConfig;
  autoRefresh: boolean;
  refreshInterval: number;
  fullscreen: boolean;
  exportEnabled: boolean;
  printEnabled: boolean;
  shareEnabled: boolean;
  embedEnabled: boolean;
  notifications: NotificationConfig;
}

export interface WidgetSettings {
  exportFormats: ExportFormat[];
  printEnabled: boolean;
  fullscreenEnabled: boolean;
  refreshEnabled: boolean;
  errorHandling: ErrorHandlingConfig;
}

export interface ThemeConfig {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    border: string;
  };
  fonts: {
    family: string;
    sizes: {
      small: number;
      medium: number;
      large: number;
    };
  };
  spacing: {
    small: number;
    medium: number;
    large: number;
  };
}

export interface NotificationConfig {
  enabled: boolean;
  channels: NotificationChannel[];
  triggers: NotificationTrigger[];
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  config: Record<string, any>;
}

export interface NotificationTrigger {
  condition: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export type ExportFormat = 'pdf' | 'png' | 'svg' | 'csv' | 'excel' | 'json';

export interface ErrorHandlingConfig {
  showErrors: boolean;
  fallbackMessage: string;
  retryEnabled: boolean;
  retryAttempts: number;
  retryDelay: number;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  dashboard: Omit<Dashboard, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>;
  preview: string; // Base64 encoded image
  popularity: number;
  rating: number;
}

export interface VisualizationRequest {
  dashboardId?: string;
  widgetId?: string;
  type: 'render' | 'export' | 'preview';
  format?: ExportFormat;
  options?: RenderOptions;
}

export interface RenderOptions {
  width?: number;
  height?: number;
  dpi?: number;
  quality?: number;
  background?: string;
  theme?: string;
}

export interface VisualizationResponse {
  success: boolean;
  data?: string; // Base64 encoded for images, JSON string for data
  contentType?: string;
  size?: number;
  error?: string;
  metadata?: {
    renderTime: number;
    cacheHit: boolean;
    dataPoints: number;
  };
}

export interface DashboardAnalytics {
  dashboardId: string;
  views: number;
  uniqueUsers: number;
  avgSessionDuration: number;
  bounceRate: number;
  popularWidgets: WidgetAnalytics[];
  performanceMetrics: PerformanceMetrics;
  userInteractions: InteractionAnalytics[];
}

export interface WidgetAnalytics {
  widgetId: string;
  views: number;
  interactions: number;
  avgLoadTime: number;
  errorRate: number;
  exportCount: number;
}

export interface PerformanceMetrics {
  avgLoadTime: number;
  p95LoadTime: number;
  errorRate: number;
  cacheHitRate: number;
  dataFreshness: number;
}

export interface InteractionAnalytics {
  type: 'click' | 'hover' | 'zoom' | 'filter' | 'export' | 'drill';
  count: number;
  avgDuration: number;
  successRate: number;
}

export interface DashboardShare {
  id: string;
  dashboardId: string;
  shareType: 'public' | 'private' | 'embed';
  permissions: SharePermissions;
  expiresAt?: string;
  accessCount: number;
  lastAccessed?: string;
  createdBy: string;
  createdAt: string;
}

export interface SharePermissions {
  view: boolean;
  interact: boolean;
  export: boolean;
  comment: boolean;
}

export interface EmbedConfig {
  width?: string;
  height?: string;
  theme?: string;
  hideControls?: boolean;
  hideFilters?: boolean;
  autoRefresh?: boolean;
  allowFullscreen?: boolean;
}