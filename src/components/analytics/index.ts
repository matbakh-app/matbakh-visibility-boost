// Analytics Components Export
// Task 6.4.2 - Visibility Trend Chart Component
// Task 6.4.3 - Predictive Forecasting Logic

export { TrendChart } from './TrendChart';
export { TrendFilters } from './TrendFilters';
export { TrendChartDemo } from './TrendChartDemo';
export { TrendAnalyticsDemo } from './TrendAnalyticsDemo';
export { EventAnnotations, EventTooltip } from './EventAnnotations';
export { EventControls } from './EventControls';
export { EnhancedTooltip } from './EnhancedTooltip';

// Forecasting Components - Task 6.4.3
export { ForecastChart } from './ForecastChart';
export { ForecastControls } from './ForecastControls';
export { ForecastDemo } from './ForecastDemo';

// Performance Monitoring Components - Task 1: Real-time Performance Monitoring
export { default as PerformanceMonitoringDashboard } from './PerformanceMonitoringDashboard';
export { PerformanceMonitoringProvider, usePerformanceMonitoringContext, withPerformanceMonitoring } from './PerformanceMonitoringProvider';
export { default as PerformanceWidget } from './PerformanceWidget';

// Upload Monitoring Components
export {
    default as MonitoredFileUpload,
    AvatarUpload,
    LogoUpload,
    DocumentUpload,
    ImageUpload,
    ReportUpload
} from '../upload/MonitoredFileUpload';