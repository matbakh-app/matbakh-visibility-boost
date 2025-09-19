import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Wifi, WifiOff, CloudOff, AlertTriangle } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface NetworkState {
  isOnline: boolean;
  isConnected: boolean;
  connectionType: string;
  effectiveType: string;
  rtt: number;
  downlink: number;
  lastSyncTime: Date | null;
  pendingOperations: number;
}

interface OfflineContextType {
  networkState: NetworkState;
  queueOperation: (operation: () => Promise<any>, priority?: number) => void;
  retryFailedOperations: () => void;
  getLastKnownData: (key: string) => any;
  isFeatureAvailable: (feature: string) => boolean;
}

const OfflineContext = createContext<OfflineContextType | null>(null);

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within OfflineProvider');
  }
  return context;
};

interface OfflineProviderProps {
  children: ReactNode;
}

interface QueuedOperation {
  id: string;
  operation: () => Promise<any>;
  priority: number;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isConnected: true,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    rtt: 0,
    downlink: 0,
    lastSyncTime: null,
    pendingOperations: 0
  });

  const [operationQueue, setOperationQueue] = useState<QueuedOperation[]>([]);
  const [offlineData, setOfflineData] = useState<Map<string, any>>(new Map());

  // Network state monitoring
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateNetworkState = () => {
      const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection;

      setNetworkState(prev => ({
        ...prev,
        isOnline: navigator.onLine,
        connectionType: connection?.type || 'unknown',
        effectiveType: connection?.effectiveType || 'unknown',
        rtt: connection?.rtt || 0,
        downlink: connection?.downlink || 0
      }));
    };

    const handleOnline = () => {
      setNetworkState(prev => ({ ...prev, isOnline: true, isConnected: true }));
      retryFailedOperations();
      syncPendingOperations();
    };

    const handleOffline = () => {
      setNetworkState(prev => ({ ...prev, isOnline: false, isConnected: false }));
    };

    // Event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if ((navigator as any).connection) {
      (navigator as any).connection.addEventListener('change', updateNetworkState);
    }

    // Initial state
    updateNetworkState();

    // Periodic connectivity check
    const connectivityCheck = setInterval(async () => {
      try {
        const response = await fetch('/api/health-check', { 
          method: 'HEAD',
          cache: 'no-cache',
          signal: AbortSignal.timeout(3000)
        });
        
        setNetworkState(prev => ({
          ...prev,
          isConnected: response.ok,
          lastSyncTime: response.ok ? new Date() : prev.lastSyncTime
        }));
      } catch {
        setNetworkState(prev => ({ ...prev, isConnected: false }));
      }
    }, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ((navigator as any).connection) {
        (navigator as any).connection.removeEventListener('change', updateNetworkState);
      }
      clearInterval(connectivityCheck);
    };
  }, []);

  // Queue operations when offline
  const queueOperation = (operation: () => Promise<any>, priority = 1) => {
    const queuedOp: QueuedOperation = {
      id: Date.now().toString(),
      operation,
      priority,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: 3
    };

    setOperationQueue(prev => {
      const newQueue = [...prev, queuedOp];
      // Sort by priority (higher numbers first)
      return newQueue.sort((a, b) => b.priority - a.priority);
    });

    setNetworkState(prev => ({
      ...prev,
      pendingOperations: prev.pendingOperations + 1
    }));
  };

  // Retry failed operations with exponential backoff
  const retryFailedOperations = async () => {
    if (!networkState.isOnline || operationQueue.length === 0) return;

    const operationsToRetry = [...operationQueue];
    setOperationQueue([]);

    for (const op of operationsToRetry) {
      try {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, op.retryCount) * 1000));
        await op.operation();
        
        setNetworkState(prev => ({
          ...prev,
          pendingOperations: Math.max(0, prev.pendingOperations - 1)
        }));
      } catch (error) {
        const updatedOp = {
          ...op,
          retryCount: op.retryCount + 1
        };

        if (updatedOp.retryCount < updatedOp.maxRetries) {
          setOperationQueue(prev => [...prev, updatedOp]);
        } else {
          // Operation failed permanently
          console.error('Operation failed permanently:', error);
          setNetworkState(prev => ({
            ...prev,
            pendingOperations: Math.max(0, prev.pendingOperations - 1)
          }));
        }
      }
    }
  };

  // Sync pending operations when coming back online
  const syncPendingOperations = async () => {
    setNetworkState(prev => ({ ...prev, lastSyncTime: new Date() }));
    await retryFailedOperations();
  };

  // Get last known data for offline scenarios
  const getLastKnownData = (key: string) => {
    return offlineData.get(key);
  };

  // Check if feature is available based on network conditions
  const isFeatureAvailable = (feature: string): boolean => {
    if (!networkState.isOnline) {
      // Define offline-capable features
      const offlineFeatures = [
        'dashboard-view',
        'cached-reports',
        'settings'
      ];
      return offlineFeatures.includes(feature);
    }

    // Check for low bandwidth scenarios
    if (networkState.effectiveType === 'slow-2g' || networkState.effectiveType === '2g') {
      const lightweightFeatures = [
        'basic-dashboard',
        'text-reports'
      ];
      return lightweightFeatures.includes(feature);
    }

    return true; // All features available with good connection
  };

  return (
    <OfflineContext.Provider
      value={{
        networkState,
        queueOperation,
        retryFailedOperations,
        getLastKnownData,
        isFeatureAvailable
      }}
    >
      {children}
      <OfflineIndicator />
    </OfflineContext.Provider>
  );
};

