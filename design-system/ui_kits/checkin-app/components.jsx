// Ipê Village — Shared Components v2 (polished)
// All fonts: Playfair Display, Cormorant Garamond, DM Sans, Chakra Petch

const { useState, useEffect, useRef } = React;

const C = {
  bg: '#080f1a', card: '#0c1929', muted: '#1a2d44',
  border: '#162338', fg: '#f0f4ff', fgMuted: '#7a91ab',
  lime: '#84E400', blue: '#29B6F6',
  destructive: '#E05757', amber: '#d4a843', emerald: '#34d399',
};

const glass      = { background:'rgba(12,25,41,0.72)', backdropFilter:'blur(20px) saturate(1.8)', WebkitBackdropFilter:'blur(20px) saturate(1.8)', border:'1px solid rgba(240,244,255,0.07)', boxShadow:'0 1px 0 rgba(240,244,255,0.05) inset,0 16px 48px rgba(0,0,0,0.35)' };
const glassStrong = { background:'rgba(10,20,35,0.88)', backdropFilter:'blur(32px) saturate(2)', WebkitBackdropFilter:'blur(32px) saturate(2)', border:'1px solid rgba(240,244,255,0.08)', boxShadow:'0 1px 0 rgba(240,244,255,0.06) inset,0 8px 32px rgba(0,0,0,0.4)' };
const glassSubtle = { background:'rgba(12,25,41,0.45)', backdropFilter:'blur(12px) saturate(1.5)', WebkitBackdropFilter:'blur(12px) saturate(1.5)', border:'1px solid rgba(240,244,255,0.05)' };
const limeGlass  = { background:'rgba(132,228,0,0.06)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', border:'1px solid rgba(132,228,0,0.18)', boxShadow:'0 0 0 1px rgba(132,228,0,0.04) inset,0 8px 32px rgba(132,228,0,0.08)' };

function SectionBadge({ label, pulse=true, style={} }) {
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:10, borderRadius:9999, ...limeGlass, padding:'7px 18px', ...style }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:C.lime, flexShrink:0, boxShadow:`0 0 8px ${C.lime}`, animation: pulse ? 'ipePulse 2s ease-in-out infinite' : 'none' }} />
      <span style={{ fontFamily:'Chakra Petch,monospace', fontSize:9, letterSpacing:'0.18em', textTransform:'uppercase', color:C.lime }}>{label}</span>
    </div>
  );
}

function StatCard({ icon, label, value, delta }) {
  const isPos = delta?.startsWith('+'), isNeg = delta?.startsWith('-');
  return (
    <div style={{ position:'relative', overflow:'hidden', borderRadius:16, border:`1px solid ${C.border}`, padding:'20px', background:'rgba(8,15,26,0.8)', backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.035) 1px,transparent 1px)', backgroundSize:'28px 28px' }}>
      <div style={{ position:'absolute', top:-60, right:-60, width:160, height:160, borderRadius:'50%', background:'radial-gradient(circle,rgba(132,228,0,0.07),transparent 70%)', filter:'blur(20px)', pointerEvents:'none' }} />
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16, position:'relative' }}>
        <div style={{ width:40, height:40, borderRadius:10, background:'linear-gradient(135deg,#0884c7,#29B6F6)', boxShadow:'0 4px 16px rgba(41,182,246,0.35)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {icon}
        </div>
        {delta && <span style={{ fontFamily:'Chakra Petch,monospace', fontSize:10, color: isPos?C.emerald:isNeg?C.destructive:C.fgMuted, letterSpacing:'0.05em' }}>{isPos?'▲':isNeg?'▼':''} {delta}</span>}
      </div>
      <div style={{ fontFamily:'Playfair Display,serif', fontSize:32, fontWeight:700, color:'white', lineHeight:1, position:'relative' }}>{value}</div>
      <div style={{ fontFamily:'Chakra Petch,monospace', fontSize:9, letterSpacing:'0.15em', textTransform:'uppercase', color:C.fgMuted, marginTop:6, position:'relative' }}>{label}</div>
    </div>
  );
}

const NAV = [
  { id:'checkin',   label:'Check-in' },
  { id:'dashboard', label:'Dashboard' },
  { id:'pessoas',   label:'Inscritos' },
];

