import { useEffect, useRef, useState } from 'react';
import { realtimeManager } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseRealtimeConnectionOptions {
  channelName: string;
  enabled?: boolean;
  showErrorToast?: boolean;
}

export function useRealtimeConnection({ 
  channelName, 
  enabled = true, 
  showErrorToast = true 
}: UseRealtimeConnectionOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);
  const errorToastShown = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const handleConnectionError = (event: CustomEvent) => {
      setConnectionError(event.detail.message);
      setIsConnected(false);
      
      if (showErrorToast && !errorToastShown.current) {
        toast.error('Verbindung unterbrochen', {
          description: 'Die Seite wird automatisch neu geladen.',
          action: {
            label: 'Neu laden',
            onClick: () => window.location.reload(),
          },
        });
        errorToastShown.current = true;
        
        // Auto-reload after 5 seconds if user doesn't act
        setTimeout(() => {
          window.location.reload();
        }, 5000);
      }
    };

    // Listen for connection errors
    window.addEventListener('realtime-connection-error', handleConnectionError as EventListener);

    // Create channel
    try {
      channelRef.current = realtimeManager.createChannel(channelName);
      
      if (channelRef.current) {
        channelRef.current.subscribe((status: string) => {
          console.log(`Channel ${channelName} status:`, status);
          setIsConnected(status === 'SUBSCRIBED');
          
          if (status === 'SUBSCRIBED') {
            setConnectionError(null);
            errorToastShown.current = false;
          }
        });
      }
    } catch (error) {
      console.error(`Failed to create channel ${channelName}:`, error);
      setConnectionError(`Failed to connect: ${error}`);
    }

    return () => {
      window.removeEventListener('realtime-connection-error', handleConnectionError as EventListener);
      
      if (channelRef.current) {
        try {
          channelRef.current.unsubscribe();
        } catch (error) {
          console.warn(`Error unsubscribing from channel ${channelName}:`, error);
        }
      }
    };
  }, [channelName, enabled, showErrorToast]);

  // Monitor tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && connectionError) {
        // Tab became visible again and we had an error - attempt to reconnect
        setTimeout(() => {
          if (!isConnected) {
            window.location.reload();
          }
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isConnected, connectionError]);

  return {
    channel: channelRef.current,
    isConnected,
    connectionError,
    reconnect: () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
      channelRef.current = realtimeManager.createChannel(channelName);
      return channelRef.current;
    }
  };
}