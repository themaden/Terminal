import React from 'react';

export default function CostBreakdown() {
  const breakdown = [
    { name: "Yeniden Rezervasyon Farkı", cost: 1250, percent: 12.5, color: "#06b6d4" }, // Cyan
    { name: "EU261 Tazminat Yükü", cost: 6000, percent: 60.0, color: "#C8102E" },   // Crimson
    { name: "Radisson Blu / Otel Giderleri", cost: 2000, percent: 20.0, color: "#f59e0b" }, // Amber
    { name: "Kumanya / İkram Giderleri", cost: 750, percent: 7.5, color: "#10b981" }    // Emerald
  ];

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col gap-6 w-full text-white select-none">
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <h2 className="text-lg font-bold text-surface-bright font-display tracking-tight flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
            payments
          </span>
          Kriz Maliyet Analizi & Dağılımı
        </h2>
      </div>

      <div className="flex flex-col gap-6">
        {/* Cost Stats Grid */}
        <div className="grid grid-cols-2 gap-4 bg-black/25 p-4 rounded-xl border border-white/5">
          <div>
            <span className="text-[10px] font-bold text-surface-bright/50 uppercase tracking-wider block">Tahmini Toplam Maliyet</span>
            <div className="text-2xl font-mono font-bold text-primary-fixed text-shadow-glow">10,000 EUR</div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">MILP Tasarrufu</span>
            <div className="text-lg font-mono font-bold text-emerald-400">+3,450 EUR</div>
          </div>
        </div>

        {/* CSS-only Progress split bar */}
        <div className="flex h-3.5 rounded-full overflow-hidden bg-white/10 border border-white/5">
          {breakdown.map((item) => (
            <div 
              key={item.name} 
              style={{
                width: `${item.percent}%`,
                backgroundColor: item.color
              }}
              title={`${item.name}: ${item.cost} EUR`}
            />
          ))}
        </div>

        {/* Legend grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {breakdown.map((item) => (
            <div key={item.name} className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-surface-bright/60">{item.name}</span>
                <strong className="text-xs font-mono text-surface-bright font-bold mt-0.5">
                  {item.cost} EUR ({item.percent}%)
                </strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
