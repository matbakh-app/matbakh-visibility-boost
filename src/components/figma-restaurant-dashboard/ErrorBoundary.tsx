import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface Props {
  children: ReactNode;
  fallbackType?: 'widget' | 'dashboard' | 'minimal';
  widgetName?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  private retryTimer: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to monitoring service
    console.error('Widget Error Boundary:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      widgetName: this.props.widgetName,
      timestamp: new Date().toISOString()
    });

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send error to analytics/monitoring
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('Widget Error', {
        widget: this.props.widgetName,
        error: error.message,
        retryCount: this.state.retryCount
      });
    }
  }

  handleRetry = () => {
    const maxRetries = 3;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      return;
    }

    // Exponential backoff: 1s, 2s, 4s
    const retryDelay = Math.pow(2, retryCount) * 1000;

    this.setState({
      retryCount: retryCount + 1
    });

    this.retryTimer = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      });
    }, retryDelay);
  };

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  renderWidgetError() {
    const { widgetName } = this.props;
    const { error, retryCount } = this.state;
    const maxRetries = 3;
    const canRetry = retryCount < maxRetries;

    return (
      <Card className="bg-card border-border widget-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-error" />
              </div>
              <div>
                <CardTitle className="text-foreground">
                  Widget-Fehler
                </CardTitle>
                <p className="caption text-muted-foreground mt-1">
                  {widgetName || 'Unbekanntes Widget'}
                </p>
              </div>
            </div>
            <Badge variant="destructive" className="text-xs">
              Fehler
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-error/5 border border-error/20 rounded-lg p-4">
            <p className="body-md text-muted-foreground mb-2">
              Ein unerwarteter Fehler ist aufgetreten. Das Widget konnte nicht geladen werden.
            </p>
            
            {error && (
              <details className="mt-3">
                <summary className="caption font-medium cursor-pointer text-error hover:text-error/80">
                  Technische Details anzeigen
                </summary>
                <div className="mt-2 p-3 bg-muted rounded text-xs font-mono text-muted-foreground">
                  {error.message}
                </div>
              </details>
            )}
          </div>

          <div className="flex space-x-3">
            {canRetry && (
              <Button
                onClick={this.handleRetry}
                variant="outline"
                size="sm"
                className="flex-1 touch-target"
                disabled={!canRetry}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Erneut versuchen
                {retryCount > 0 && (
                  <span className="ml-2 caption">({retryCount}/{maxRetries})</span>
                )}
              </Button>
            )}
            
            <Button
              onClick={this.handleReload}
              variant="outline"
              size="sm"
              className="flex-1 touch-target"
            >
              <Home className="w-4 h-4 mr-2" />
              Dashboard neu laden
            </Button>
          </div>

          {!canRetry && (
            <div className="text-center p-4 bg-warning/5 rounded-lg">
              <p className="caption text-warning">
                Maximale Anzahl an Wiederholungsversuchen erreicht
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  renderDashboardError() {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-card border-border">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
              <Bug className="w-8 h-8 text-error" />
            </div>
            <CardTitle className="text-foreground">
              Dashboard-Fehler
            </CardTitle>
            <p className="caption text-muted-foreground mt-2">
              Das Dashboard konnte nicht geladen werden
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4 text-center">
            <div className="space-y-3">
              <Button
                onClick={this.handleReload}
                className="w-full touch-target"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Dashboard neu laden
              </Button>
              
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="w-full touch-target"
              >
                <Home className="w-4 h-4 mr-2" />
                Zur Startseite
              </Button>
            </div>
            
            <p className="caption text-muted-foreground">
              Falls das Problem weiterhin besteht, kontaktieren Sie den Support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  renderMinimalError() {
    return (
      <div className="flex items-center justify-center p-4 bg-error/5 border border-error/20 rounded-lg">
        <div className="text-center">
          <AlertTriangle className="w-6 h-6 text-error mx-auto mb-2" />
          <p className="caption text-muted-foreground">
            Fehler beim Laden
          </p>
          <Button
            onClick={this.handleRetry}
            variant="ghost"
            size="sm"
            className="mt-2"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { fallbackType = 'widget' } = this.props;

    switch (fallbackType) {
      case 'dashboard':
        return this.renderDashboardError();
      case 'minimal':
        return this.renderMinimalError();
      case 'widget':
      default:
        return this.renderWidgetError();
    }
  }
}

export default ErrorBoundary;