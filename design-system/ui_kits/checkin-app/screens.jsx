// Ipê Village — Screens v4 — Internal system, maximum dashboard quality
const { useState, useEffect, useRef, useCallback } = React;

/* ── DATA ──────────────────────────────────────────────── */
const EVENTS = [
  { id:'1', name:'Arquitetura do Futuro — Workshop Intensivo', time:'10:00', location:'Salão Principal', reg:120, checkins:87 },
  { id:'2', name:'Conversa com Fundadores — Mesa Redonda', time:'14:00', location:'Terraço', reg:64, checkins:41 },
];
const PEOPLE = [
  { id:'p1', name:'Ana Carolina Silva', tag:'ARCHITECT', checked:true,  time:'09:47', ticket:'Architect' },
  { id:'p2', name:'Bruno Mendes',       tag:'EXPLORER',  checked:true,  time:'09:52', ticket:'Explorer'  },
  { id:'p3', name:'Carla Souza',        tag:'SPEAKER',   checked:false, time:null,   ticket:'Day Pass'   },
  { id:'p4', name:'Diego Ferreira',     tag:'ARCHITECT', checked:true,  time:'10:03', ticket:'Architect' },
  { id:'p5', name:'Eduarda Lima',       tag:null,        checked:false, time:null,   ticket:'Day Pass'   },
  { id:'p6', name:'Felipe Rocha',       tag:'VIP',       checked:true,  time:'10:15', ticket:'Explorer'  },
  { id:'p7', name:'Gabriela Nunes',     tag:'EXPLORER',  checked:false, time:null,   ticket:'Week Pass'  },
  { id:'p8', name:'Henrique Alves',     tag:'STAFF',     checked:true,  time:'08:30', ticket:'Staff'     },
];
const FEED_INIT = [
  { name:'Ana Carolina Silva', tag:'ARCHITECT', time:'09:47', ticket:'Architect' },
  { name:'Bruno Mendes',       tag:'EXPLORER',  time:'09:52', ticket:'Explorer'  },
  { name:'Diego Ferreira',     tag:'ARCHITECT', time:'10:03', ticket:'Architect' },
  { name:'Felipe Rocha',       tag:'VIP',       time:'10:15', ticket:'Explorer'  },
  { name:'Henrique Alves',     tag:'STAFF',     time:'08:30', ticket:'Staff'     },
];
const DAILY = [{d:'22/04',v:34},{d:'23/04',v:52},{d:'24/04',v:41},{d:'25/04',v:67},{d:'26/04',v:89},{d:'27/04',v:74},{d:'28/04',v:95},{d:'29/04',v:112},{d:'30/04',v:87}];
const PIE   = [{n:'IP Village',v:45,c:'#84E400'},{n:'Day Pass',v:28,c:'#29B6F6'},{n:'Explorers',v:19,c:'#d4a843'},{n:'Workshop',v:8,c:'#a855f7'}];
const TOP   = [{n:'Ana Carolina Silva',t:'ARCHITECT',c:14},{n:'Bruno Mendes',t:'EXPLORER',c:11},{n:'Diego Ferreira',t:'ARCHITECT',c:9},{n:'Felipe Rocha',t:'VIP',c:8},{n:'Gabriela Nunes',t:'EXPLORER',c:7}];

/* ── TOKENS ────────────────────────────────────────────── */
const lime   = '#84E400';
const blue   = '#29B6F6';
const bg     = '#05080f';
const card   = 'rgba(10,16,26,0.85)';
const border = 'rgba(238,242,255,0.06)';
const fg     = '#eef2ff';
const fgm    = '#3d5470';
const glass  = { background:card, backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)', border:`1px solid ${border}` };

/* ── HELPERS ───────────────────────────────────────────── */
function Avatar({ name, size=28, gradient='blue' }) {
  const g = gradient==='lime' ? 'linear-gradient(135deg,#1a3a08,#84E400)' : 'linear-gradient(135deg,#0d2a54,#29B6F6)';
  return <div style={{ width:size, height:size, borderRadius:'50%', background:g, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.38, fontWeight:700, color:'white', fontFamily:'DM Sans,sans-serif', flexShrink:0 }}>{name[0]}</div>;
}

function Tag({ children, color=lime }) {
  return <span style={{ fontFamily:'Chakra Petch,monospace', fontSize:9, letterSpacing:'0.08em', color, background:`${color}12`, borderRadius:5, padding:'2px 8px', fontWeight:600 }}>{children}</span>;
}

