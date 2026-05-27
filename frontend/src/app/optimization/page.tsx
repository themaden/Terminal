'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Check, Search, Wind, CloudRain, ShieldAlert, Award, Compass } from 'lucide-react';

interface FlightData {
  id: string;
  flightNumber: string;
  origin: string;
  destination: string;
  altitude: string;
  suggestedAltitude: string;
  appliedAltitude: string;
  groundSpeed: string;
  groundSpeedOptimized: string;
  headwind: string;
  headwindOptimized: string;
  distance: string;
  reason: string;
  fuelSave: string;
  timeDelta: string;
  applied: boolean;
  status: string;
  points: {
    path: string;
    start: { cx: number; cy: number };
    end: { cx: number; cy: number };
  };
}

export default function RouteOptimization() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFlightId, setSelectedFlightId] = useState('TK1992');
  const [applyingId, setApplyingId] = useState<string | null>(null);
  
  // Interactive layer overlays
  const [isWeatherActive, setIsWeatherActive] = useState(false);
  const [isWindActive, setIsWindActive] = useState(true);
  const [isPathsActive, setIsPathsActive] = useState(true);

  // Custom Toast notifications
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'info' }[]>([]);

  // Simulation Flights State
  const [flights, setFlights] = useState<FlightData[]>([
    {
      id: 'TK1992',
      flightNumber: 'TK1992',
      origin: 'IST',
      destination: 'LHR',
      altitude: 'FL350',
      suggestedAltitude: 'FL330',
      appliedAltitude: 'FL330',
      groundSpeed: '480 kts',
      groundSpeedOptimized: '505 kts',
      headwind: '65 kts baş rüzgarı',
      headwindOptimized: '28 kts baş rüzgarı',
      distance: '2,500 km',
      reason: 'FL350\'de şiddetli baş rüzgarı (Jetstream) nedeniyle aşırı yakıt sarfiyatı tespit edildi. FL330 seviyesine alçalarak karşı rüzgar etkisini azaltmak ve optimum süzülüş profilini yakalamak önerilmektedir.',
      fuelSave: '1,200 kg',
      timeDelta: '+2 dk',
      applied: false,
      status: 'AI Optimized',
      points: {
        path: 'M 100,300 C 300,100 500,400 800,200',
        start: { cx: 100, cy: 300 },
        end: { cx: 800, cy: 200 }
      }
    },
    {
      id: 'TK001',
      flightNumber: 'TK001',
      origin: 'IST',
      destination: 'JFK',
      altitude: 'FL330',
      suggestedAltitude: 'FL370',
      appliedAltitude: 'FL370',
      groundSpeed: '510 kts',
      groundSpeedOptimized: '538 kts',
      headwind: '90 kts kuyruk rüzgarı',
      headwindOptimized: '122 kts kuyruk rüzgarı',
      distance: '8,000 km',
      reason: 'FL370 irtifa seviyesinde güneyli Jetstream rüzgar koridoru (kuyruk rüzgarı) algılandı. Bu irtifaya tırmanarak motor N1 devrini ve dolayısıyla yakıt debisini düşürmek mümkündür.',
      fuelSave: '3,400 kg',
      timeDelta: '-18 dk',
      applied: false,
      status: 'Cruising',
      points: {
        path: 'M 120,280 C 250,150 480,200 750,250',
        start: { cx: 120, cy: 280 },
        end: { cx: 750, cy: 250 }
      }
    },
    {
      id: 'TK065',
      flightNumber: 'TK065',
      origin: 'IST',
      destination: 'BKK',
      altitude: 'FL370',
      suggestedAltitude: 'FL390',
      appliedAltitude: 'FL390',
      groundSpeed: '495 kts',
      groundSpeedOptimized: '512 kts',
      headwind: '40 kts yan rüzgar',
      headwindOptimized: '15 kts yan rüzgar',
      distance: '7,500 km',
      reason: 'GOMOL ile TIKAM uçuş noktaları arasında FL370 seviyesinde orta dereceli Clear Air Turbulence (CAT) bulunmaktadır. FL390 seviyesine tırmanarak daha stabil bir tabakaya geçiş ve yolcu konforu sağlanır.',
      fuelSave: '850 kg',
      timeDelta: '-4 dk',
      applied: false,
      status: 'Active',
      points: {
        path: 'M 180,340 C 380,280 580,350 820,380',
        start: { cx: 180, cy: 340 },
        end: { cx: 820, cy: 380 }
      }
    }
  ]);

  // Real-time updating clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch logged user
  useEffect(() => {
    const savedUser = localStorage.getItem('jetnexus_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      setUser({ name: 'Hakan Yılmaz', role: 'Operations Director', avatar: 'HY' });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('jetnexus_user');
    window.location.href = '/dashboard';
  };

  const addToast = (message: string, type: 'success' | 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Apply AI flight level optimization
  const applyAIPlan = (flightId: string) => {
    setApplyingId(flightId);
    
    // Simulate telemetry propagation delay to kokpit
    setTimeout(() => {
      setFlights((prev) =>
        prev.map((f) => (f.id === flightId ? { ...f, applied: true } : f))
      );
      setApplyingId(null);
      const selected = flights.find(f => f.id === flightId);
      addToast(
        `${flightId} uçuşu için ${selected?.suggestedAltitude} seviyesi optimizasyonu kokpite iletildi ve onaylandı!`,
        'success'
      );
    }, 1200);
  };

  const selectedFlight = flights.find((f) => f.id === selectedFlightId) || flights[0];

  const filteredFlights = flights.filter((f) =>
    f.flightNumber.toLowerCase().includes(queryCleaner(searchQuery)) ||
    f.origin.toLowerCase().includes(queryCleaner(searchQuery)) ||
    f.destination.toLowerCase().includes(queryCleaner(searchQuery))
  );

  function queryCleaner(q: string) {
    return q.replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase();
  }

  const menuItems = [
    { name: 'Sistem Durumu', path: '/dashboard' },
    { name: 'Kriz Yönetimi', path: '/crisis' },
    { name: 'Rota Optimizasyonu', path: '/optimization' },
    { name: 'Yolcu Takip', path: '/passengers' },
    { name: 'Uçuş Kontrol', path: '/flights' },
    { name: 'Audit Günlüğü', path: '/audit' }
  ];

  return (
    <div className="font-body-md antialiased overflow-hidden h-screen w-screen flex flex-col relative text-white bg-[#001229]">
      
      {/* 🧭 PREMIUM HUD NAVIGATION HEADER */}
      <header className="bg-surface-dark/95 backdrop-blur-xl shadow-none w-full z-50 flex justify-between items-center px-6 py-4 border-b border-white/10 shrink-0 select-none">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-xl font-display font-bold text-surface-bright flex items-center gap-2.5 group">
            <span className="material-symbols-outlined text-primary-container group-hover:scale-110 transition-transform duration-300" style={{ fontVariationSettings: "'FILL' 1" }}>
              flight_takeoff
            </span>
            <span className="tracking-tight">JetNexus AI</span>
          </Link>
          
          <nav className="hidden md:flex gap-6">
            {menuItems.map((item) => {
              const isActive = item.path === '/optimization';
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`text-label-md font-label-md transition-all duration-300 pb-1.5 pt-0.5 border-b-2 px-1 ${
                    isActive
                      ? 'text-primary-fixed border-primary-container font-bold text-shadow-glow'
                      : 'text-surface-bright/70 border-transparent hover:text-primary-fixed hover:border-white/20'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          {/* Real-time Clock display */}
          <div className="hidden lg:flex items-center gap-2 bg-[#002349] px-3.5 py-1.5 rounded-full border border-white/10 font-mono text-xs text-primary-fixed select-none shadow-[0_0_10px_rgba(255,218,216,0.05)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            UTC+3 {currentTime || '--:--:--'}
          </div>

          {/* Search bar inside HUD header */}
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-bright/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Uçuş, Rota Ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#002349] border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-xs text-surface-bright focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container w-52 transition-all duration-300 placeholder-white/30"
            />
          </div>

          {/* User Section */}
          {user && (
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full pl-3 pr-4 py-1">
              <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-xs select-none">
                {user.avatar}
              </div>
              <div className="text-left hidden xl:block select-none">
                <div className="text-xs font-bold text-surface-bright leading-none">{user.name}</div>
                <span className="text-[9px] text-surface-bright/50">{user.role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-white/40 hover:text-primary-container transition-colors duration-300 pl-1 border-l border-white/10 ml-1"
                title="Oturumu Kapat"
              >
                <LogOut size={13} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 🚀 MAIN COCKPIT DASHBOARD WORKSPACE */}
      <main className="flex-1 flex overflow-hidden relative">

        {/* 🗺️ HIGH-TECH FLIGHT MAP BACKGROUND */}
        <div className="absolute inset-0 z-0 bg-[#001229] select-none">
          <img
            alt="High-tech Flight Map"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBytsmCWC34wk42KVHE3W37jDB36VhwTrgMfO_r_nF8Kd48v6R3W3jot69bOardFgvGZ__SS596uaA0AI-fLamD9Hnw_t8SJ7R7yen22ZwZ7VjSGYWsVvH3fC6yiGxykULfiiRkjXxCo-wHi11OL-ANXJ-gE0yMst_YR9H8xnQ3Bsos0SeUdA-gI8H0yW-kIG_-yoxbgVr-HNh5m1-pZcmHIlyaKKKwQgje5blZJhR1gzcNlYZ8i2j8n6Fmc9FTwS7_1Ars1lPm9Boh"
            className="w-full h-full object-cover opacity-25 mix-blend-screen pointer-events-none scale-105"
          />

          {/* 🌟 VECTOR ROUTE DRAWINGS & ANIME FLOWS */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" preserveAspectRatio="none" viewBox="0 0 1000 500">
            {/* Dynamic Weather overlay cells */}
            {isWeatherActive && (
              <>
                <g className="animate-pulse">
                  <circle cx="450" cy="220" r="45" fill="rgba(158,0,31,0.2)" stroke="rgba(158,0,31,0.4)" strokeWidth="1.5" strokeDasharray="3,3" />
                  <text x="450" y="225" fill="#ffb3b1" className="text-[10px] font-bold text-center" textAnchor="middle">CAT ZONU</text>
                </g>
                <g className="animate-pulse" style={{ animationDelay: '1s' }}>
                  <circle cx="300" cy="140" r="30" fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.3)" strokeWidth="1" />
                  <text x="300" y="143" fill="#f59e0b" className="text-[8px] font-bold" textAnchor="middle">GÖKGÜRÜLTÜLÜ CELL</text>
                </g>
              </>
            )}

            {/* Jetstream Wind vector layers */}
            {isWindActive && (
              <g className="opacity-40" stroke="#adc8f6" strokeWidth="1">
                {/* Winds flow lines */}
                <path d="M 50,120 Q 250,90 450,150 T 850,80" fill="none" strokeDasharray="8,6" className="animate-marquee-slow" />
                <path d="M 100,250 Q 300,220 500,290 T 900,210" fill="none" strokeDasharray="8,6" className="animate-marquee" />
                <path d="M 50,380 Q 280,330 510,410 T 880,320" fill="none" strokeDasharray="8,6" className="animate-marquee-slow" />
                <text x="480" y="130" fill="#adc8f6" className="text-[8px] font-mono tracking-widest">JETSTREAM 110 KTS ➔</text>
              </g>
            )}

            {/* Alternatif candidate flight path (Dashed path) */}
            {isPathsActive && (
              <path
                d={selectedFlight.points.path}
                fill="none"
                opacity="0.25"
                stroke="#adc8f6"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />
            )}

            {/* 📍 Active optimized real flight path */}
            <path
              className="flow-line transition-all duration-700 ease-in-out"
              key={selectedFlight.id}
              d={selectedFlight.points.path}
              fill="none"
              opacity="0.85"
              stroke={selectedFlight.applied ? "#10b981" : "#C8102E"}
              strokeLinecap="round"
              strokeWidth={selectedFlight.applied ? "3" : "2.5"}
            />

            {/* Origin Airport Point */}
            <circle cx={selectedFlight.points.start.cx} cy={selectedFlight.points.start.cy} fill="#ffffff" r="4" className="shadow-lg" />
            <circle cx={selectedFlight.points.start.cx} cy={selectedFlight.points.start.cy} fill="none" stroke="#C8102E" strokeWidth="1" r="9" className="animate-ping" />
            <text x={selectedFlight.points.start.cx} y={selectedFlight.points.start.cy + 18} fill="#ffffff" className="text-[10px] font-mono font-bold" textAnchor="middle">
              {selectedFlight.origin}
            </text>

            {/* Destination Airport Point */}
            <circle cx={selectedFlight.points.end.cx} cy={selectedFlight.points.end.cy} fill={selectedFlight.applied ? "#10b981" : "#C8102E"} r="6" />
            <circle cx={selectedFlight.points.end.cx} cy={selectedFlight.points.end.cy} fill="none" stroke={selectedFlight.applied ? "#10b981" : "#C8102E"} strokeWidth="1" r="12" className="animate-pulse" />
            <text x={selectedFlight.points.end.cx} y={selectedFlight.points.end.cy - 12} fill="#ffffff" className="text-[10px] font-mono font-bold" textAnchor="middle">
              {selectedFlight.destination}
            </text>

            {/* Moving Flight HUD icon */}
            <g className="animate-bounce" style={{ animationDuration: '3s' }}>
              <circle
                cx={selectedFlight.points.start.cx + (selectedFlight.points.end.cx - selectedFlight.points.start.cx) * 0.45}
                cy={selectedFlight.points.start.cy + (selectedFlight.points.end.cy - selectedFlight.points.start.cy) * 0.45 - 20}
                r="3"
                fill="#ffffff"
              />
              <circle
                cx={selectedFlight.points.start.cx + (selectedFlight.points.end.cx - selectedFlight.points.start.cx) * 0.45}
                cy={selectedFlight.points.start.cy + (selectedFlight.points.end.cy - selectedFlight.points.start.cy) * 0.45 - 20}
                r="8"
                fill="none"
                stroke={selectedFlight.applied ? "#10b981" : "#C8102E"}
                strokeWidth="1"
                className="animate-ping"
              />
            </g>
          </svg>
        </div>

        {/* 🎚️ LEFT PANEL: ACTIVE FLIGHT LIST */}
        <aside className="w-80 bg-surface-dark/65 backdrop-blur-xl border-r border-white/10 z-10 flex flex-col m-4 rounded-xl border-l-4 border-l-primary-container shadow-2xl relative select-none">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#001b3c]/40 rounded-t-xl">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-primary-fixed animate-spin-slow" />
              <h2 className="text-xs font-bold text-surface-bright tracking-wider uppercase">Aktif Rotalar</h2>
            </div>
            <span className="text-[10px] bg-primary/20 text-primary-fixed px-2 py-0.5 rounded-full border border-primary/30">
              {filteredFlights.length} Uçuş
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
            {filteredFlights.length > 0 ? (
              filteredFlights.map((flight) => {
                const isSelected = flight.id === selectedFlightId;
                return (
                  <div
                    key={flight.id}
                    onClick={() => setSelectedFlightId(flight.id)}
                    className={`rounded-lg p-3.5 cursor-pointer border transition-all duration-300 relative overflow-hidden group ${
                      isSelected
                        ? 'bg-white/10 border-primary-container/80 shadow-[0_0_15px_rgba(200,16,46,0.15)]'
                        : 'bg-white/5 border-white/5 hover:bg-white/8 hover:border-white/10'
                    }`}
                  >
                    {/* Glowing highlight indicator */}
                    {isSelected && (
                      <div className="absolute top-0 left-0 h-full w-1 bg-primary-container"></div>
                    )}

                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold tracking-wider text-surface-bright font-display group-hover:text-primary-fixed transition-colors">
                        {flight.flightNumber}
                      </span>
                      {flight.applied ? (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold border border-emerald-500/30 flex items-center gap-1">
                          <Check size={8} /> Uygulandı
                        </span>
                      ) : (
                        <span className={`text-[9px] px-2 py-0.5 rounded font-medium border ${
                          flight.status === 'AI Optimized'
                            ? 'bg-primary-container/20 text-primary-fixed border-primary-container/30 animate-pulse'
                            : 'bg-white/10 text-surface-bright/70 border-white/10'
                        }`}>
                          {flight.status}
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-xs text-surface-bright/70">
                      <div className="flex items-center gap-1 font-mono">
                        <span>{flight.origin}</span>
                        <span className="material-symbols-outlined text-[10px] text-white/40">flight</span>
                        <span>{flight.destination}</span>
                      </div>
                      <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-white/50 font-mono">
                        {flight.applied ? flight.suggestedAltitude : flight.altitude}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-surface-bright/40">
                <span className="material-symbols-outlined text-3xl mb-2 block text-white/20">search_off</span>
                <p className="text-xs">Uçuş bulunamadı.</p>
              </div>
            )}
          </div>
        </aside>

        {/* 📊 RIGHT PANEL: DETAIL TELEMETRY & AI HUB */}
        <aside className="w-[420px] bg-surface-dark/65 backdrop-blur-xl border-l border-white/10 z-10 flex flex-col m-4 ml-auto rounded-xl shadow-2xl overflow-hidden select-none">
          <div className="p-5 border-b border-white/10 bg-[#001b3c]/40">
            <div className="flex justify-between items-start mb-1">
              <div>
                <h2 className="text-lg font-bold text-surface-bright font-display tracking-tight flex items-center gap-2">
                  Uçuş Rota Kartı
                  <span className="text-xs bg-[#002349] px-2.5 py-0.5 rounded-full text-primary-fixed font-mono border border-white/10">
                    {selectedFlight.flightNumber}
                  </span>
                </h2>
                <p className="text-[11px] text-surface-bright/50 tracking-wide uppercase mt-0.5">
                  {selectedFlight.origin} Havalimanı ➔ {selectedFlight.destination} Havalimanı
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
            
            {/* 🧠 AI SUGGESTION COCKPIT PANEL */}
            <div className="bg-gradient-to-br from-[#001c3c] to-[#002652] border border-primary-container/40 rounded-xl p-4.5 shadow-[0_0_20px_rgba(200,16,46,0.12)] relative overflow-hidden">
              {/* Futuristic grid overlay */}
              <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>

              <div className="flex items-center justify-between mb-3.5 relative z-10">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-primary-fixed animate-pulse text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                    model_training
                  </span>
                  <h3 className="text-xs font-bold text-primary-fixed tracking-wider uppercase">AI Rota Optimizasyonu</h3>
                </div>
                
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/35 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Güven Skoru: 97%
                </span>
              </div>

              <p className="text-xs text-surface-bright/80 mb-5 leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5 relative z-10">
                {selectedFlight.reason}
              </p>

              <div className="grid grid-cols-2 gap-4.5 mb-5 relative z-10">
                <div className="bg-white/5 rounded-lg p-3 border border-white/5 text-center">
                  <span className="block text-[10px] text-surface-bright/40 mb-1">Tahmini Yakıt Tasarrufu</span>
                  <span className="text-base font-bold text-[#4ade80] font-display flex items-center justify-center gap-1">
                    <Award size={14} className="text-[#4ade80]" />
                    {selectedFlight.fuelSave}
                  </span>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/5 text-center">
                  <span className="block text-[10px] text-surface-bright/40 mb-1">Zaman Farkı (Delta)</span>
                  <span className="text-base font-bold text-surface-bright font-display">
                    {selectedFlight.timeDelta}
                  </span>
                </div>
              </div>

              {selectedFlight.applied ? (
                <div className="w-full bg-emerald-600/30 border border-emerald-500/50 text-emerald-400 py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 select-none">
                  <Check size={14} strokeWidth={3} />
                  Rota Optimizasyonu Uygulandı
                </div>
              ) : (
                <button
                  onClick={() => applyAIPlan(selectedFlight.id)}
                  disabled={applyingId !== null}
                  className="w-full bg-primary-container hover:bg-accent-red-hover disabled:bg-primary-container/50 text-white py-2.5 rounded-lg text-xs font-bold transition-all duration-300 border border-primary-container shadow-lg shadow-primary-container/20 flex items-center justify-center gap-2 hover:scale-[1.01]"
                >
                  {applyingId === selectedFlight.id ? (
                    <>
                      <span className="material-symbols-outlined text-xs animate-spin">autorenew</span>
                      Kokpite Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">send</span>
                      AI Rotasını Uygula & Uçuşa İlet
                    </>
                  )}
                </button>
              )}
            </div>

            {/* 📊 PERFORMANCE METRICS (BENTO STYLE) */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-surface-bright/60 tracking-wider uppercase pl-1">Canlı Telemetri Parametreleri</h3>
              
              <div className="grid grid-cols-2 gap-3">
                
                {/* Card 1 */}
                <div className="bg-white/5 hover:bg-white/8 rounded-xl p-3.5 border border-white/5 transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="block text-[10px] text-surface-bright/40 uppercase">Yer Hızı</span>
                    <Compass className="w-3.5 h-3.5 text-white/30" />
                  </div>
                  <span className="text-sm font-bold text-surface-bright font-mono">
                    {selectedFlight.applied ? selectedFlight.groundSpeedOptimized : selectedFlight.groundSpeed}
                  </span>
                  <span className="text-[9px] text-[#4ade80] block mt-0.5 font-medium">
                    {selectedFlight.applied ? '➔ Optimum Limit' : '▲ Stabil Hız'}
                  </span>
                </div>

                {/* Card 2 */}
                <div className="bg-white/5 hover:bg-white/8 rounded-xl p-3.5 border border-white/5 transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="block text-[10px] text-surface-bright/40 uppercase">İrtifa Katmanı</span>
                    <span className="material-symbols-outlined text-white/30 text-base">layers</span>
                  </div>
                  <span className={`text-sm font-bold font-mono ${selectedFlight.applied ? 'text-emerald-400' : 'text-surface-bright'}`}>
                    {selectedFlight.applied ? selectedFlight.suggestedAltitude : selectedFlight.altitude}
                  </span>
                  <span className="text-[9px] text-white/40 block mt-0.5">
                    {selectedFlight.applied ? '✓ Seviye Güncellendi' : `➔ Hedef: ${selectedFlight.suggestedAltitude}`}
                  </span>
                </div>

                {/* Card 3 */}
                <div className="bg-white/5 hover:bg-white/8 rounded-xl p-3.5 border border-white/5 transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="block text-[10px] text-surface-bright/40 uppercase">Rüzgar Direnci</span>
                    <Wind className="w-3.5 h-3.5 text-white/30" />
                  </div>
                  <span className="text-sm font-bold text-surface-bright font-mono block truncate">
                    {selectedFlight.applied ? selectedFlight.headwindOptimized : selectedFlight.headwind}
                  </span>
                  <span className={`text-[9px] block mt-0.5 font-medium ${selectedFlight.applied ? 'text-emerald-400' : 'text-primary-fixed'}`}>
                    {selectedFlight.applied ? '▼ Rüzgar Etkisi Düşürüldü' : '▲ Rüzgar Direnci Yüksek'}
                  </span>
                </div>

                {/* Card 4 */}
                <div className="bg-white/5 hover:bg-white/8 rounded-xl p-3.5 border border-white/5 transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="block text-[10px] text-surface-bright/40 uppercase">Kalan Rota</span>
                    <span className="material-symbols-outlined text-white/30 text-base">map</span>
                  </div>
                  <span className="text-sm font-bold text-surface-bright font-mono">
                    {selectedFlight.distance}
                  </span>
                  <span className="text-[9px] text-white/40 block mt-0.5">
                    Rotasyonel Sapma: 0.2%
                  </span>
                </div>

              </div>
            </div>

            {/* 🛡️ SAFETY & AUDIT GATE INFORMATION */}
            <div className="bg-white/5 border border-white/5 p-4 rounded-xl flex items-start gap-3.5">
              <ShieldAlert className="w-5 h-5 text-primary-fixed shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-surface-bright font-display">Otonom Emniyet Güvencesi</h4>
                <p className="text-[11px] text-surface-bright/60 mt-1 leading-relaxed">
                  Tüm rota revizyonları, ilgili FIR hava sahalarının güncel hava durumu, NOTAM bildirileri ve havayolu yakıt rezerv yönergelerine göre anlık denetlenir.
                </p>
              </div>
            </div>

          </div>
        </aside>

        {/* 🎛️ BOTTOM CONTROL LAYERS FLOATING TOOLBAR */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 bg-surface-dark/75 backdrop-blur-xl rounded-full px-5 py-3.5 flex gap-6 items-center border border-white/10 shadow-2xl select-none scale-105 transition-all">
          
          <button
            onClick={() => {
              setIsWeatherActive(!isWeatherActive);
              addToast(
                `Hava Durumu ve Türbülans katmanı ${!isWeatherActive ? 'aktifleştirildi' : 'kapatıldı'}.`,
                'info'
              );
            }}
            className={`flex items-center gap-2 transition-all text-xs font-bold ${
              isWeatherActive ? 'text-[#ffdad8] text-shadow-glow' : 'text-surface-bright/60 hover:text-surface-bright'
            }`}
          >
            <CloudRain size={15} className={isWeatherActive ? 'text-primary-container' : 'text-white/40'} />
            Hava Durumu Radar
          </button>

          <div className="w-px h-5 bg-white/15"></div>

          <button
            onClick={() => {
              setIsPathsActive(!isPathsActive);
              addToast(
                `Alternatif uçuş rotası katmanı ${!isPathsActive ? 'aktifleştirildi' : 'kapatıldı'}.`,
                'info'
              );
            }}
            className={`flex items-center gap-2 transition-all text-xs font-bold ${
              isPathsActive ? 'text-[#ffdad8] text-shadow-glow' : 'text-surface-bright/60 hover:text-surface-bright'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: isPathsActive ? "'FILL' 1" : "'FILL' 0" }}>route</span>
            Alternatif Rotalar
          </button>

          <div className="w-px h-5 bg-white/15"></div>

          <button
            onClick={() => {
              setIsWindActive(!isWindActive);
              addToast(
                `Wind Layers (Jetstream rüzgar akımları) katmanı ${!isWindActive ? 'aktifleştirildi' : 'kapatıldı'}.`,
                'info'
              );
            }}
            className={`flex items-center gap-2 transition-all text-xs font-bold ${
              isWindActive ? 'text-[#ffdad8] text-shadow-glow' : 'text-surface-bright/60 hover:text-surface-bright'
            }`}
          >
            <Wind size={15} className={isWindActive ? 'text-primary-container animate-pulse' : 'text-white/40'} />
            Rüzgar Katmanları
          </button>
        </div>

      </main>

      {/* 🔔 FLOATING PREMIUM NOTIFICATION TOAST OVERLAY */}
      <div className="absolute top-20 right-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none select-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl p-4 shadow-2xl border transition-all duration-300 animate-slide-in ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
                : 'bg-[#002349]/95 border-white/10 text-primary-fixed'
            }`}
          >
            <span className="material-symbols-outlined text-sm mt-0.5 shrink-0">
              {toast.type === 'success' ? 'check_circle' : 'info'}
            </span>
            <p className="text-xs font-medium leading-relaxed">{toast.message}</p>
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        /* Custom scrollbar for HUD panels */
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.01);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.25);
        }
        
        .text-shadow-glow {
          text-shadow: 0 0 10px rgba(255, 218, 216, 0.6);
        }

        .animate-spin-slow {
          animation: spin 16s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .bg-grid-pattern {
          background-size: 20px 20px;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
        }

        /* Dash animation for map lines */
        .flow-line {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: dash 3.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }

        /* Slide in animation for toasts */
        .animate-slide-in {
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideIn {
          from {
            transform: translateX(100%) scale(0.9);
            opacity: 0;
          }
          to {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }

        /* Wind marquee flows */
        .animate-marquee {
          stroke-dashoffset: 0;
          animation: marquee 35s linear infinite;
        }
        .animate-marquee-slow {
          stroke-dashoffset: 0;
          animation: marquee 60s linear infinite;
        }
        @keyframes marquee {
          from {
            stroke-dashoffset: 1000;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
      `}} />

    </div>
  );
}
