"use client"

import { useState, useEffect, useRef } from "react"
import { ioccApi, type AuditLog } from "@/lib/api"
import { CheckCircle2, AlertTriangle, Zap, Hotel, MessageSquare, Activity, Cpu, Users } from "lucide-react"

type EventType = "crisis" | "ai" | "ok" | "warn" | "hotel" | "msg" | "system"

interface FeedEvent {
  id: string
  type: EventType
  msg: string
  sub: string
  time: string
  isNew?: boolean
}

const FALLBACK: FeedEvent[] = [
  { id: "f1", type: "system", msg: "Sistem nominal — aktif kriz yok", sub: "Tüm servisler → Online", time: "--:--:--" },
  { id: "f2", type: "ai", msg: "MILP motoru hazır", sub: "CrisisSolver → Beklemede", time: "--:--:--" },
  { id: "f3", type: "ok", msg: "Hub bağlantı monitörü aktif", sub: "HubControlAgent → IST", time: "--:--:--" },
  { id: "f4", type: "msg", msg: "Bildirim servisi bekleniyor", sub: "NotificationService → Hazır", time: "--:--:--" },
  { id: "f5", type: "ai", msg: "EU261 uyum motoru yüklendi", sub: "CompensationAgent → Aktif", time: "--:--:--" },
]

const LIVE_DEMO: FeedEvent[] = [
  { id: "d1", type: "crisis", msg: "Kriz tetiklendi: TK1981 iptali", sub: "AI Koordinatör → TK1981", time: "12:42:11" },
  { id: "d2", type: "ai",     msg: "MILP optimizasyon başlatıldı — 189 yolcu", sub: "CrisisSolver → Kriz #1", time: "12:42:14" },
  { id: "d3", type: "ai",     msg: "EU261 hakları hesaplandı: €42.000", sub: "CompensationAgent → Kriz #1", time: "12:43:02" },
  { id: "d4", type: "ok",     msg: "25 yolcu için otel kararı üretildi", sub: "CrisisCoordinator → Hilton T4", time: "12:44:18" },
  { id: "d5", type: "warn",   msg: "Hub aktarma riski: 34 yolcu", sub: "HubControlAgent → IST Hub", time: "12:45:30" },
  { id: "d6", type: "hotel",  msg: "Hilton T4: 45 oda rezervasyonu", sub: "VouchersService → Kriz #1", time: "12:46:00" },
  { id: "d7", type: "ok",     msg: "Elite/VIP yolcular önceliklendirildi", sub: "RebookingAgent → 8 Elite", time: "12:47:20" },
  { id: "d8", type: "msg",    msg: "SMS/Email gönderildi — 189/189 yolcu", sub: "NotificationService → Tamamlandı", time: "12:48:05" },
  { id: "d9", type: "ok",     msg: "Tüm kararlar onaylandı", sub: "manager@jetnexus.ai → Kriz #1", time: "12:49:00" },
]

function typeStyle(type: EventType) {
  switch (type) {
    case "crisis":  return { color: "#ef4444", Icon: Zap }
    case "ai":      return { color: "#E81932", Icon: Cpu }
    case "ok":      return { color: "#10b981", Icon: CheckCircle2 }
    case "warn":    return { color: "#E81932", Icon: AlertTriangle }
    case "hotel":   return { color: "#8b5cf6", Icon: Hotel }
    case "msg":     return { color: "#7070a0", Icon: MessageSquare }
    default:        return { color: "#4a4872", Icon: Activity }
  }
}

function operatorType(op: string, action: string): EventType {
  const combined = (op + action).toLowerCase()
  if (combined.includes("kriz") || combined.includes("crisis") || combined.includes("tetiklen")) return "crisis"
  if (combined.includes("agent") || combined.includes("solver") || combined.includes("coordinator") || combined.includes("milp")) return "ai"
  if (combined.includes("voucher") || combined.includes("hotel") || combined.includes("otel")) return "hotel"
  if (combined.includes("notification") || combined.includes("sms") || combined.includes("email") || combined.includes("bildirim")) return "msg"
  if (combined.includes("uyar") || combined.includes("risk") || combined.includes("warn")) return "warn"
  if (combined.includes("@") || combined.includes("onay") || combined.includes("tamamland")) return "ok"
  return "ai"
}

interface AiActivityFeedProps {
  hasCrisis?: boolean
}

export function AiActivityFeed({ hasCrisis = false }: AiActivityFeedProps) {
  const [events, setEvents] = useState<FeedEvent[]>(FALLBACK)
  const [pulse, setPulse] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      try {
        const logs: AuditLog[] = await ioccApi.audit()
        if (logs.length > 0) {
          const mapped: FeedEvent[] = logs.slice(0, 30).map(l => ({
            id: String(l.id),
            type: operatorType(l.agent, l.action),
            msg: l.details || l.action,
            sub: `${l.agent} → Kriz #${l.crisis_id}`,
            time: new Date(l.timestamp).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          }))
          setEvents(mapped.reverse())
          setPulse(true)
          setTimeout(() => setPulse(false), 600)
        } else if (hasCrisis) {
          setEvents(LIVE_DEMO)
        }
      } catch {
        if (hasCrisis) setEvents(LIVE_DEMO)
      }
    }
    load()
    const id = setInterval(load, 8_000)
    return () => clearInterval(id)
  }, [hasCrisis])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [events])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#ebebf2] shrink-0">
        <div className="flex items-center gap-1.5">
          <Users className="w-3 h-3 text-[#7777aa]" />
          <span className="text-[9px] font-bold text-[#999aaa] uppercase tracking-[0.15em]">AI Olay Akışı</span>
        </div>
        <div className={`flex items-center gap-1 transition-colors ${pulse ? "text-[#E81932]" : "text-[#10b981]"}`}>
          <span className={`w-1 h-1 rounded-full animate-pulse ${pulse ? "bg-[#E81932]" : "bg-[#10b981]"}`} />
          <span className="text-[9px]">canlı</span>
        </div>
      </div>

      {/* Event list */}
      <div ref={listRef} className="flex-1 overflow-y-auto">
        {events.map((ev, i) => {
          const { color, Icon } = typeStyle(ev.type)
          const isLast = i === events.length - 1
          return (
            <div key={ev.id}
              className={`relative flex gap-2 px-2.5 py-1.5 transition-colors hover:bg-[#f0f0f6]/50 ${isLast ? "bg-[#E81932]/5" : ""}`}>
              {/* Timeline connector */}
              <div className="flex flex-col items-center gap-0 shrink-0" style={{ width: 20 }}>
                <div className="mt-0.5 p-1 rounded-md shrink-0" style={{ backgroundColor: `${color}18` }}>
                  <Icon style={{ color, width: 9, height: 9 }} />
                </div>
                {!isLast && <div className="w-px bg-[#e0e0ea] flex-1 mt-0.5" style={{ minHeight: 6 }} />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-1">
                <p className="text-[10px] leading-snug" style={{ color: isLast ? "#E81932" : "#444455" }}>
                  {ev.msg}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[8px] font-mono text-[#9999bb]">{ev.time}</span>
                  <span className="text-[8px] text-[#9999bb] truncate">{ev.sub}</span>
                </div>
              </div>

              {isLast && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r" style={{ backgroundColor: color, opacity: 0.5 }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
