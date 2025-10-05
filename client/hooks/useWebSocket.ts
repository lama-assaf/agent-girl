import { useState, useEffect, useRef, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  [key: string]: unknown;
}

interface UseWebSocketOptions {
  url: string;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket({
  url,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
  reconnectDelay = 3000,
  maxReconnectAttempts = 5,
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueueRef = useRef<string[]>([]);
  const connectRef = useRef<(() => void) | null>(null);

  const scheduleReconnect = useCallback(() => {
    reconnectTimeoutRef.current = setTimeout(() => {
      setReconnectAttempts(prev => prev + 1);
      connectRef.current?.();
    }, reconnectDelay);
  }, [reconnectDelay]);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setReconnectAttempts(0);
        onConnect?.();

        // Send any queued messages
        while (messageQueueRef.current.length > 0) {
          const msg = messageQueueRef.current.shift();
          if (msg) ws.send(msg);
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        onError?.(error);
      };

      ws.onclose = () => {
        setIsConnected(false);
        onDisconnect?.();
        wsRef.current = null;

        // Attempt reconnection
        if (reconnectAttempts < maxReconnectAttempts) {
          scheduleReconnect();
        }
      };
    } catch (error) {
      // Failed to create WebSocket connection
    }
  }, [url, onMessage, onConnect, onDisconnect, onError, reconnectAttempts, maxReconnectAttempts, scheduleReconnect]);

  connectRef.current = connect;

  const sendMessage = useCallback((message: WebSocketMessage) => {
    const messageStr = JSON.stringify(message);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(messageStr);
    } else {
      // Queue the message if not connected
      messageQueueRef.current.push(messageStr);

      // Try to reconnect if not already attempting
      if (!isConnected && reconnectAttempts >= maxReconnectAttempts) {
        setReconnectAttempts(0);
        connect();
      }
    }
  }, [isConnected, reconnectAttempts, maxReconnectAttempts, connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Initialize connection
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    sendMessage,
    disconnect,
    reconnect: connect,
  };
}