function Layout({ children, activePage, onNav, transKey }) {
  return (
    <div style={{ minHeight:'100vh', background:C.bg, color:C.fg }}>
      {/* Background orbs */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:0 }}>
        <div style={{ position:'absolute', top:'-20%', left:'-10%', width:'60vw', height:'60vw', borderRadius:'50%', background:'radial-gradient(circle,rgba(132,228,0,0.04) 0%,transparent 65%)', filter:'blur(60px)', animation:'ipeOrb1 20s ease-in-out infinite' }} />
        <div style={{ position:'absolute', bottom:'-20%', right:'-10%', width:'50vw', height:'50vw', borderRadius:'50%', background:'radial-gradient(circle,rgba(41,182,246,0.04) 0%,transparent 65%)', filter:'blur(60px)', animation:'ipeOrb2 25s ease-in-out infinite' }} />
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.018) 1px,transparent 1px)', backgroundSize:'40px 40px' }} />
      </div>
      <header style={{ ...glassStrong, position:'sticky', top:0, zIndex:50, borderRadius:0, borderLeft:'none', borderRight:'none', borderTop:'none' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 28px', height:62, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:36 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <img src="../../assets/ipe-city-logo.png" alt="IPÊ city" style={{ height:19, opacity:0.92 }} />
              <span style={{ width:1, height:16, background:'rgba(255,255,255,0.12)', display:'inline-block' }} />
              <span style={{ fontFamily:'Chakra Petch,monospace', fontSize:11, color:C.fgMuted, letterSpacing:'0.12em', textTransform:'uppercase' }}>Check-In</span>
            </div>
            <nav style={{ display:'flex', gap:2 }}>
              {NAV.map(n => (
                <button key={n.id} onClick={() => onNav(n.id)} style={{ fontFamily:'DM Sans,sans-serif', display:'flex', alignItems:'center', gap:7, padding:'7px 15px', borderRadius:10, fontSize:13, fontWeight:500, border:'none', cursor:'pointer', background: activePage===n.id ? 'rgba(132,228,0,0.09)':'transparent', color: activePage===n.id ? C.lime : C.fgMuted, position:'relative', transition:'all 0.2s', letterSpacing:'0.01em' }}>
                  {n.label}
                  {activePage===n.id && <span style={{ position:'absolute', bottom:3, left:10, right:10, height:1.5, borderRadius:9999, background:`linear-gradient(90deg,transparent,${C.lime},transparent)` }} />}
                </button>
              ))}
            </nav>
          </div>
          <span style={{ fontFamily:'Chakra Petch,monospace', fontSize:10, color:C.fgMuted, letterSpacing:'0.1em' }}>QUA · 30 ABR 2025</span>
        </div>
      </header>
      <main key={transKey} style={{ maxWidth:1100, margin:'0 auto', padding:'36px 28px', position:'relative', zIndex:1, animation:'ipeFadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>{children}</main>
    </div>
  );
}

function EventCard({ event, onSelect }) {
  const pct = event.reg > 0 ? Math.min(100,Math.round(event.checkins/event.reg*100)) : 0;
  const [hover, setHover] = useState(false);
  return (
    <button onClick={() => onSelect(event)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ width:'100%', background: hover?'rgba(14,28,48,0.95)':'rgba(12,25,41,0.85)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', border:`1px solid ${hover?'rgba(132,228,0,0.25)':C.border}`, borderRadius:16, padding:20, cursor:'pointer', textAlign:'left', transition:'all 0.25s', transform: hover?'translateY(-3px)':'none', boxShadow: hover?`0 20px 48px rgba(0,0,0,0.3),0 0 0 1px rgba(132,228,0,0.08)`:'none', display:'flex', flexDirection:'column', gap:12, position:'relative', overflow:'hidden' }}>
      {hover && <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(132,228,0,0.03),transparent)', pointerEvents:'none' }} />}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
        <div style={{ flex:1 }}>
          <SectionBadge label="ATIVO" pulse={true} style={{ marginBottom:10, padding:'4px 10px' }} />
          <div style={{ fontFamily:'Playfair Display,serif', fontWeight:700, fontSize:15, color:C.fg, lineHeight:1.3, transition:'color 0.2s', color: hover?C.lime:C.fg }}>{event.name}</div>
        </div>
        <span style={{ color: hover?C.lime:C.fgMuted, fontSize:18, marginTop:4, transition:'color 0.2s', transform: hover?'translateX(2px)':'none', transition:'all 0.2s' }}>›</span>
      </div>
      <div style={{ display:'flex', gap:14, fontSize:12, color:C.fgMuted, fontFamily:'DM Sans,sans-serif' }}>
        <span>⏱ {event.time}</span><span>📍 {event.location}</span>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, fontFamily:'DM Sans,sans-serif' }}>
        <div style={{ display:'flex', gap:12 }}>
          <span style={{ color:C.fgMuted }}>{event.reg} inscritos</span>
          <span style={{ color:C.lime, fontWeight:600 }}>{event.checkins} check-ins</span>
        </div>
        <span style={{ fontFamily:'Chakra Petch,monospace', color:C.fgMuted, fontSize:10 }}>{pct}%</span>
      </div>
      <div style={{ height:4, borderRadius:9999, background:'rgba(26,46,68,0.6)', overflow:'hidden', position:'relative' }}>
        <div style={{ height:'100%', borderRadius:9999, background:`linear-gradient(90deg,${C.lime},${C.blue})`, width:`${pct}%`, transition:'width 0.8s cubic-bezier(0.16,1,0.3,1)', boxShadow:`0 0 12px rgba(132,228,0,0.4)` }} />
      </div>
    </button>
  );
}

