import React from 'react';

export default function CostBreakdown() {
  const breakdown = [
    { name: "Yeniden Rezervasyon Farkı", cost: 1250, percent: 12.5, color: "#455f88" }, // Secondary blue
    { name: "EU261 Tazminat Yükü", cost: 6000, percent: 60.0, color: "#9e001f" },   // Primary crimson
    { name: "Radisson Blu / Otel Giderleri", cost: 2000, percent: 20.0, color: "#f59e0b" }, // Amber
    { name: "Kumanya / İkram Giderleri", cost: 750, percent: 7.5, color: "#10b981" }    // Emerald
  ];

  return (
    <div className="glass-card rounded-2xl p-8 flex flex-col gap-6 w-full">
      <div className="flex justify-between items-center border-b border-flow-silver pb-4">
        <h2 className="text-headline-md font-display font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">payments</span>
          Kriz Maliyet Analizi & Dağılımı
        </h2>
      </div>

      <div className="flex flex-col gap-6">
        {/* Cost Stats Grid */}
        <div className="grid grid-cols-2 gap-4 bg-surface-light/30 p-4 rounded-xl border border-flow-silver/30">
          <div>
            <span className="text-label-sm font-label-sm text-on-surface-variant uppercase">Tahmini Toplam Maliyet</span>
            <div className="text-display-lg font-mono font-bold text-primary">10,000 EUR</div>
          </div>
          <div className="text-right">
            <span className="text-label-sm font-label-sm text-emerald uppercase font-bold">MILP Tasarrufu</span>
            <div className="text-headline-lg font-mono font-bold text-emerald">+3,450 EUR</div>
          </div>
        </div>

        {/* CSS-only Progress split bar */}
        <div className="flex h-4 rounded-full overflow-hidden bg-surface-container-high border border-flow-silver/30">
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
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <div className="flex flex-col">
                <span className="text-label-sm text-on-surface-variant">{item.name}</span>
                <strong className="text-body-md font-mono text-on-surface">
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
