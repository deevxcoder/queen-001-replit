import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
type NotificationType = 
  | 'wallet_update' 
  | 'transaction_status'
  | 'market_result'
  | 'option_game_result';

export interface Notification {
  type: NotificationType;
  message: string;
  [key: string]: any;
}

interface UseWebSocketOptions {
  userId?: number;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  onNotification?: (notification: Notification) => void;
}

export function useWebSocket({
  userId,
  autoReconnect = true,
  reconnectInterval = 5000,
  onOpen,
  onClose,
  onError,
  onNotification
}: UseWebSocketOptions = {}) {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number>();
  const { toast } = useToast();

  // Initialize WebSocket connection
  const connect = useCallback(() => {
    if (!userId) {
      return;
    }

    // Close existing connection if any
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.close();
    }

    try {
      setStatus('connecting');
      
      // Create WebSocket connection
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setStatus('connected');
        console.log('WebSocket connected');
        
        // Send authentication message with user ID
        socket.send(JSON.stringify({
          type: 'auth',
          userId
        }));
        
        if (onOpen) onOpen();
      };

      socket.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data) as Notification;
          console.log('Notification received:', notification);
          
          // Add notification to state
          setNotifications(prev => [notification, ...prev].slice(0, 100)); // Keep last 100 notifications
          
          // Show toast for the notification
          toast({
            title: getNotificationTitle(notification.type),
            description: notification.message,
            variant: getNotificationVariant(notification.type),
          });
          
          // Call onNotification callback if provided
          if (onNotification) {
            onNotification(notification);
          }
        } catch (error) {
          console.error('Error processing notification:', error);
        }
      };

      socket.onclose = () => {
        setStatus('disconnected');
        console.log('WebSocket disconnected');
        
        // Try to reconnect if autoReconnect is enabled
        if (autoReconnect) {
          console.log(`Reconnecting in ${reconnectInterval}ms...`);
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
        
        if (onClose) onClose();
      };

      socket.onerror = (error) => {
        setStatus('error');
        console.error('WebSocket error:', error);
        if (onError) onError(error);
      };
    } catch (error) {
      setStatus('error');
      console.error('Error setting up WebSocket:', error);
    }
  }, [userId, autoReconnect, reconnectInterval, onOpen, onClose, onError, onNotification, toast]);

  // Connect when component mounts or userId changes
  useEffect(() => {
    if (userId) {
      connect();
    }
    
    return () => {
      // Clean up connection when component unmounts
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      // Clear any pending reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [userId, connect]);

  // Helper function to determine notification title based on type
  const getNotificationTitle = (type: NotificationType): string => {
    switch (type) {
      case 'wallet_update':
        return 'Wallet Updated';
      case 'transaction_status':
        return 'Transaction Update';
      case 'market_result':
        return 'Market Result Declared';
      case 'option_game_result':
        return 'Game Result Declared';
      default:
        return 'Notification';
    }
  };

  // Helper function to determine notification variant based on type
  const getNotificationVariant = (type: NotificationType): 'default' | 'destructive' => {
    switch (type) {
      case 'wallet_update':
      case 'market_result':
      case 'option_game_result':
        return 'default';
      case 'transaction_status':
        return 'default';
      default:
        return 'default';
    }
  };

  return {
    status,
    notifications,
    connect,
    disconnect: () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    }
  };
}