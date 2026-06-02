/**
 * useCrisisPolling — Polls the crisis list endpoint at a fixed interval.
 * Falls back to polling when WebSocket is unavailable.
 */
import { useState, useEffect, useCallback } from "react";

export interface Crisis {
  id: string;
  flight_number: string;
  crisis_type: string;
  status: string;
  affected_passengers: number;
  created_at: string;
  resolved_at?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function useCrisisPolling(intervalMs = 5000) {
  const [crises, setCrises] = useState<Crisis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCrises = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/crisis/`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Crisis[] = await res.json();
      setCrises(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCrises();
    const timer = setInterval(fetchCrises, intervalMs);
    return () => clearInterval(timer);
  }, [fetchCrises, intervalMs]);

  return { crises, loading, error, refetch: fetchCrises };
}
