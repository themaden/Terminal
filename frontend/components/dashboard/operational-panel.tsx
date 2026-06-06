"use client"

import { useState } from "react"
import { CheckCircle, XCircle, Loader2, Zap, Cpu, CheckCircle2, Clock } from "lucide-react"
import { vouchersApi, proactiveApi } from "@/lib/api"
import { AiActivityFeed } from "./ai-activity-feed"

interface Rule {
  id: string
  name: string
  status: "TAMAMLANDI" | "DEVAM EDIYOR" | "BEKLEMEDE"
}

interface Action {
  id: string
  label: string
  variant: "primary" | "secondary"
  crisisId: string
  actionType: "voucher" | "bus" | "notify"
}

interface OperationalPanelProps {
  rules: Rule[]
  actions: Action[]
  onRefresh?: () => void
  hasCrisis?: boolean
}

type FeedbackState = { type: "success" | "error"; message: string } | null

function statusMeta(status: string) {
  if (status === "TAMAMLANDI")   return { color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)",  Icon: CheckCircle2 }
  if (status === "DEVAM EDIYOR") return { color: "#E81932", bg: "rgba(232,25,50,0.08)",  border: "rgba(232,25,50,0.2)",  Icon: Cpu }
  return                                { color: "#E81932", bg: "rgba(232,25,50,0.08)", border: "rgba(232,25,50,0.2)", Icon: Clock }
}

export function OperationalPanel({ rules, actions, onRefresh, hasCrisis = false }: OperationalPanelProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<FeedbackState>(null)

  function showFeedback(type: "success" | "error", message: string) {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 4000)
  }

  async function handleAction(action: Action) {
    if (!action.crisisId) { showFeedback("error", "Aktif kriz bulunamadı"); return }
    setLoading(action.id)
    try {
      if (action.actionType === "voucher") {
        const result = await vouchersApi.bulkIssue(action.crisisId)
        showFeedback("success", `${result.issued ?? "Tüm"} yolcuya otel kuponu gönderildi`)
        onRefresh?.()
      } else if (action.actionType === "notify") {
        const result = await proactiveApi.notifyCrisis(action.crisisId)
        showFeedback("success", `${result.sent ?? "Tüm"} yolcuya bildirim gönderildi`)
      } else {
        showFeedback("success", "Transfer otobüsü sevki başlatıldı")
      }
    } catch (err: unknown) {
      showFeedback("error", err instanceof Error ? err.message : "İşlem başarısız")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="w-[17rem] bg-[#f5f5f8] border-l border-[#ebebf2] flex flex-col h-full">

      {/* Header */}
      <div className="px-4 py-3 border-b border-[#ebebf2] shrink-0">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-[#E81932]" />
          <h3 className="text-[10px] font-bold text-[#666677] uppercase tracking-[0.14em]">
            Operasyonel Koordinasyon
          </h3>
        </div>
      </div>

      {/* Active Rules */}
      <div className="px-3 py-2.5 border-b border-[#ebebf2] shrink-0">
        <p className="text-[8px] text-[#9999bb] uppercase tracking-[0.2em] mb-2 font-semibold">Aktif Kurallar</p>
        <div className="space-y-1.5">
          {rules.map(rule => {
            const { color, bg, border, Icon } = statusMeta(rule.status)
            return (
              <div key={rule.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg"
                style={{ backgroundColor: bg, border: `1px solid ${border}` }}>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Icon style={{ color, width: 10, height: 10 }} className="shrink-0" />
                  <span className="text-[10px] text-[#555566] truncate">{rule.name}</span>
                </div>
                <span className="text-[8px] font-bold shrink-0" style={{ color }}>{rule.status}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`mx-3 mt-2 flex items-start gap-2 rounded-lg px-2.5 py-2 text-xs border shrink-0 ${
          feedback.type === "success"
            ? "bg-[#10b981]/10 border-[#10b981]/20 text-[#10b981]"
            : "bg-[#ef4444]/10 border-[#ef4444]/20 text-[#ef4444]"
        }`}>
          {feedback.type === "success"
            ? <CheckCircle className="w-3 h-3 shrink-0 mt-0.5" />
            : <XCircle    className="w-3 h-3 shrink-0 mt-0.5" />}
          <span className="text-[10px]">{feedback.message}</span>
        </div>
      )}

      {/* Actions */}
      <div className="px-3 py-2.5 border-b border-[#ebebf2] shrink-0 space-y-1.5">
        {actions.map(action => (
          <button key={action.id} onClick={() => handleAction(action)} disabled={loading === action.id}
            className={`w-full px-3 py-2 rounded-lg text-[10px] font-bold transition-all duration-150 text-left flex items-center gap-2 disabled:opacity-40 tracking-wide ${
              action.variant === "primary"
                ? "bg-[#E81932] text-[#0a0a10] hover:bg-[#FF2F46] shadow-lg shadow-[#E81932]/15"
                : "bg-[#ebebf0] text-[#555566] hover:bg-[#e6e6ef] border border-[#dddde6] hover:border-[#2c2c48] hover:text-[#888899]"
            }`}>
            {loading === action.id
              ? <Loader2 className="w-3 h-3 animate-spin shrink-0" />
              : <span className="w-1 h-1 rounded-full bg-current opacity-50 shrink-0" />}
            {action.label}
          </button>
        ))}
      </div>

      {/* AI Activity Feed */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <AiActivityFeed hasCrisis={hasCrisis} />
      </div>

      {/* Status footer */}
      <div className="px-3 py-2 border-t border-[#ebebf2] shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${hasCrisis ? "bg-[#ef4444]" : "bg-[#10b981]"}`} />
            <span className="text-[9px] text-[#999aaa]">{hasCrisis ? "Kriz Modu Aktif" : "AI Sistemi Aktif"}</span>
          </div>
          <span className="text-[8px] text-[#bbbbcc] font-mono">v1.0</span>
        </div>
      </div>
    </div>
  )
}