function Btn({ children, variant='primary', size='md', onClick, disabled, style={} }) {
  const [hover, setHover] = useState(false);
  const base = { border:'none', fontFamily:'DM Sans,sans-serif', fontWeight:600, cursor:disabled?'not-allowed':'pointer', display:'inline-flex', alignItems:'center', gap:6, transition:'all 0.2s', opacity:disabled?0.45:1, letterSpacing:'0.01em' };
  const sizes = { sm:{padding:'6px 14px',fontSize:12,borderRadius:10}, md:{padding:'10px 20px',fontSize:13,borderRadius:12}, lg:{padding:'14px 28px',fontSize:14,borderRadius:14} };
  const variants = {
    primary: { background:hover?'#93f500':C.lime, color:'#070e18', boxShadow: hover?`0 6px 20px rgba(132,228,0,0.4)`:C.lime?`0 4px 14px rgba(132,228,0,0.25)`:'none', transform: hover?'translateY(-1px)':'none' },
    outline: { background:'transparent', border:`1px solid ${hover?'rgba(240,244,255,0.25)':C.border}`, color: hover?C.fg:C.fgMuted },
    ghost:   { background: hover?'rgba(255,255,255,0.04)':'transparent', color:C.fgMuted },
    destructive: { background:C.destructive, color:'#fff', boxShadow: hover?'0 4px 14px rgba(224,87,87,0.4)':'none' },
  };
  return <button style={{ ...base, ...sizes[size], ...variants[variant], ...style }} onClick={onClick} disabled={disabled} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>{children}</button>;
}

function Badge({ children, variant='primary' }) {
  const v = { primary:{background:'rgba(132,228,0,0.10)',color:C.lime}, secondary:{background:'rgba(41,182,246,0.14)',color:C.blue}, amber:{background:'rgba(215,168,70,0.14)',color:C.amber}, destructive:{background:'rgba(224,87,87,0.14)',color:C.destructive}, emerald:{background:'rgba(52,211,153,0.14)',color:C.emerald}, outline:{background:'transparent',border:`1px solid ${C.border}`,color:C.fgMuted} };
  return <span style={{ display:'inline-flex', alignItems:'center', borderRadius:7, padding:'2px 9px', fontSize:10, fontWeight:600, fontFamily:'Chakra Petch,monospace', letterSpacing:'0.05em', ...v[variant] }}>{children}</span>;
}

function AccessWarning({ type, message }) {
  const colors = { ok:C.emerald, warning:C.amber, danger:C.destructive };
  const bgs    = { ok:'rgba(52,211,153,0.07)', warning:'rgba(215,168,70,0.07)', danger:'rgba(224,87,87,0.07)' };
  const icons  = { ok:'✓', warning:'⚠', danger:'✕' };
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, borderRadius:12, border:`1px solid ${colors[type]}33`, background:bgs[type], padding:'11px 16px', fontSize:13, color:colors[type], fontFamily:'DM Sans,sans-serif', backdropFilter:'blur(8px)' }}>
      <span style={{ fontFamily:'Chakra Petch,monospace', fontWeight:700, fontSize:14 }}>{icons[type]}</span>
      {message}
    </div>
  );
}

Object.assign(window, { C, glass, glassStrong, glassSubtle, limeGlass, SectionBadge, StatCard, Layout, EventCard, Btn, Badge, AccessWarning, NAV });
