import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/lib/auth';

// Define notification types
export interface Notification {
  id?: string;
  type: 'wallet_update' | 'transaction_status' | 'market_result' | 'option_game_result';
  message: string;
  createdAt?: Date;
  status?: string;
  amount?: number;
  newBalance?: number;
  winningTeam?: string;
  marketId?: number;
  optionGameId?: number;
  transactionId?: number;
}

// Define context type
interface WebSocketContextType {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  notifications: Notification[];
  clearNotifications: () => void;
}

// Create context with default values
const WebSocketContext = createContext<WebSocketContextType>({
  status: 'disconnected',
  notifications: [],
  clearNotifications: () => {}
});

// Custom provider component
export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user, isAuthenticated } = useAuth();

  // Function to clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Handle incoming notification
  const handleNotification = (notification: Notification) => {
    // Add a timestamp and random ID if not provided by the server
    const newNotification = {
      ...notification,
      id: notification.id || Math.random().toString(36).substring(2, 9),
      createdAt: notification.createdAt || new Date()
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep only the last 50 notifications
  };

  // Initialize and manage WebSocket connection
  useEffect(() => {
    // Don't connect WebSocket if user is not logged in
    if (!isAuthenticated || !user) {
      setStatus('disconnected');
      return;
    }

    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const newSocket = new WebSocket(wsUrl);
    setSocket(newSocket);
    setStatus('connecting');

    // WebSocket event handlers
    newSocket.onopen = () => {
      setStatus('connected');
      console.log('WebSocket connected');
      
      // Send authentication message with user ID
      if (user?.id) {
        newSocket.send(JSON.stringify({
          type: 'auth',
          userId: user.id
        }));
      }
    };

    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Check if it's a notification
        if (data.type && data.message) {
          handleNotification(data as Notification);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setStatus('error');
    };

    newSocket.onclose = () => {
      console.log('WebSocket disconnected');
      setStatus('disconnected');
    };

    // Cleanup on unmount
    return () => {
      if (newSocket.readyState === WebSocket.OPEN) {
        newSocket.close();
      }
    };
  }, [isAuthenticated, user]); // Reconnect if user or auth state changes

  // Send ping every 30 seconds to keep connection alive
  useEffect(() => {
    if (!socket || status !== 'connected') return;

    const pingInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => clearInterval(pingInterval);
  }, [socket, status]);

  // Provide context value
  const contextValue: WebSocketContextType = {
    status,
    notifications,
    clearNotifications
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook to use the context
export const useWebSocketContext = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};