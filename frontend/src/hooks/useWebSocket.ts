/**
 * useWebSocket — Real-time WebSocket hook for crisis event streaming.
 * Reconnects automatically on disconnection.
 */
import { useEffect, useRef, useState, useCallback } from "react";

export type WSStatus = "connecting" | "open" | "closed" | "error";

interface UseWebSocketOptions {
  onMessage?: (data: unknown) => void;
  reconnectInterval?: number;
  maxRetries?: number;
}

export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const { onMessage, reconnectInterval = 3000, maxRetries = 10 } = options;
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const [status, setStatus] = useState<WSStatus>("connecting");
  const [lastMessage, setLastMessage] = useState<Record<string, unknown> | string | null>(null);

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;

    const ws = new WebSocket(url);
    wsRef.current = ws;
    setStatus("connecting");

    ws.onopen = () => {
      setStatus("open");
      retriesRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
        onMessage?.(data);
      } catch {
        setLastMessage(event.data);
        onMessage?.(event.data);
      }
    };

    ws.onerror = () => setStatus("error");

    ws.onclose = () => {
      setStatus("closed");
      if (retriesRef.current < maxRetries) {
        retriesRef.current += 1;
        setTimeout(connect, reconnectInterval);
      }
    };
  }, [url, onMessage, reconnectInterval, maxRetries]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof data === "string" ? data : JSON.stringify(data));
    }
  }, []);

  return { status, lastMessage, send };
}