function KpiCard({ label, value, delta, accent=lime, sub }) {
  const pos = delta?.startsWith('+');
  return (
    <div style={{ ...glass, borderRadius:16, padding:'22px 24px', position:'relative', overflow:'hidden' }}>
      {/* bg glow */}
      <div style={{ position:'absolute', top:-40, right:-40, width:140, height:140, borderRadius:'50%', background:`radial-gradient(circle,${accent}10,transparent 70%)`, filter:'blur(20px)', pointerEvents:'none' }} />
      {/* accent bar */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${accent},transparent)`, opacity:0.6 }} />
      <div style={{ fontFamily:'Chakra Petch,monospace', fontSize:8, letterSpacing:'0.16em', color:fgm, marginBottom:12 }}>{label}</div>
      <div style={{ display:'flex', alignItems:'flex-end', gap:12, marginBottom:4 }}>
        <div style={{ fontFamily:'Playfair Display,serif', fontSize:40, fontWeight:700, color:fg, lineHeight:1, animation:'countUp 0.5s ease both' }}>{value}</div>
        {delta && <div style={{ fontFamily:'Chakra Petch,monospace', fontSize:10, color: pos?'#34d399':'#E05757', marginBottom:6 }}>{pos?'▲':'▼'} {delta}</div>}
      </div>
      {sub && <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:11, color:fgm }}>{sub}</div>}
    </div>
  );
}

/* ── LOGIN ─────────────────────────────────────────────── */
function LoginScreen({ onLogin }) {
  const [email,setEmail]     = useState('');
  const [pw,setPw]           = useState('');
  const [loading,setLoading] = useState(false);
  const [err,setErr]         = useState('');

  const handle = e => {
    e.preventDefault();
    if (!email||!pw) { setErr('Preencha todos os campos.'); return; }
    setErr(''); setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 900);
  };

  return (
    <div style={{ minHeight:'100vh', background:bg, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
      {/* grid */}
      <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(${border} 1px,transparent 1px),linear-gradient(90deg,${border} 1px,transparent 1px)`, backgroundSize:'80px 80px', pointerEvents:'none' }} />
      {/* center glow */}
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'60vw', height:'60vw', borderRadius:'50%', background:'radial-gradient(circle,rgba(132,228,0,0.04),transparent 65%)', filter:'blur(80px)', pointerEvents:'none' }} />

      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:360, padding:24 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <img src="../../assets/ipe-city-logo.png" alt="IPÊ" style={{ height:22, opacity:0.9, marginBottom:24, filter:`drop-shadow(0 0 12px ${lime}40)` }} />
          <div style={{ fontFamily:'Playfair Display,serif', fontSize:13, fontWeight:400, color:fgm, letterSpacing:'0.02em' }}>Sistema interno de check-in</div>
        </div>

        <form onSubmit={handle} style={{ ...glass, borderRadius:18, padding:28, display:'flex', flexDirection:'column', gap:16, boxShadow:`0 0 0 1px rgba(132,228,0,0.05), 0 32px 80px rgba(0,0,0,0.5)` }}>
          {err && <div style={{ background:'rgba(224,87,87,0.08)', border:'1px solid rgba(224,87,87,0.18)', borderRadius:9, padding:'9px 12px', fontFamily:'DM Sans,sans-serif', fontSize:12, color:'#E05757' }}>⚠ {err}</div>}
          {[{l:'E-mail',t:'email',ph:'email@ipe.city',v:email,s:setEmail},{l:'Senha',t:'password',ph:'••••••••',v:pw,s:setPw}].map(f=>(
            <div key={f.l} style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontFamily:'Chakra Petch,monospace', fontSize:9, letterSpacing:'0.12em', color:fgm }}>{f.l.toUpperCase()}</label>
              <input type={f.t} value={f.v} onChange={e=>f.s(e.target.value)} placeholder={f.ph}
                style={{ height:42, background:'rgba(5,8,15,0.8)', border:`1px solid ${border}`, borderRadius:10, padding:'0 14px', color:fg, fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none', transition:'all 0.2s' }}
                onFocus={e=>{e.target.style.borderColor='rgba(132,228,0,0.35)';e.target.style.boxShadow=`0 0 0 3px rgba(132,228,0,0.06)`}}
                onBlur={e=>{e.target.style.borderColor=border;e.target.style.boxShadow='none'}} />
            </div>
          ))}
          <button type="submit" disabled={loading}
            style={{ height:44, background:lime, color:'#04080e', borderRadius:11, border:'none', fontSize:13, fontWeight:700, fontFamily:'DM Sans,sans-serif', cursor:'pointer', boxShadow:`0 6px 24px ${lime}30`, transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
            onMouseEnter={e=>{if(!loading){e.currentTarget.style.background='#96f200';e.currentTarget.style.boxShadow=`0 8px 32px ${lime}45`;}}}
            onMouseLeave={e=>{if(!loading){e.currentTarget.style.background=lime;e.currentTarget.style.boxShadow=`0 6px 24px ${lime}30`;}}}>
            {loading ? <><span style={{ width:13, height:13, border:'2px solid rgba(4,8,14,0.3)', borderTopColor:'#04080e', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }}/> Entrando...</> : 'Acessar →'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── EVENT SELECTION ───────────────────────────────────── */
function EventSelection({ onSelect, totalToday }) {
  const [count,setCount] = useState(totalToday);
  const [feed,setFeed]   = useState(FEED_INIT);
  const [syncing,setSyncing] = useState(false);

  /* Simulate live check-ins */
  useEffect(() => {
    const names = ['Lucas Andrade','Mariana Costa','Rafael Silva','Juliana Rocha','Pedro Lima'];
    const tags  = ['ARCHITECT','EXPLORER','VIP','SPEAKER','STAFF'];
    let i = 0;
    const t = setInterval(() => {
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      const tag  = tags[Math.floor(Math.random()*tags.length)];
      const name = names[i % names.length]; i++;
      setFeed(f => [{ name, tag, time, ticket: tag }, ...f.slice(0,7)]);
      setCount(c => c + 1);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:32 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontFamily:'Chakra Petch,monospace', fontSize:9, letterSpacing:'0.18em', color:fgm, marginBottom:10 }}>QUARTA · 30 ABRIL 2025</div>
          <h1 style={{ fontFamily:'Playfair Display,serif', fontSize:48, fontWeight:700, lineHeight:1.0, letterSpacing:'-0.025em', color:fg }}>
            Check-<span style={{ background:`linear-gradient(135deg,${lime},${blue})`, WebkitBackgroundClip:'text', backgroundClip:'text', color:'transparent' }}>In</span>
          </h1>
        </div>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <button onClick={()=>{setSyncing(true);setTimeout(()=>setSyncing(false),1500)}} disabled={syncing}
            style={{ ...glass, borderRadius:10, border:`1px solid ${border}`, padding:'8px 14px', fontFamily:'DM Sans,sans-serif', fontSize:12, color:fgm, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ display:'inline-block', animation:syncing?'spin 0.8s linear infinite':'none', fontSize:13 }}>↻</span>
            {syncing?'Sync...':'Luma Sync'}
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
        <KpiCard label="CHECK-INS HOJE" value={count} delta="+12%" accent={lime} sub="Atualizado ao vivo" />
        <KpiCard label="EVENTOS ATIVOS" value={EVENTS.length} accent={blue} sub="Incluindo próximos" />
        <KpiCard label="TAXA DE PRESENÇA" value="68%" delta="+5%" accent="#a855f7" sub="vs. inscrições" />
      </div>

      {/* Events + live feed grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:16, alignItems:'start' }}>
        {/* Events */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ fontFamily:'Chakra Petch,monospace', fontSize:9, letterSpacing:'0.18em', color:fgm, marginBottom:2 }}>EVENTOS DE HOJE</div>
          {EVENTS.map(e => {
            const pct = Math.round(e.checkins/e.reg*100);
            return (
              <button key={e.id} onClick={()=>onSelect(e)}
                style={{ ...glass, borderRadius:16, padding:22, border:`1px solid ${border}`, cursor:'pointer', textAlign:'left', width:'100%', position:'relative', overflow:'hidden', transition:'all 0.22s' }}
                onMouseEnter={e2=>{e2.currentTarget.style.borderColor='rgba(132,228,0,0.25)';e2.currentTarget.style.transform='translateY(-2px)';e2.currentTarget.style.boxShadow=`0 20px 60px rgba(0,0,0,0.3),0 0 0 1px rgba(132,228,0,0.08)`;}}
                onMouseLeave={e2=>{e2.currentTarget.style.borderColor=border;e2.currentTarget.style.transform='none';e2.currentTarget.style.boxShadow='none';}}>
                {/* accent top */}
                <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${lime}60,transparent)` }} />
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:lime, boxShadow:`0 0 8px ${lime}`, animation:'pulse 2s infinite' }} />
                      <span style={{ fontFamily:'Chakra Petch,monospace', fontSize:8, color:lime, letterSpacing:'0.14em' }}>AO VIVO</span>
                    </div>
                    <div style={{ fontFamily:'Playfair Display,serif', fontSize:18, fontWeight:700, color:fg, lineHeight:1.3, marginBottom:6 }}>{e.name}</div>
                    <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:12, color:fgm, display:'flex', gap:14 }}>
                      <span>⏱ {e.time}</span><span>📍 {e.location}</span>
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0, marginLeft:20 }}>
                    <div style={{ fontFamily:'Playfair Display,serif', fontSize:32, fontWeight:700, color:lime, lineHeight:1 }}>{pct}%</div>
                    <div style={{ fontFamily:'Chakra Petch,monospace', fontSize:8, color:fgm, marginTop:2 }}>PRESENÇA</div>
                  </div>
                </div>
                {/* Stats row */}
                <div style={{ display:'flex', gap:20, marginBottom:12, fontFamily:'DM Sans,sans-serif', fontSize:12 }}>
                  <span style={{ color:fgm }}><span style={{ color:fg, fontWeight:600 }}>{e.reg}</span> inscritos</span>
                  <span style={{ color:fgm }}><span style={{ color:lime, fontWeight:600 }}>{e.checkins}</span> presentes</span>
                  <span style={{ color:fgm }}><span style={{ color:fg, fontWeight:600 }}>{e.reg-e.checkins}</span> pendentes</span>
                </div>
                {/* Progress */}
                <div style={{ height:5, borderRadius:9999, background:'rgba(238,242,255,0.05)', overflow:'hidden', position:'relative' }}>
                  <div style={{ position:'absolute', inset:0, width:`${pct}%`, background:`linear-gradient(90deg,${lime},${blue})`, borderRadius:9999, boxShadow:`0 0 12px ${lime}50`, transition:'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
                </div>
                <div style={{ marginTop:10, fontFamily:'Chakra Petch,monospace', fontSize:9, color:fgm, display:'flex', alignItems:'center', gap:6 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  Clique para iniciar check-in
                </div>
              </button>
            );
          })}
        </div>

        {/* Live feed */}
        <div style={{ ...glass, borderRadius:16, overflow:'hidden', flexShrink:0 }}>
          <div style={{ padding:'14px 16px', borderBottom:`1px solid ${border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:lime, animation:'pulse 2s ease-in-out infinite' }} />
              <span style={{ fontFamily:'Chakra Petch,monospace', fontSize:9, letterSpacing:'0.14em', color:lime }}>AO VIVO</span>
            </div>
            <span style={{ fontFamily:'Chakra Petch,monospace', fontSize:8, color:fgm, letterSpacing:'0.1em' }}>ÚLTIMOS CHECK-INS</span>
          </div>
          <div style={{ maxHeight:380, overflowY:'hidden', position:'relative' }}>
            {feed.map((c,i) => (
              <div key={`${c.name}-${i}`} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px', borderBottom:`1px solid rgba(238,242,255,0.04)`, animation: i===0 ? 'slideIn 0.35s ease both' : 'none', background: i===0 ? 'rgba(132,228,0,0.03)' : 'transparent', transition:'background 0.5s' }}>
                <Avatar name={c.name} size={28} gradient={c.tag==='ARCHITECT'||c.tag==='VIP'?'lime':'blue'} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:12, fontWeight:500, color:fg, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.name}</div>
                  <Tag>{c.tag}</Tag>
                </div>
                <span style={{ fontFamily:'Chakra Petch,monospace', fontSize:9, color:fgm, flexShrink:0 }}>{c.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── CHECK-IN FLOW ─────────────────────────────────────── */
function CheckInFlow({ event, onBack }) {
  const [query,setQuery]   = useState('');
  const [results,setResults] = useState([]);
  const [selected,setSelected] = useState(null);
  const [success,setSuccess]   = useState(null);
  const [checkedIn,setCheckedIn] = useState(new Set(['p1','p2','p4','p6','p8']));
  const ref = useRef(null);
  useEffect(()=>{ ref.current?.focus(); },[]);

  const search = v => {
    setQuery(v); setSelected(null);
    if(v.length<2){setResults([]);return;}
    setResults(PEOPLE.filter(p=>p.name.toLowerCase().includes(v.toLowerCase())).slice(0,6));
  };
  const confirm = () => {
    if(!selected) return;
    setCheckedIn(s=>new Set([...s,selected.id]));
    setSuccess(selected.name);
    setQuery(''); setSelected(null); setResults([]);
    setTimeout(()=>setSuccess(null),3000);
  };
  const pct = Math.round(event.checkins/event.reg*100);
  const done = [...checkedIn].length;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
        <div>
          <button onClick={onBack} style={{ background:'transparent', border:`1px solid ${border}`, borderRadius:8, padding:'5px 12px', fontFamily:'DM Sans,sans-serif', fontSize:11, color:fgm, cursor:'pointer', marginBottom:14, display:'flex', alignItems:'center', gap:5 }}>
            <span>←</span> Eventos
          </button>
          <h1 style={{ fontFamily:'Playfair Display,serif', fontSize:32, fontWeight:700, lineHeight:1.1, color:fg, maxWidth:600 }}>{event.name}</h1>
          <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:12, color:fgm, marginTop:6, display:'flex', gap:16 }}>
            <span>⏱ {event.time}</span><span>📍 {event.location}</span>
          </div>
        </div>
        {/* Live counter */}
        <div style={{ ...glass, borderRadius:16, padding:'16px 22px', textAlign:'center', flexShrink:0, position:'relative', overflow:'hidden', animation:'glowPulse 3s ease-in-out infinite' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${lime},transparent)` }} />
          <div style={{ fontFamily:'Playfair Display,serif', fontSize:44, fontWeight:700, color:lime, lineHeight:1 }}>{event.checkins + done - 5}</div>
          <div style={{ fontFamily:'Chakra Petch,monospace', fontSize:8, color:fgm, marginTop:4, letterSpacing:'0.12em' }}>PRESENTES</div>
          <div style={{ height:3, borderRadius:9999, background:`rgba(238,242,255,0.05)`, marginTop:10 }}>
            <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${lime},${blue})`, borderRadius:9999 }} />
          </div>
          <div style={{ fontFamily:'Chakra Petch,monospace', fontSize:8, color:fgm, marginTop:5 }}>{pct}% · {event.reg} inscritos</div>
        </div>
      </div>

      {/* Main grid: search + list */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, alignItems:'start' }}>
        {/* Search panel */}
        <div style={{ ...glass, borderRadius:18, padding:24, display:'flex', flexDirection:'column', gap:14, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${lime}40,transparent)` }} />

          {success && (
            <div style={{ background:'rgba(52,211,153,0.07)', border:'1px solid rgba(52,211,153,0.18)', borderRadius:12, padding:'16px', textAlign:'center', animation:'popIn 0.35s cubic-bezier(0.16,1,0.3,1) both' }}>
              <div style={{ fontSize:28, marginBottom:4 }}>✓</div>
              <div style={{ fontFamily:'Playfair Display,serif', fontSize:18, fontWeight:700, color:'#34d399' }}>Check-in registrado</div>
              <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:13, color:'rgba(52,211,153,0.7)', marginTop:2 }}>{success}</div>
            </div>
          )}

          <div style={{ fontFamily:'Chakra Petch,monospace', fontSize:9, letterSpacing:'0.16em', color:fgm }}>BUSCAR INSCRITO</div>

          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:fgm, fontSize:15 }}>⌕</span>
            <input ref={ref} value={query} onChange={e=>search(e.target.value)} placeholder="Nome do participante..."
              style={{ width:'100%', height:48, background:'rgba(5,8,15,0.8)', border:`1px solid ${border}`, borderRadius:13, paddingLeft:42, paddingRight:14, color:fg, fontSize:14, fontFamily:'DM Sans,sans-serif', outline:'none', transition:'all 0.2s' }}
              onFocus={e=>{e.target.style.borderColor=`${lime}60`;e.target.style.boxShadow=`0 0 0 3px ${lime}0d`}}
              onBlur={e=>{e.target.style.borderColor=border;e.target.style.boxShadow='none'}} />
            <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', fontFamily:'Chakra Petch,monospace', fontSize:8, color:fgm, border:`1px solid ${border}`, borderRadius:5, padding:'2px 6px' }}>⌘K</span>
          </div>

          {results.length>0 && !selected && (
            <div style={{ background:'rgba(5,8,15,0.9)', border:`1px solid ${border}`, borderRadius:12, overflow:'hidden', animation:'fadeUp 0.25s ease both' }}>
              {results.map((p,i)=>(
                <button key={p.id} onClick={()=>{setSelected(p);setQuery(p.name);setResults([]);}}
                  style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 14px', background:'transparent', border:'none', borderBottom:i<results.length-1?`1px solid ${border}`:'none', cursor:'pointer', transition:'background 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.background=`${lime}06`}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <Avatar name={p.name} size={30} gradient={checkedIn.has(p.id)?'lime':'blue'} />
                    <div>
                      <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:13, fontWeight:500, color:fg, textAlign:'left' }}>{p.name}</div>
                      {p.tag && <Tag>{p.tag}</Tag>}
                    </div>
                  </div>
                  {checkedIn.has(p.id)
                    ? <span style={{ fontFamily:'Chakra Petch,monospace', fontSize:9, color:'#34d399' }}>✓ PRESENTE</span>
                    : <span style={{ fontFamily:'Chakra Petch,monospace', fontSize:9, color:fgm }}>{p.ticket}</span>}
                </button>
              ))}
            </div>
          )}

          {selected && (
            <div style={{ display:'flex', flexDirection:'column', gap:10, animation:'fadeUp 0.3s ease both' }}>
              {/* Selected person card */}
              <div style={{ background:`${lime}08`, border:`1px solid ${lime}20`, borderRadius:12, padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
                <Avatar name={selected.name} size={36} />
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:14, fontWeight:600, color:fg }}>{selected.name}</div>
                  <div style={{ display:'flex', gap:6, marginTop:3 }}>
                    {selected.tag && <Tag>{selected.tag}</Tag>}
                    <Tag color={blue}>{selected.ticket}</Tag>
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:'Chakra Petch,monospace', fontSize:8, color:'#34d399', letterSpacing:'0.1em' }}>ACESSO VÁLIDO</div>
                </div>
              </div>
              {checkedIn.has(selected.id) && (
                <div style={{ background:'rgba(212,168,67,0.06)', border:'1px solid rgba(212,168,67,0.18)', borderRadius:10, padding:'10px 14px', fontFamily:'DM Sans,sans-serif', fontSize:12, color:'#d4a843' }}>
                  ⚠ Esta pessoa já realizou check-in
                </div>
              )}
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={confirm} style={{ flex:1, height:48, background:lime, color:'#04080e', border:'none', borderRadius:12, fontSize:14, fontWeight:700, fontFamily:'DM Sans,sans-serif', cursor:'pointer', boxShadow:`0 8px 28px ${lime}35`, letterSpacing:'0.01em', transition:'all 0.2s' }}
                  onMouseEnter={e=>{e.currentTarget.style.background='#96f200';e.currentTarget.style.boxShadow=`0 12px 36px ${lime}50`}}
                  onMouseLeave={e=>{e.currentTarget.style.background=lime;e.currentTarget.style.boxShadow=`0 8px 28px ${lime}35`}}>
                  ✓ Confirmar Check-In
                </button>
                <button onClick={()=>{setSelected(null);setQuery('');}} style={{ height:48, padding:'0 18px', background:'transparent', border:`1px solid ${border}`, borderRadius:12, fontFamily:'DM Sans,sans-serif', fontSize:13, color:fgm, cursor:'pointer' }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {!selected && !results.length && (
            <div style={{ textAlign:'center', padding:'20px 0', color:fgm }}>
              <div style={{ fontSize:28, marginBottom:8, opacity:0.3 }}>⌕</div>
              <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:13 }}>Digite pelo menos 2 caracteres</div>
              <div style={{ fontFamily:'Chakra Petch,monospace', fontSize:9, marginTop:4, letterSpacing:'0.1em', opacity:0.5 }}>OU SELECIONE DA LISTA →</div>
            </div>
          )}
        </div>

        {/* Participant list */}
        <div style={{ ...glass, borderRadius:18, overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:`1px solid ${border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontFamily:'Chakra Petch,monospace', fontSize:9, letterSpacing:'0.14em', color:fgm }}>LISTA DE INSCRITOS</span>
            <span style={{ fontFamily:'Chakra Petch,monospace', fontSize:9, color:lime }}>{PEOPLE.filter(p=>checkedIn.has(p.id)).length}/{PEOPLE.length}</span>
          </div>
          {PEOPLE.map((p,i) => {
            const done2 = checkedIn.has(p.id);
            return (
              <div key={p.id}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 18px', borderBottom:i<PEOPLE.length-1?`1px solid rgba(238,242,255,0.04)`:'none', cursor:'pointer', transition:'background 0.15s', background: selected?.id===p.id ? `${lime}06` : 'transparent' }}
                onClick={()=>{ if(!done2){ setSelected(p); setQuery(p.name); setResults([]); }}}
                onMouseEnter={e=>{ if(!done2) e.currentTarget.style.background=`${lime}04`}}
                onMouseLeave={e=>{ if(selected?.id!==p.id) e.currentTarget.style.background='transparent'}}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <Avatar name={p.name} size={28} gradient={done2?'lime':'blue'} />
                  <div>
                    <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:12, fontWeight:500, color:done2?fg:fgm }}>{p.name}</div>
                    {p.tag && <Tag color={done2?lime:fgm}>{p.tag}</Tag>}
                  </div>
                </div>
                <div>
                  {done2
                    ? <span style={{ fontFamily:'Chakra Petch,monospace', fontSize:9, color:'#34d399' }}>✓ {p.time}</span>
                    : <button onClick={e=>{e.stopPropagation();setCheckedIn(s=>new Set([...s,p.id]));}} style={{ fontFamily:'Chakra Petch,monospace', fontSize:9, color:lime, background:`${lime}0a`, border:`1px solid ${lime}25`, borderRadius:6, padding:'3px 10px', cursor:'pointer' }}>CHECK-IN</button>
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── DASHBOARD ─────────────────────────────────────────── */
function DashboardPage() {
  const bmax = Math.max(...DAILY.map(d=>d.v));
  const ptot = PIE.reduce((a,b)=>a+b.v,0);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:28 }}>
      <div>
        <div style={{ fontFamily:'Chakra Petch,monospace', fontSize:9, letterSpacing:'0.18em', color:fgm, marginBottom:10 }}>ANÁLISE · ABR 2025</div>
        <h1 style={{ fontFamily:'Playfair Display,serif', fontSize:48, fontWeight:700, lineHeight:1.0, letterSpacing:'-0.025em', background:`linear-gradient(135deg,${lime} 20%,${blue} 80%)`, WebkitBackgroundClip:'text', backgroundClip:'text', color:'transparent' }}>Dashboard</h1>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
        <KpiCard label="TOTAL CHECK-INS" value="247" delta="+8%" accent={lime} sub="Últimos 30 dias" />
        <KpiCard label="PESSOAS ÚNICAS"  value="183" delta="+12"  accent={blue} sub="Participantes distintos" />
        <KpiCard label="ARQUITETOS"      value="41"  delta="-3"   accent="#a855f7" sub="Ticket Architect ativo" />
      </div>

      {/* Charts */}
      <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:14 }}>
        {/* Bar chart */}
        <div style={{ ...glass, borderRadius:16, padding:24 }}>
          <div style={{ fontFamily:'Chakra Petch,monospace', fontSize:9, letterSpacing:'0.16em', color:fgm, marginBottom:20 }}>PRESENÇA DIÁRIA</div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:5, height:160 }}>
            {DAILY.map((d,i) => {
              const h = (d.v/bmax)*100;
              const isLast = i===DAILY.length-1;
              return (
                <div key={d.d} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5, height:'100%', justifyContent:'flex-end' }}>
                  <div style={{ width:'100%', borderRadius:'4px 4px 0 0', background: isLast ? `linear-gradient(180deg,${lime},${lime}60)` : `linear-gradient(180deg,rgba(132,228,0,0.55),rgba(132,228,0,0.15))`, height:`${h}%`, minHeight:3, transition:'height 0.6s cubic-bezier(0.16,1,0.3,1)', boxShadow: isLast ? `0 0 20px ${lime}60` : 'none', position:'relative', overflow:'hidden' }}>
                    {isLast && <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,rgba(255,255,255,0.15),transparent)' }} />}
                  </div>
                  <span style={{ fontFamily:'Chakra Petch,monospace', fontSize:6, color: isLast?lime:fgm, letterSpacing:'0.04em' }}>{d.d}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Donut */}
        <div style={{ ...glass, borderRadius:16, padding:24 }}>
          <div style={{ fontFamily:'Chakra Petch,monospace', fontSize:9, letterSpacing:'0.16em', color:fgm, marginBottom:20 }}>TIPO DE ACESSO</div>
          <svg viewBox="-5 0 130 110" style={{ width:'100%', maxHeight:110, display:'block' }}>
            {(()=>{ let a=-Math.PI/2; return PIE.map((s,i)=>{ const ang=(s.v/ptot)*2*Math.PI,x1=60+42*Math.cos(a),y1=55+42*Math.sin(a); a+=ang; const x2=60+42*Math.cos(a),y2=55+42*Math.sin(a); return <path key={i} d={`M60,55 L${x1},${y1} A42,42,0,${ang>Math.PI?1:0},1,${x2},${y2} Z`} fill={s.c} opacity="0.88" />;})();}
            <circle cx="60" cy="55" r="21" fill={bg} />
            <text x="60" y="52" textAnchor="middle" fill={fg} style={{ fontFamily:'Playfair Display,serif', fontSize:12, fontWeight:700 }}>247</text>
            <text x="60" y="61" textAnchor="middle" fill={fgm} style={{ fontFamily:'Chakra Petch,monospace', fontSize:5 }}>TOTAL</text>
          </svg>
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:8 }}>
            {PIE.map(s=>(
              <div key={s.n} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <span style={{ width:7, height:7, borderRadius:2, background:s.c, display:'inline-block', boxShadow:`0 0 6px ${s.c}70` }} />
                  <span style={{ fontFamily:'DM Sans,sans-serif', fontSize:11, color:fgm }}>{s.n}</span>
                </div>
                <span style={{ fontFamily:'Chakra Petch,monospace', fontSize:10, color:fg }}>{Math.round(s.v/ptot*100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top table */}
      <div style={{ ...glass, borderRadius:16, overflow:'hidden' }}>
        <div style={{ padding:'16px 22px', borderBottom:`1px solid ${border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontFamily:'Chakra Petch,monospace', fontSize:9, letterSpacing:'0.16em', color:fgm }}>MAIS PRESENTES</div>
          <div style={{ fontFamily:'Chakra Petch,monospace', fontSize:8, color:fgm }}>ÚLTIMOS 30 DIAS</div>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${border}`, background:'rgba(5,8,15,0.4)' }}>
              {['#','Nome','Categoria','Presença'].map(h=><th key={h} style={{ padding:'10px 22px', textAlign:h==='Presença'?'right':'left', fontFamily:'Chakra Petch,monospace', fontSize:8, letterSpacing:'0.12em', color:fgm, fontWeight:500 }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {TOP.map((p,i)=>(
              <tr key={p.n} style={{ borderBottom:`1px solid rgba(238,242,255,0.03)`, transition:'background 0.15s', cursor:'default' }}
                onMouseEnter={e=>e.currentTarget.style.background=`${lime}03`}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td style={{ padding:'13px 22px', fontFamily:'Chakra Petch,monospace', fontSize:10, color:fgm }}>{i+1}</td>
                <td style={{ padding:'13px 22px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <Avatar name={p.n} size={28} />
                    <span style={{ fontFamily:'DM Sans,sans-serif', fontWeight:500, fontSize:13, color:fg }}>{p.n}</span>
                  </div>
                </td>
                <td style={{ padding:'13px 22px' }}><Tag>{p.t}</Tag></td>
                <td style={{ padding:'13px 22px', textAlign:'right' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, justifyContent:'flex-end' }}>
                    <div style={{ height:3, width:60, borderRadius:9999, background:`rgba(238,242,255,0.06)`, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${(p.c/14)*100}%`, background:`linear-gradient(90deg,${lime},${blue})`, borderRadius:9999 }} />
                    </div>
                    <span style={{ fontFamily:'Playfair Display,serif', fontSize:20, fontWeight:700, color:lime, minWidth:24 }}>{p.c}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── PEOPLE ────────────────────────────────────────────── */
function PessoasPage() {
  const [q,setQ] = useState('');
  const filtered = PEOPLE.filter(p=>!q||p.name.toLowerCase().includes(q.toLowerCase()));
  const checkedCount = PEOPLE.filter(p=>p.checked).length;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:20 }}>
        <div>
          <div style={{ fontFamily:'Chakra Petch,monospace', fontSize:9, letterSpacing:'0.18em', color:fgm, marginBottom:10 }}>INSCRITOS</div>
          <h1 style={{ fontFamily:'Playfair Display,serif', fontSize:48, fontWeight:700, lineHeight:1.0, letterSpacing:'-0.025em', color:fg }}>Pessoas</h1>
        </div>
        <div style={{ display:'flex', gap:14, alignItems:'center' }}>
          <div style={{ ...glass, borderRadius:12, padding:'10px 18px', textAlign:'center' }}>
            <div style={{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:lime }}>{checkedCount}</div>
            <div style={{ fontFamily:'Chakra Petch,monospace', fontSize:7, color:fgm, marginTop:2, letterSpacing:'0.1em' }}>PRESENTES</div>
          </div>
          <div style={{ ...glass, borderRadius:12, padding:'10px 18px', textAlign:'center' }}>
            <div style={{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:fg }}>{PEOPLE.length}</div>
            <div style={{ fontFamily:'Chakra Petch,monospace', fontSize:7, color:fgm, marginTop:2, letterSpacing:'0.1em' }}>TOTAL</div>
          </div>
          <button style={{ height:44, padding:'0 20px', background:lime, color:'#04080e', border:'none', borderRadius:11, fontFamily:'DM Sans,sans-serif', fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:`0 6px 20px ${lime}30` }}>+ Adicionar</button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position:'relative' }}>
        <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:fgm, fontSize:15 }}>⌕</span>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar por nome..."
          style={{ width:'100%', height:44, background:'rgba(5,8,15,0.7)', border:`1px solid ${border}`, borderRadius:12, paddingLeft:40, color:fg, fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none' }} />
      </div>

      {/* Table */}
      <div style={{ ...glass, borderRadius:16, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${border}`, background:'rgba(5,8,15,0.5)' }}>
              {['Nome','Categoria','Ingresso','Status'].map(h=><th key={h} style={{ padding:'11px 20px', textAlign:'left', fontFamily:'Chakra Petch,monospace', fontSize:8, letterSpacing:'0.12em', color:fgm, fontWeight:500 }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p,i)=>(
              <tr key={p.id} style={{ borderBottom:i<filtered.length-1?`1px solid rgba(238,242,255,0.04)`:'none', transition:'background 0.15s', cursor:'default' }}
                onMouseEnter={e=>e.currentTarget.style.background=`${lime}03`}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td style={{ padding:'13px 20px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <Avatar name={p.name} size={30} gradient={p.checked?'lime':'blue'} />
                    <span style={{ fontFamily:'DM Sans,sans-serif', fontWeight:500, fontSize:13, color:fg }}>{p.name}</span>
                  </div>
                </td>
                <td style={{ padding:'13px 20px' }}>{p.tag ? <Tag>{p.tag}</Tag> : <span style={{ color:fgm, fontSize:11 }}>—</span>}</td>
                <td style={{ padding:'13px 20px' }}><Tag color={blue}>{p.ticket}</Tag></td>
                <td style={{ padding:'13px 20px' }}>
                  {p.checked
                    ? <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ width:5, height:5, borderRadius:'50%', background:'#34d399', boxShadow:'0 0 6px #34d399' }} />
                        <span style={{ fontFamily:'Chakra Petch,monospace', fontSize:10, color:'#34d399' }}>✓ {p.time}</span>
                      </div>
                    : <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ width:5, height:5, borderRadius:'50%', background:fgm }} />
                        <span style={{ fontFamily:'Chakra Petch,monospace', fontSize:10, color:fgm }}>PENDENTE</span>
                      </div>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

Object.assign(window, { LoginScreen, EventSelection, CheckInFlow, DashboardPage, PessoasPage, EVENTS, Sidebar });

/* ── SIDEBAR ─────────────────────────────────────────────── */
function Sidebar({ active, onNav }) {
  const nav = [
    { id:'checkin',   label:'Check-in',  icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
    { id:'dashboard', label:'Dashboard', icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
    { id:'pessoas',   label:'Inscritos', icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
  ];
  return (
    <aside style={{ width:220, borderRight:`1px solid rgba(238,242,255,0.055)`, display:'flex', flexDirection:'column', padding:'20px 12px', gap:4, background:'rgba(5,8,15,0.92)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', flexShrink:0 }}>
      <div style={{ padding:'4px 10px 20px' }}>
        <img src="../../assets/ipe-city-logo.png" alt="IPÊ" style={{ height:16, opacity:0.88 }} />
      </div>
      {nav.map(n => (
        <button key={n.id} onClick={() => onNav(n.id)}
          style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:9, border:'none', cursor:'pointer', background: active===n.id ? `rgba(132,228,0,0.1)` : 'transparent', color: active===n.id ? lime : fgm, fontSize:13, fontWeight: active===n.id ? 600 : 400, fontFamily:'DM Sans,sans-serif', transition:'all 0.18s', textAlign:'left', width:'100%', letterSpacing:'0.01em' }}>
          <span style={{ opacity: active===n.id ? 1 : 0.55 }}>{n.icon}</span>
          {n.label}
          {active===n.id && <span style={{ marginLeft:'auto', width:4, height:4, borderRadius:'50%', background:lime, boxShadow:`0 0 8px ${lime}`, animation:'pulse 2s ease-in-out infinite' }} />}
        </button>
      ))}
      <div style={{ marginTop:'auto', padding:'12px 10px', borderTop:`1px solid rgba(238,242,255,0.05)` }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:lime, boxShadow:`0 0 8px ${lime}`, animation:'pulse 2s ease-in-out infinite' }} />
          <span style={{ fontFamily:'Chakra Petch,monospace', fontSize:8, color:lime, letterSpacing:'0.12em' }}>SISTEMA ATIVO</span>
        </div>
        <div style={{ fontFamily:'Chakra Petch,monospace', fontSize:8, color:fgm, letterSpacing:'0.1em' }}>LUMA SYNC · QUA 30 ABR</div>
      </div>
    </aside>
  );
}
Object.assign(window, { Sidebar });
