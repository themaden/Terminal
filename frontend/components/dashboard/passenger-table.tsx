"use client"

import { useState, useMemo } from "react"
import { Search, Crown, Users, UserX } from "lucide-react"

interface Passenger {
  pnr: string
  name: string
  company: string
  profile: "Elite" | "Aile" | "UM" | string
  location: string
  assignedHotel: string
  status: string
}

interface PassengerTableProps {
  passengers: Passenger[]
  title: string
}

function ProfileBadge({ profile }: { profile: string }) {
  if (profile === "Elite")
    return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-[#E81932]/15 text-[#E81932] border border-[#E81932]/25"><Crown className="w-2.5 h-2.5" />Elite</span>
  if (profile === "Aile")
    return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-[#3b82f6]/15 text-[#3b82f6] border border-[#3b82f6]/25"><Users className="w-2.5 h-2.5" />Aile</span>
  if (profile === "UM")
    return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-[#E81932]/15 text-[#E81932] border border-[#E81932]/25">UM</span>
  return <span className="px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-[#dddde8] text-[#555566] border border-[#dddde6]">{profile || "—"}</span>
}

export function PassengerTable({ passengers, title }: PassengerTableProps) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return passengers
    return passengers.filter(p =>
      p.pnr.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.profile.toLowerCase().includes(q) ||
      p.assignedHotel.toLowerCase().includes(q)
    )
  }, [passengers, query])

  return (
    <div className="bg-[#f9f9fc] border border-[#ebebf2] rounded-xl overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#ebebf2] bg-[#f4f4f8]">
        <h3 className="text-[10px] font-bold text-[#555566] uppercase tracking-[0.12em]">{title}</h3>
        {query && <span className="text-[9px] text-[#E81932] font-medium">{filtered.length}/{passengers.length}</span>}
      </div>

      {/* Search */}
      <div className="px-2 py-1.5 border-b border-[#ebebf2]">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#999aaa]" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="PNR, isim, profil ara…"
            className="w-full bg-[#ededf4] border border-[#ebebf2] rounded-lg pl-7 pr-3 py-1.5 text-[11px] text-[#111111] placeholder:text-[#999aaa] focus:outline-none focus:border-[#dddde6] transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <UserX className="w-6 h-6 text-[#bbbbcc]" />
            <p className="text-[11px] text-[#999aaa]">Sonuç bulunamadı</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-[#ededf4] sticky top-0">
              <tr>
                {["PNR", "İsim", "Profil", "Otel", "Durum"].map(h => (
                  <th key={h} className="text-left px-2 py-1.5 text-[9px] text-[#999aaa] font-semibold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={`${p.pnr}-${i}`} className="border-b border-[#f0f0f5] hover:bg-[#f0f0f6]/60 transition-colors">
                  <td className="px-2 py-2 text-[10px] text-[#E81932] font-mono font-semibold">{p.pnr}</td>
                  <td className="px-2 py-2">
                    <p className="text-[11px] text-[#111111] font-medium leading-none">{p.name}</p>
                    <p className="text-[9px] text-[#999aaa] mt-0.5">{p.company}</p>
                  </td>
                  <td className="px-2 py-2"><ProfileBadge profile={p.profile} /></td>
                  <td className="px-2 py-2 text-[10px] text-[#666677] truncate max-w-[72px]">{p.assignedHotel}</td>
                  <td className="px-2 py-2 text-[10px] text-[#555566]">{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
