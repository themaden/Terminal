"use client"

import { useEffect, useRef } from "react"

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000"

export interface WSMessage {
  type: string
  data?: unknown
  ts?: string
}

/**
 * Opens a self-healing WebSocket connection to the given backend channel path
 * (e.g. "/ws/crisis"). Reconnects with exponential backoff on close/error.
 * Returns a cleanup function that closes the socket for good.
 */
export function connectSocket(path: string, onMessage: (msg: WSMessage) => void): () => void {
  let socket: WebSocket | null = null
  let retryDelay = 1_000
  let retryTimer: ReturnType<typeof setTimeout> | null = null
  let pingTimer: ReturnType<typeof setInterval> | null = null
  let closed = false

  function open() {
    if (closed) return
    socket = new WebSocket(`${WS_URL}${path}`)

    socket.onopen = () => {
      retryDelay = 1_000
      pingTimer = setInterval(() => socket?.readyState === WebSocket.OPEN && socket.send("ping"), 25_000)
    }
    socket.onmessage = (event) => {
      if (event.data === "pong") return
      try {
        onMessage(JSON.parse(event.data) as WSMessage)
      } catch {
        /* non-JSON heartbeat frame — ignore */
      }
    }
    socket.onclose = () => {
      if (pingTimer) clearInterval(pingTimer)
      if (closed) return
      retryTimer = setTimeout(open, retryDelay)
      retryDelay = Math.min(retryDelay * 2, 30_000)
    }
    socket.onerror = () => socket?.close()
  }

  open()

  return () => {
    closed = true
    if (retryTimer) clearTimeout(retryTimer)
    if (pingTimer) clearInterval(pingTimer)
    socket?.close()
  }
}

/**
 * Subscribes to the live crisis channel and invokes `onUpdate` whenever the
 * backend pushes a snapshot or crisis_update event — used to refresh dashboard
 * data in real time instead of waiting for the next poll interval.
 */
export function useCrisisUpdates(onUpdate: () => void) {
  const callbackRef = useRef(onUpdate)
  callbackRef.current = onUpdate

  useEffect(() => {
    return connectSocket("/ws/crisis", (msg) => {
      if (msg.type === "snapshot" || msg.type === "crisis_update") {
        callbackRef.current()
      }
    })
  }, [])
}

/**
 * Subscribes to the live flight channel and invokes `onUpdate` whenever the
 * backend pushes a flight_update event (status changes from the Cirium poll
 * or a freshly triggered crisis) — keeps the flight map/list in sync in real time.
 */
export function useFlightUpdates(onUpdate: () => void) {
  const callbackRef = useRef(onUpdate)
  callbackRef.current = onUpdate

  useEffect(() => {
    return connectSocket("/ws/flights", (msg) => {
      if (msg.type === "flight_update") {
        callbackRef.current()
      }
    })
  }, [])
}
