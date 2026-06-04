'use client';

import { useState, useEffect, useCallback } from 'react';
import { statsApi, pccApi } from '@/lib/api';

interface Stats { crises:{total:number;active:number;resolved:number}; passengers:number; }
interface PaxRow { pnr:string; name:string; profile:string; room:string; hotel:string; status:string; }

const DEMO_FLIGHTS = [
  { id:'TK1981', route:'IST-LHR', type:'CANCELLED', pax:['Amach Magisat','Dentn Butnes'], conn:[] },
  { id:'TK1821', route:'IST-CDG', type:'DELAYED 240m', pax:[], conn:['Berxte Bloke','Austec Niaiwet'] },
];
const RULES = [
  { label:'Elitleri Önceliklendir', status:'DONE', color:'#22c55e' },
  { label:'Aile Birimlerini Koru', status:'IN PROGRESS', color:'#f59e0b' },
  { label:'En Düşük Maliyet Ortak', status:'PENDING', color:'#6b7280' },
];
const BUS_TABS = {'ELITE/VIP':45,'AİLELER':52,'UM':5,'BAĞLANTI':63};
const BUS_ROWS = [
  {pnr:'1235709',name:'Prionios Elites',cls:'Elite',status:'Done',flight:'FRA-ARIS'},
  {pnr:'1231707',name:'Sonid Warner',cls:'UM',status:'Durie',flight:'FRA-ZRH'},
  {pnr:'1233708',name:'Amdhan Murioord',cls:'Elite',status:'Durie',flight:'IST-ZRH'},
  {pnr:'1233703',name:'Sanila Relar',cls:'UM',status:'Dete',flight:'IST-AMS'},
  {pnr:'1233103',name:'Jarohan Buzshanpoeka',cls:'UM',status:'Dune',flight:'FYS-ZRH'},
  {pnr:'1232903',name:'Anrohan Matorort',cls:'Elite',status:'Dune',flight:'FRA-JFK'},
];
const STATUS_C: Record<string,string> = {Done:'#22c55e',Durie:'#f59e0b',Dete:'#ef4444',Dune:'#22c55e'};
const HOTEL_DATA = [
  {l:'G13',v:[90,40,20,10,5]},{l:'G36',v:[110,50,30,20,8]},{l:'G53',v:[85,35,25,15,6]},
  {l:'N8A',v:[130,60,40,25,10]},{l:'G4A',v:[95,45,22,12,7]},{l:'N67',v:[75,30,18,10,4]},
  {l:'N58',v:[105,48,28,18,8]},{l:'N8K',v:[120,55,35,22,9]},
];
const HCOL = ['#2563eb','#1e40af','#60a5fa','#f97316','#22c55e'];
const HLGND = ['Hotel Partner','Hearubu LHR','LUN/EDG','Ferester','Transfer Bus'];