// Offline indicator component
const OfflineIndicator: React.FC = () => {
  const { networkState } = useOffline();
  const [showDetails, setShowDetails] = useState(false);

  if (networkState.isOnline && networkState.isConnected) {
    return null;
  }

  const getConnectionStatus = () => {
    if (!networkState.isOnline) return 'offline';
    if (!networkState.isConnected) return 'disconnected';
    return 'slow';
  };

  const status = getConnectionStatus();

  return (
    <>
      {/* Floating indicator */}
      <div className="fixed top-20 right-4 z-50 transition-all duration-300">
        <Card className="bg-card border-border shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {status === 'offline' ? (
                  <WifiOff className="w-4 h-4 text-error" />
                ) : status === 'disconnected' ? (
                  <CloudOff className="w-4 h-4 text-warning" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-warning" />
                )}
                
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={status === 'offline' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {status === 'offline' ? 'Offline' : 
                       status === 'disconnected' ? 'Keine Verbindung' : 
                       'Langsame Verbindung'}
                    </Badge>
                    
                    {networkState.pendingOperations > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {networkState.pendingOperations} ausstehend
                      </Badge>
                    )}
                  </div>
                  
                  <p className="caption text-muted-foreground">
                    {status === 'offline' 
                      ? 'Zeige letzte Daten an'
                      : 'Versuche Verbindung...'
                    }
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="h-8 w-8 p-0"
              >
                {showDetails ? '−' : '+'}
              </Button>
            </div>

            {showDetails && (
              <div className="mt-3 pt-3 border-t border-border space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>Verbindungstyp:</div>
                  <div className="font-mono">{networkState.connectionType}</div>
                  
                  <div>Qualität:</div>
                  <div className="font-mono">{networkState.effectiveType}</div>
                  
                  {networkState.lastSyncTime && (
                    <>
                      <div>Letzte Sync:</div>
                      <div className="font-mono">
                        {networkState.lastSyncTime.toLocaleTimeString()}
                      </div>
                    </>
                  )}
                </div>

                {networkState.pendingOperations > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {}}
                    className="w-full text-xs"
                  >
                    Sync bei Verbindung ({networkState.pendingOperations})
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default OfflineProvider;