function LiveMap() {
  const routes = [
    {x1:560,y1:155,x2:480,y2:130,lbl:'IST-LHR',c:'#f87171',d:true},
    {x1:560,y1:155,x2:510,y2:125,lbl:'IST-CDG',c:'#60a5fa',d:false},
    {x1:560,y1:155,x2:550,y2:137,lbl:'IST-FRA',c:'#60a5fa',d:false},
    {x1:480,y1:130,x2:350,y2:135,lbl:'LHR-JFK',c:'#fbbf24',d:false},
  ];
  return (
    <div style={{position:'relative',width:'100%',height:'100%',background:'#0d1b2a',overflow:'hidden'}}>
      <svg width="100%" height="100%" viewBox="0 0 900 310" preserveAspectRatio="xMidYMid slice">
        <rect width="900" height="310" fill="#0d1b2a"/>
        <path d="M370,55 L430,45 L500,48 L560,42 L620,50 L650,68 L660,88 L645,110 L620,125 L590,138 L560,150 L530,160 L500,158 L470,155 L445,158 L420,148 L395,135 L380,115 L372,90 Z" fill="#182d47" stroke="#1e3a5f" strokeWidth="0.8"/>
        <path d="M400,55 L435,46 L455,58 L460,72 L442,86 L418,88 L400,78 L392,65 Z" fill="#1e3a5f"/>
        <path d="M518,65 L562,60 L595,65 L605,84 L594,107 L562,118 L530,113 L511,98 L512,78 Z" fill="#1e3a5f"/>
        <path d="M588,128 L652,123 L683,133 L692,150 L670,162 L628,166 L597,155 L583,142 Z" fill="#1e3a5f"/>
        <radialGradient id="wx" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.65"/>
          <stop offset="45%" stopColor="#f97316" stopOpacity="0.4"/>
          <stop offset="75%" stopColor="#eab308" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="transparent"/>
        </radialGradient>
        <ellipse cx="565" cy="102" rx="78" ry="58" fill="url(#wx)"/>
        {routes.map((r,i)=>(
          <g key={i}>
            <path d={`M ${r.x1} ${r.y1} Q ${(r.x1+r.x2)/2} ${Math.min(r.y1,r.y2)-38} ${r.x2} ${r.y2}`}
              fill="none" stroke={r.c} strokeWidth={r.d?1.5:1} strokeDasharray={r.d?'5 3':'none'} opacity="0.85"/>
            <circle cx={(r.x1+r.x2)/2} cy={(Math.min(r.y1,r.y2)+Math.max(r.y1,r.y2))/2-18} r="2.5" fill={r.c}/>
            <rect x={r.x2-25} y={r.y2-20} width="50" height="13" rx="2" fill="rgba(0,0,0,0.75)" stroke="#1e3a5f" strokeWidth="0.5"/>
            <text x={r.x2} y={r.y2-10} textAnchor="middle" fill={r.c} fontSize="7.5" fontFamily="monospace">{r.lbl}</text>
          </g>
        ))}
        <circle cx="560" cy="155" r="5.5" fill="#c8102e"/>
        <circle cx="560" cy="155" r="11" fill="none" stroke="#c8102e" strokeWidth="1" opacity="0.4">
          <animate attributeName="r" values="5;16;5" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite"/>
        </circle>
        <text x="560" y="172" textAnchor="middle" fill="white" fontSize="8" fontFamily="monospace" fontWeight="bold">IST</text>
        {[{x:480,y:130,l:'LHR'},{x:510,y:125,l:'CDG'},{x:348,y:136,l:'JFK'}].map(a=>(
          <g key={a.l}>
            <circle cx={a.x} cy={a.y} r="3" fill="#60a5fa"/>
            <text x={a.x} y={a.y-7} textAnchor="middle" fill="#93c5fd" fontSize="7.5" fontFamily="monospace">{a.l}</text>
          </g>
        ))}
      </svg>
      <div style={{position:'absolute',top:8,left:8,display:'flex',alignItems:'center',gap:5,background:'rgba(0,0,0,0.65)',border:'1px solid #1e3a5f',borderRadius:3,padding:'3px 8px'}}>
        <div style={{width:6,height:6,borderRadius:'50%',background:'#22c55e',boxShadow:'0 0 5px #22c55e'}}/>
        <span style={{fontSize:9,color:'#93c5fd',fontWeight:700,letterSpacing:'0.1em'}}>CANLI HARİTA</span>
      </div>
      <div style={{position:'absolute',top:8,right:8,display:'flex',flexDirection:'column',gap:1}}>
        {['+','−'].map(b=><button key={b} style={{width:22,height:22,background:'rgba(0,0,0,0.65)',border:'1px solid #1e3a5f',color:'#93c5fd',fontSize:13,cursor:'pointer',borderRadius:2}}>{b}</button>)}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats,setStats]     = useState<Stats|null>(null);
  const [openFlight,setOpen] = useState<string|null>('TK1981');
  const [busTab,setBusTab]   = useState('ELITE/VIP');
  const [time,setTime]       = useState('');
  const [paxRows,setPaxRows] = useState<PaxRow[]>([]);

  useEffect(()=>{
    const t=setInterval(()=>setTime(new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})),1000);
    return ()=>clearInterval(t);
  },[]);

  const load=useCallback(async()=>{
    try{const s=await statsApi.get();setStats(s);}catch{}
    try{
      const p=await pccApi.atRisk(8);
      setPaxRows((p.passengers??[]).map((x:any)=>({
        pnr:x.pnr,name:x.name,
        profile:x.loyalty_tier==='PLATINUM'||x.loyalty_tier==='GOLD'?'Elite':x.loyalty_tier==='SILVER'?'Family':'UM',
        room:'UM/PAO',hotel:x.loyalty_tier==='GOLD'?'Notel':'—',status:x.special_needs?'Wheelchair User':'—',
      })));
    }catch{}
  },[]);

  useEffect(()=>{load();const i=setInterval(load,15000);return()=>clearInterval(i);},[load]);

  const totalPax=stats?.passengers??950;
  const KPIS=[
    {label:'ETKİLENEN UÇUŞ', value:String(stats?.crises?.active??8),icon:'flight',c:'#f59e0b'},
    {label:'TOPLAM YOLCU',   value:String(totalPax),                 icon:'groups',c:'#f0f9ff'},
    {label:'OTO. YERLEŞTİR',value:String(Math.round(totalPax*.76)), icon:'flight_takeoff',c:'#22c55e'},
    {label:'MANUEL KONTROL', value:String(Math.round(totalPax*.11)), icon:'warning',c:'#ef4444'},
    {label:'OTEL YATAK',     value:'1.200',                          icon:'hotel',c:'#f0f9ff'},
    {label:'TRANSFER OTOBİS',value:'15/20',                          icon:'directions_bus',c:'#60a5fa'},
  ];

  const DEMO_PAX:PaxRow[]=paxRows.length>0?paxRows:[
    {pnr:'1225709',name:'Amach Magiet', profile:'Elite', room:'UM/PAO',hotel:'—',    status:'Wheelchair User'},
    {pnr:'1223709',name:'Dantn Balter', profile:'Family',room:'UM/PAO',hotel:'—',    status:'Wheelchair User'},
    {pnr:'1223707',name:'Raste Munres', profile:'Family',room:'UM/PAO',hotel:'—',    status:'Wheelchair User'},
    {pnr:'1223758',name:'Bbica Bluake', profile:'UM',    room:'—',     hotel:'Notel',status:'—'},
    {pnr:'1223156',name:'Antor Karit',  profile:'UM',    room:'UM/PAO',hotel:'—',    status:'Wheelchair User'},
    {pnr:'1223168',name:'Anser Mktarot',profile:'UM',    room:'—',     hotel:'—',    status:'Iv/PAO'},
    {pnr:'1223908',name:'Gillta Tiarisa',profile:'UM',   room:'—',     hotel:'—',    status:'Elne'},
  ];

  const pBg=(p:string)=>p==='Elite'?'rgba(234,179,8,.15)':p==='Family'?'rgba(59,130,246,.15)':'rgba(107,114,128,.15)';
  const pCl=(p:string)=>p==='Elite'?'#fbbf24':p==='Family'?'#60a5fa':'#9ca3af';
  const pBr=(p:string)=>p==='Elite'?'#92400e':p==='Family'?'#1e3a8a':'#374151';

  const BD='1px solid #1e3050';
  const BG='#0a1428';
  const SB='#64748b';

  return(
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden',color:'white',fontFamily:'Inter,sans-serif'}}>

      {/* HEADER */}
      <div style={{background:BG,borderBottom:BD,padding:'7px 14px',display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:7}}>
          <div style={{width:24,height:24,background:'#c8102e',borderRadius:3,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span className="material-symbols-outlined" style={{fontSize:13,color:'white',fontVariationSettings:"'FILL' 1"}}>flight_takeoff</span>
          </div>
          <span style={{fontSize:12,fontWeight:700,letterSpacing:'0.05em'}}>IRROPS Komuta Merkezi</span>
        </div>
        <span style={{color:'#1e3050'}}>|</span><span style={{color:SB,fontSize:11}}>JetNexus AI</span>
        <span style={{color:'#1e3050'}}>|</span><span style={{color:SB,fontSize:11}}>{new Date().toLocaleDateString('tr-TR',{day:'2-digit',month:'long',year:'numeric'})}</span>
        <span style={{color:'#1e3050'}}>|</span><span style={{fontFamily:'monospace',fontSize:12}}>{time}</span>
        <div style={{flex:1}}/>
        <div style={{display:'flex',alignItems:'center',gap:5,background:'rgba(200,16,46,0.1)',border:'1px solid rgba(200,16,46,0.3)',borderRadius:3,padding:'3px 9px'}}>
          <div style={{width:5,height:5,borderRadius:'50%',background:'#ef4444',animation:'dp 1.5s infinite'}}/>
          <span style={{fontSize:9,fontWeight:700,color:'#f87171',letterSpacing:'0.1em'}}>KRİZ ODASI: IST SİS</span>
        </div>
      </div>

      {/* KPI */}
      <div style={{background:'#081020',borderBottom:BD,display:'flex',flexShrink:0}}>
        {KPIS.map((k,i)=>(
          <div key={i} style={{flex:1,padding:'8px 10px',borderRight:BD,display:'flex',alignItems:'center',gap:8}}>
            <span className="material-symbols-outlined" style={{fontSize:20,color:k.c,fontVariationSettings:"'FILL' 1"}}>{k.icon}</span>
            <div>
              <div style={{fontSize:9,color:'#475569',fontWeight:600,letterSpacing:'0.07em',textTransform:'uppercase',lineHeight:1}}>{k.label}</div>
              <div style={{fontSize:20,fontWeight:700,color:k.c,fontFamily:'Outfit,sans-serif',lineHeight:1.15,marginTop:1}}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 3-COL */}
      <div style={{flex:1,display:'flex',minHeight:0,overflow:'hidden'}}>

        {/* LEFT */}
        <div style={{width:252,background:BG,borderRight:BD,display:'flex',flexDirection:'column',overflow:'hidden',flexShrink:0}}>
          <div style={{padding:'6px 12px',borderBottom:BD,fontSize:9,fontWeight:700,color:SB,letterSpacing:'0.1em',textTransform:'uppercase'}}>Aktif Krizler</div>
          <div style={{flex:1,overflowY:'auto'}}>
            {DEMO_FLIGHTS.map(f=>(
              <div key={f.id}>
                <button onClick={()=>setOpen(openFlight===f.id?null:f.id)}
                  style={{width:'100%',display:'flex',alignItems:'center',gap:5,padding:'6px 10px',background:openFlight===f.id?'rgba(200,16,46,0.08)':'transparent',border:'none',cursor:'pointer',textAlign:'left'}}>
                  <span style={{fontSize:9,color:'#475569',display:'inline-block',transition:'transform .15s',transform:openFlight===f.id?'rotate(90deg)':'none'}}>▶</span>
                  <span style={{fontSize:10,fontFamily:'monospace',color:'white',fontWeight:700}}>{f.id}</span>
                  <span style={{color:'#1e3050'}}>|</span>
                  <span style={{fontSize:10,color:'#93c5fd',fontFamily:'monospace'}}>{f.route}</span>
                  <span style={{color:'#1e3050'}}>|</span>
                  <span style={{fontSize:9,fontWeight:700,color:f.type.includes('CANCEL')?'#ef4444':'#f59e0b'}}>{f.type}</span>
                </button>
                {openFlight===f.id&&(
                  <div>
                    {f.pax.length>0&&<><div style={{padding:'3px 22px',fontSize:9,color:'#475569',fontWeight:600}}>↳ Yolcular</div>{f.pax.map(p=><div key={p} style={{padding:'2px 22px 2px 30px',fontSize:10,color:'#94a3b8'}}>👤 {p}</div>)}</>}
                    {f.conn.length>0&&<><div style={{padding:'3px 22px',fontSize:9,color:'#475569',fontWeight:600}}>↳ Bağlantı Yolcuları</div>{f.conn.map(p=><div key={p} style={{padding:'2px 22px 2px 30px',fontSize:10,color:'#94a3b8'}}>👤 {p}</div>)}</>}
                  </div>
                )}
              </div>
            ))}
            <div style={{borderTop:BD}}>
              {['Yolcu Yönetimi','Otel Ortakları','Otobüs Filosu','Operasyon Logları'].map((s,i)=>(
                <div key={s} style={{padding:'7px 12px',borderBottom:'1px solid #0f1e30',display:'flex',alignItems:'center',gap:7,cursor:'pointer'}}>
                  <span className="material-symbols-outlined" style={{fontSize:13,color:'#334155'}}>{['manage_accounts','hotel','directions_bus','history'][i]}</span>
                  <span style={{fontSize:10,color:'#475569'}}>{s}</span>
                  <span style={{marginLeft:'auto',fontSize:11,color:'#1e3050'}}>⌄</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MAP */}
        <div style={{flex:1,background:'#0d1b2a',minWidth:0}}><LiveMap/></div>

        {/* RIGHT */}
        <div style={{width:222,background:BG,borderLeft:BD,display:'flex',flexDirection:'column',flexShrink:0,overflow:'hidden'}}>
          <div style={{padding:'6px 12px',borderBottom:BD,fontSize:9,fontWeight:700,color:SB,letterSpacing:'0.1em',textTransform:'uppercase'}}>Operasyonel Koordinasyon</div>
          <div style={{padding:'10px 12px',borderBottom:BD}}>
            <div style={{fontSize:9,color:'#334155',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:8}}>Aktif Kurallar</div>
            {RULES.map(r=>(
              <div key={r.label} style={{display:'flex',justifyContent:'space-between',marginBottom:7}}>
                <span style={{fontSize:11,color:'#94a3b8'}}>{r.label}</span>
                <span style={{fontSize:9,fontWeight:700,color:r.color,letterSpacing:'0.05em'}}>{r.status}</span>
              </div>
            ))}
          </div>
          <div style={{padding:'10px 12px',display:'flex',flexDirection:'column',gap:6}}>
            <button style={{width:'100%',padding:'9px 8px',background:'#1e3a8a',border:'1px solid #2563eb',borderRadius:4,color:'white',fontSize:10,fontWeight:700,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',textTransform:'uppercase',letterSpacing:'0.04em'}}>
              <span>Toplu Otel Voucher</span><span style={{background:'#2563eb',borderRadius:3,padding:'1px 6px'}}>800</span>
            </button>
            <button style={{width:'100%',padding:'8px',background:'transparent',border:BD,borderRadius:4,color:'#64748b',fontSize:10,fontWeight:600,cursor:'pointer',textAlign:'left'}}>Transfer Otobüs Dispatch (10)</button>
            <button style={{width:'100%',padding:'8px',background:'transparent',border:BD,borderRadius:4,color:'#64748b',fontSize:10,fontWeight:600,cursor:'pointer',textAlign:'left'}}>IST Yer Ekibi Bildir</button>
          </div>
        </div>
      </div>

      {/* BOTTOM 3 */}
      <div style={{height:252,display:'flex',borderTop:BD,flexShrink:0,overflow:'hidden'}}>

        {/* PAX LIST */}
        <div style={{width:488,borderRight:BD,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{padding:'6px 12px',borderBottom:BD,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
            <span style={{fontSize:9,fontWeight:700,color:'white',letterSpacing:'0.08em',textTransform:'uppercase'}}>Yolcu Kritik Durum Listesi</span>
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              <input placeholder="Ara..." style={{fontSize:10,padding:'2px 8px',background:'#0f172a',border:BD,borderRadius:3,color:'white',outline:'none',width:90}}/>
              <span style={{color:'#334155',cursor:'pointer'}}>⋯</span>
            </div>
          </div>
          <div style={{flex:1,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:'#081020',position:'sticky',top:0,zIndex:1}}>
                {['PNR','İsim','Profil','Konum','Atanan Otel','Durum',''].map(h=>(
                  <th key={h} style={{padding:'5px 8px',textAlign:'left',color:'#334155',fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {DEMO_PAX.map((p,i)=>(
                  <tr key={i} style={{borderBottom:'1px solid #0d1829'}} onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.025)')} onMouseLeave={e=>(e.currentTarget.style.background='')}>
                    <td style={{padding:'5px 8px',color:'#60a5fa',fontFamily:'monospace',fontSize:10,fontWeight:600}}>{p.pnr}</td>
                    <td style={{padding:'5px 8px',whiteSpace:'nowrap'}}>
                      <div style={{fontSize:11,fontWeight:500,color:'white'}}>{p.name}</div>
                      <div style={{fontSize:9,color:'#334155'}}>COD Transport</div>
                    </td>
                    <td style={{padding:'5px 8px'}}><span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:3,background:pBg(p.profile),color:pCl(p.profile),border:`1px solid ${pBr(p.profile)}`}}>{p.profile==='Elite'?'★ ':p.profile==='Family'?'⊕ ':'⦿ '}{p.profile}</span></td>
                    <td style={{padding:'5px 8px',color:'#64748b',fontSize:10}}>{p.room}</td>
                    <td style={{padding:'5px 8px',color:'#64748b',fontSize:10}}>{p.hotel}</td>
                    <td style={{padding:'5px 8px',color:'#64748b',fontSize:10,whiteSpace:'nowrap'}}>{p.status}</td>
                    <td style={{padding:'5px 8px',color:'#334155',cursor:'pointer',fontSize:14}}>⋮</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* HOTEL CHART */}
        <div style={{width:288,borderRight:BD,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{padding:'6px 12px',borderBottom:BD,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
            <span style={{fontSize:9,fontWeight:700,color:'white',letterSpacing:'0.08em',textTransform:'uppercase'}}>Otel Ortak Kapasitesi</span>
            <span style={{color:'#334155',cursor:'pointer'}}>⋯</span>
          </div>
          <div style={{flex:1,padding:'8px 12px',overflow:'hidden',display:'flex',flexDirection:'column'}}>
            <div style={{display:'flex',gap:14,marginBottom:6,fontSize:10}}>
              <span><span style={{color:SB}}>PAX </span><strong style={{color:'white'}}>2.105</strong></span>
              <span><span style={{color:SB}}>ODA </span><strong style={{color:'white'}}>116</strong></span>
            </div>
            <div style={{flex:1,display:'flex',alignItems:'flex-end',gap:2,minHeight:0}}>
              {HOTEL_DATA.map((d,i)=>(
                <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center'}}>
                  <div style={{width:'100%',display:'flex',flexDirection:'column',justifyContent:'flex-end',height:80,gap:0.5}}>
                    {d.v.map((v,vi)=>(
                      <div key={vi} style={{width:'100%',height:`${(v/140)*80/5}px`,background:HCOL[vi],minHeight:v>0?1.5:0,borderRadius:vi===0?'2px 2px 0 0':0}}/>
                    ))}
                  </div>
                  <span style={{fontSize:8,color:'#334155',marginTop:3,display:'block',transform:'rotate(-40deg)',transformOrigin:'center',whiteSpace:'nowrap'}}>{d.l}</span>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:10}}>
              {HLGND.map((l,i)=>(
                <div key={l} style={{display:'flex',alignItems:'center',gap:3}}>
                  <div style={{width:7,height:7,background:HCOL[i],borderRadius:1}}/><span style={{fontSize:8,color:'#475569'}}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BUS QUEUE */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{padding:'6px 12px',borderBottom:BD,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
            <span style={{fontSize:9,fontWeight:700,color:'white',letterSpacing:'0.08em',textTransform:'uppercase'}}>Transfer Otobüs Kuyruğu</span>
            <span style={{color:'#334155',cursor:'pointer'}}>⋯</span>
          </div>
          <div style={{display:'flex',borderBottom:BD,flexShrink:0}}>
            {Object.entries(BUS_TABS).map(([tab,cnt])=>(
              <button key={tab} onClick={()=>setBusTab(tab)} style={{flex:1,padding:'5px 2px',fontSize:9,fontWeight:700,background:'transparent',border:'none',cursor:'pointer',letterSpacing:'0.04em',color:busTab===tab?'white':'#334155',borderBottom:busTab===tab?'2px solid #60a5fa':'2px solid transparent',whiteSpace:'nowrap'}}>
                {tab} <span style={{opacity:.7}}>({cnt})</span>
              </button>
            ))}
          </div>
          <div style={{flex:1,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:'#081020',position:'sticky',top:0,zIndex:1}}>
                {['PNR','İsim','Sınıf','Durum','Hedef Uçuş','Aksiyonlar'].map(h=>(
                  <th key={h} style={{padding:'5px 8px',textAlign:'left',color:'#334155',fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {BUS_ROWS.map((r,i)=>(
                  <tr key={i} style={{borderBottom:'1px solid #0d1829'}} onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.025)')} onMouseLeave={e=>(e.currentTarget.style.background='')}>
                    <td style={{padding:'5px 8px',color:'#60a5fa',fontFamily:'monospace',fontSize:9,fontWeight:600}}>{r.pnr}</td>
                    <td style={{padding:'5px 8px',color:'white',fontSize:10,whiteSpace:'nowrap'}}>{r.name}</td>
                    <td style={{padding:'5px 8px'}}><span style={{fontSize:9,fontWeight:700,color:r.cls==='Elite'?'#fbbf24':'#9ca3af'}}>{r.cls}</span></td>
                    <td style={{padding:'5px 8px'}}><span style={{fontSize:9,fontWeight:700,color:STATUS_C[r.status]??'#9ca3af'}}>{r.status}</span></td>
                    <td style={{padding:'5px 8px',color:'#94a3b8',fontFamily:'monospace',fontSize:9}}>{r.flight}</td>
                    <td style={{padding:'5px 6px'}}>
                      <div style={{display:'flex',gap:3}}>
                        <button style={{fontSize:8,padding:'2px 5px',background:'#1e3a8a',border:'1px solid #2563eb',borderRadius:2,color:'white',cursor:'pointer',whiteSpace:'nowrap'}}>Oto. Yerleştir</button>
                        <button style={{fontSize:8,padding:'2px 5px',background:'transparent',border:BD,borderRadius:2,color:'#64748b',cursor:'pointer',whiteSpace:'nowrap'}}>Otel Ata</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <style>{`@keyframes dp{0%,100%{opacity:1}50%{opacity:.3}} ::-webkit-scrollbar{width:3px;height:3px} ::-webkit-scrollbar-thumb{background:#1e3050;border-radius:2px}`}</style>
    </div>
  );
}
