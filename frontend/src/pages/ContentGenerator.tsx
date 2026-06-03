import { useState } from 'react'
import { supabase } from '../lib/supabase'

const FIRMS = [
  "Alpha Futures","Apex Trader Funding","Bulenox","DayTraders","E8 Futures",
  "Earn2Trade","Funded Futures Network","Legends Trading","Lucid Trading",
  "MyFundedFutures","OneUp","PhidiasPropfirm","Phoenix Trader Funding",
  "Purdia Capital","TakeProfitTrader","TradeDay","Tradeify","Trading Pit"
]
const ANGLES = [
  { id:"pain", label:"Trader Pain Point" },
  { id:"promo", label:"Discount Promo" },
  { id:"lifestyle", label:"Funded Lifestyle" },
  { id:"lowbarrier", label:"Low Barrier to Entry" },
  { id:"volatility", label:"Market Volatility" },
  { id:"story", label:"Success Story" },
]
const PLATFORMS = ["Twitter","Facebook","Instagram"]
const PILLARS   = ["Redundancy","Economics","Speed","Scalability"]
const HN: Record<string,string> = { Twitter:"TWITTER", Facebook:"FACEBOOK", Instagram:"INSTAGRAM" }
const CODE = "MOT"
const MODES = [
  { id:"onetime", label:"One-Time Post" },
  { id:"weekly",  label:"Weekly Program" },
  { id:"campaign",label:"4-Week Campaign" },
]
const modeDesc: Record<string,string> = {
  onetime:  "One post per platform, staggered by day. Exports HootSuite-ready CSV.",
  weekly:   "One post per pillar per platform across 4 weeks. Evergreen drip.",
  campaign: "Full 28-post campaign. 7 days per pillar. Platforms rotate daily.",
}

const post = (firm: string) => ({
  pain:{
    Twitter:`Most futures traders fail because of undercapitalization — not bad strategy.\n\n${firm} gives you the capital. You bring the edge.\n\nCode ${CODE} → link in bio.\n\n#PropFirm #FuturesTrading #FundedTrader`,
    Facebook:`Let me be honest with you.\n\nMost aspiring futures traders don't fail because they lack skill. They fail because they're undercapitalized, overleveraged, and trading scared money.\n\n${firm} exists to fix that. You bring the edge. They bring the capital.\n\nUse code ${CODE} at checkout.`,
    Instagram:`Trading with scared money is the #1 reason most futures traders blow up.\n\nNot lack of skill. Scared money.\n\n${firm} removes that from the equation.\n\nCode ${CODE} — link in bio.\n\n#FuturesTrader #PropFirm #FundedTrader #TradeSharp`,
  },
  promo:{
    Twitter:`${firm} promo is live.\n\nCode ${CODE} at checkout.\n\nFewer excuses. More funded accounts.\n\n#PropFirm #FuturesTrading`,
    Facebook:`Quick heads-up — ${firm} currently has a discount on evaluation accounts.\n\nStack with code ${CODE} for additional savings.\n\nSolid rules, fair drawdown, consistent payouts. Questions below.`,
    Instagram:`Promo alert — ${firm} eval fees just got cheaper.\n\nCode ${CODE} at checkout.\n\nLink in bio.\n\n#PropFirm #FundedFutures #TradingPromo #FuturesTrader #TradeSharp`,
  },
  lifestyle:{
    Twitter:`Funded trader life isn't glamorous.\n\nIt's discipline. Process. Consistency.\n\n${firm} gives you the capital to execute that at scale.\n\nCode ${CODE}.\n\n#FundedTrader`,
    Facebook:`The funded trader routine isn't lambos and beach trades.\n\nIt's waking up at open, executing your plan, hitting your objective, and logging off.\n\nThat's the job. And ${firm} will pay you to do it.\n\nCode ${CODE}.`,
    Instagram:`Wake up. Review the plan. Execute. Log off.\n\n${firm} funds traders who do that consistently.\n\nCode ${CODE} — link in bio.\n\n#FundedTrader #TradingRoutine #FuturesTrader #TradeSharp`,
  },
  lowbarrier:{
    Twitter:`You don't need $50k to trade futures seriously.\n\n${firm} evals start at a fraction of that.\n\nCode ${CODE}.\n\n#FuturesTrading #PropFirm #GetFunded`,
    Facebook:`The barrier to getting a funded futures account is lower than most think.\n\n${firm} has evaluation accounts at multiple sizes.\n\nWith code ${CODE} the entry cost drops further.\n\nLink in bio.`,
    Instagram:`Getting funded doesn't require a massive bankroll.\n\n${firm} eval → prove your edge → get funded → split profits.\n\nCode ${CODE}.\n\nLink in bio.\n\n#LowBarrierEntry #PropFirm #FuturesTrader #GetFunded #TradeSharp`,
  },
  volatility:{
    Twitter:`Volatility is back. ES and NQ are moving.\n\nThis is when funded traders make their month.\n\n${firm} — code ${CODE}.\n\n#ESFutures #NQFutures #FuturesTrading`,
    Facebook:`Markets are moving right now.\n\nVolatility rewards prepared traders with proper capital.\n\n${firm} gives you that capital. Code ${CODE} saves you on the eval.\n\nLink in bio.`,
    Instagram:`ES and NQ are moving.\n\nThis is what funded traders train for.\n\n${firm} puts capital behind traders who are ready.\n\nCode ${CODE} — link in bio.\n\n#ESFutures #NQFutures #FundedTrader #PropFirm #TradeSharp`,
  },
  story:{
    Twitter:`Trader passes ${firm} eval on second attempt.\n\nFirst: revenge traded.\nSecond: followed the plan.\n\nProcess > emotion. Always.\n\nCode ${CODE}.\n\n#FundedTrader`,
    Facebook:`Trader blows personal account. Almost quits. Discovers ${firm}.\n\nTakes the eval seriously. Trades small, follows rules, passes.\n\nNow trading firm capital. Keeping 80-90% of profits. Personal savings intact.\n\nCode ${CODE}.`,
    Instagram:`From blown account to funded trader.\n\nThat's the story ${firm} makes possible.\n\nYou need a proven process — not a perfect record.\n\nCode ${CODE}.\n\nLink in bio.\n\n#FundedTrader #PropFirm #TradingJourney #TradeSharp`,
  },
})

const lib4w = (firm: string): Record<string,Record<string,Record<string,string[]>>> => ({
  Redundancy:{
    Twitter:[
      `Most futures traders blow up before they find their edge — not from bad strategy, but undercapitalization.\n\n${firm} gives you the redundancy to keep trading.\n\nCode ${CODE} → link in bio.\n\n#PropFirm #FuturesTrading`,
      `One bad week shouldn't end your trading career.\n\nWith ${firm}, it doesn't.\n\nCode ${CODE}.\n\n#FundedTrader #FuturesTrading`,
      `Personal account blown. Again.\n\nThe cycle ends when you stop using scared money.\n\n${firm} funds you. You trade the plan.\n\nCode ${CODE}.\n\n#PropFirm`,
      `Redundancy isn't weakness. It's strategy.\n\n${firm} traders don't rely on one account.\n\nCode ${CODE}.\n\n#FuturesTrading #FundedTrader`,
    ],
    Facebook:[
      `The reason most futures traders fail isn't their strategy. It's that they have no redundancy. One bad week wipes them out entirely.\n\n${firm} solves this structurally. Trade their capital. Keep your personal savings intact.\n\nCode ${CODE} at checkout.`,
      `Week two of the month and you've already hit your personal account's pain threshold?\n\n${firm} builds redundancy into your operation. Clear rules. Clear limits.\n\nCode ${CODE} at checkout.`,
      `Three things that drain trading accounts fast:\n\n→ No defined max loss\n→ Revenge trading\n→ Scared money\n\n${firm} addresses all three structurally.\n\nCode ${CODE}.`,
      `If your trading relies on one account with no backup plan, that's not a business. That's a gamble.\n\n${firm} funded traders operate differently.\n\nCode ${CODE} at checkout.`,
    ],
    Instagram:[
      `One blown account shouldn't end your trading career.\n\n${firm} builds redundancy in.\n\nCode ${CODE} — link in bio.\n\n#PropFirm #FundedTrader #FuturesTrader #TradeSharp`,
      `Scared money destroys good traders.\n\nThe fix is structural.\n\n${firm} removes personal capital from the equation.\n\nCode ${CODE} — link in bio.\n\n#FuturesTrading #PropFirm #MightyOxTrading`,
      `Your edge is real. Your capital is the problem.\n\n${firm} solves the capital problem.\n\nCode ${CODE} — link in bio.\n\n#FuturesTrader #PropFirm #GetFunded #TradeSharp`,
      `Built-in redundancy. Clear rules. Real payouts.\n\n${firm}.\n\nCode ${CODE} — link in bio.\n\n#FundedTrader #PropFirm #FuturesTrading`,
    ],
  },
  Economics:{
    Twitter:[
      `The math on self-funding a futures account doesn't work for most traders.\n\n${firm} changes the economics entirely.\n\nCode ${CODE}.\n\n#PropFirm #FuturesTrading`,
      `Eval fee vs. 6 months of blown personal accounts.\n\nRun the numbers.\n\n${firm} + code ${CODE} wins.\n\n#FundedTrader #PropFirm`,
      `The prop trading model:\n\n→ Small eval fee\n→ Trade firm capital\n→ Keep 80-90% profits\n→ Scale\n\n${firm}. Code ${CODE}.\n\n#FuturesTrading #PropFirm`,
      `Stop paying tuition to the market with your own money.\n\n${firm} changes the risk/reward economics.\n\nCode ${CODE}.\n\n#FuturesTrader #PropFirm`,
    ],
    Facebook:[
      `Self-funding a $50k futures account means risking real capital every session.\n\n${firm} flips this. Pay a fraction to prove your edge, then trade their capital at scale.\n\nCode ${CODE} at checkout.`,
      `The true cost of trading undercapitalized isn't just the losses. It's every bad decision made from a place of fear.\n\n${firm} + code ${CODE} is cheaper than another 6 months of that.`,
      `Prop trading economics in plain terms:\n\n1. Small eval fee\n2. Hit profit target\n3. Get funded\n4. Keep 80-90% profits\n5. Scale\n\n${firm} executes this well. Code ${CODE}.`,
      `The question isn't whether the eval fee is worth it.\n\nIt's what it costs you to keep trading undercapitalized for another year.\n\n${firm} + code ${CODE}.`,
    ],
    Instagram:[
      `The economics change entirely when it's not your money at risk.\n\n${firm} funds you. You trade. You split profits.\n\nCode ${CODE} — link in bio.\n\n#PropFirm #FuturesTrader #TradeSharp`,
      `Eval fee vs. year of losses.\n\nRun the math.\n\n${firm} + code ${CODE} wins.\n\nLink in bio.\n\n#PropFirm #FundedTrader #FuturesTrading`,
      `Trading their capital. Keeping your profits.\n\nThat's the ${firm} model.\n\nCode ${CODE} — link in bio.\n\n#FuturesTrader #GetFunded #PropFirm #TradeSharp`,
      `Stop using your savings as trading capital.\n\n${firm} changes the equation.\n\nCode ${CODE} — link in bio.\n\n#FundedTrader #PropFirm #FuturesTrading`,
    ],
  },
  Speed:{
    Twitter:[
      `How long to get funded with ${firm}?\n\nAs long as it takes to hit the target within the rules. No time limits.\n\nCode ${CODE}.\n\n#PropFirm #FuturesTrading`,
      `Traders who rush the eval fail.\n\nTraders who trade their process pass.\n\n${firm} rewards consistency.\n\nCode ${CODE}.\n\n#PropFirm #TradingDiscipline`,
      `The fastest path to funded isn't trading faster. It's trading cleaner.\n\n${firm} rewards that.\n\nCode ${CODE}.\n\n#FuturesTrading #FundedTrader`,
      `Fast-tracked or methodical — ${firm} accommodates your style.\n\nHit the target. Respect the rules. Get funded.\n\nCode ${CODE}.\n\n#FundedTrader`,
    ],
    Facebook:[
      `"How fast can I pass the ${firm} eval?"\n\nHonest answer: as fast as your edge allows. Some traders pass in days. Others take weeks. Both are fine.\n\nSpeed isn't the goal. Clean execution is.\n\nCode ${CODE}.`,
      `Rushing is one of the top reasons traders fail evals.\n\nThey see the target and size up. Overtrade. Blow the drawdown.\n\n${firm}'s rules protect both sides. Work with them.\n\nCode ${CODE}.`,
      `The traders who pass ${firm} evals fastest aren't the most aggressive. They're the most disciplined.\n\nConsistent process. Respect the max loss. Hit singles.\n\nCode ${CODE}.`,
      `Speed is a byproduct of process.\n\nThe traders I see pass ${firm} evals fastest follow a defined plan. Session by session.\n\nCode ${CODE}.`,
    ],
    Instagram:[
      `Fast eval or slow — the only metric: did you follow the rules?\n\n${firm} rewards clean process.\n\nCode ${CODE} — link in bio.\n\n#PropFirm #TradingDiscipline #FuturesTrader`,
      `Singles over home runs.\n\nThat's how funded traders pass ${firm} evals.\n\nCode ${CODE} — link in bio.\n\n#FundedTrader #PropFirm #DisciplineWins`,
      `Your edge doesn't need speed. It needs repetition.\n\n${firm} gives you the environment to prove that.\n\nCode ${CODE} — link in bio.\n\n#FuturesTrading #PropFirm #TradeSharp`,
      `Rushed the eval. Blew the drawdown.\n\nTrade your process. ${firm} rewards consistency.\n\nCode ${CODE} — link in bio.\n\n#FuturesTrading #TradingMindset`,
    ],
  },
  Scalability:{
    Twitter:[
      `Getting funded with ${firm} isn't the destination. It's the starting point.\n\nCode ${CODE}.\n\n#FundedTrader #PropFirm #ScaleUp`,
      `Scalability is why prop trading beats personal accounts long term.\n\n${firm}: prove edge → funded → scale capital → grow payouts.\n\nCode ${CODE}.\n\n#FundedTrader`,
      `One funded account becomes two. Two becomes a system.\n\n${firm} traders build scalable income.\n\nCode ${CODE}.\n\n#FuturesTrading #PropFirm`,
      `The ceiling on personal account trading is your savings.\n\nThe ceiling on ${firm} trading is your consistency.\n\nCode ${CODE}.\n\n#PropFirm`,
    ],
    Facebook:[
      `Most traders think of a funded account as a goal. Smart traders think of it as infrastructure.\n\n${firm} lets consistent traders run multiple funded accounts simultaneously.\n\nCode ${CODE}.`,
      `The ${firm} scalability model:\n\nPass eval → get funded → trade consistently → request payout → add second account → repeat.\n\nPersonal capital stays untouched.\n\nCode ${CODE}.`,
      `Scaling a trading operation used to require serious personal capital.\n\n${firm} changes that. Your edge is the asset. Their capital is the infrastructure.\n\nCode ${CODE}.`,
      `What does your trading operation look like at 5x the current size?\n\n${firm} makes that answerable without risking your savings.\n\nCode ${CODE}.`,
    ],
    Instagram:[
      `One account is a start. Five is a system.\n\n${firm} traders build scalable operations.\n\nCode ${CODE} — link in bio.\n\n#FundedTrader #PropFirm #ScaleUp`,
      `Eval → funded → consistent → scale.\n\nThat's the ${firm} path.\n\nCode ${CODE} — link in bio.\n\n#FuturesTrader #PropFirm #TradeSharp`,
      `Your edge scales. Your capital doesn't have to.\n\n${firm} funds the growth.\n\nCode ${CODE} — link in bio.\n\n#PropFirm #FuturesTrading #MightyOxTrading`,
      `The ceiling on your income is your consistency — not your savings.\n\n${firm} makes that real.\n\nCode ${CODE} — link in bio.\n\n#FundedTrader #ScaleUp #PropFirm`,
    ],
  },
} as any)

type Row = { date:string; message:string; network:string; platform:string; pillar:string; week:number; day:number }

function fmt(date: Date, time: string) {
  const yy = String(date.getFullYear()).slice(-2)
  const mo = String(date.getMonth()+1).padStart(2,'0')
  const dd = String(date.getDate()).padStart(2,'0')
  return `${yy}/${mo}/${dd} ${time}`
}

function buildOneTime(firm:string,_angle:string,platforms:string[],start:Date,time:string):Row[]{
  const p=post(firm) as any; const a=p[_angle]||p.pain
  return platforms.map((pl,i)=>{const d=new Date(start);d.setDate(d.getDate()+i);return{date:fmt(d,time),message:a[pl]||a.Twitter,network:HN[pl],platform:pl,pillar:'—',week:1,day:i+1}})
}

function buildWeekly(firm:string,_angle:string,platforms:string[],start:Date,time:string):Row[]{
  const l=lib4w(firm) as any; const rows:Row[]=[]
  PILLARS.forEach((pillar,pi)=>{
    platforms.forEach((platform,pli)=>{
      const arr=l[pillar][platform]||l[pillar][platforms[0]]
      const d=new Date(start);d.setDate(d.getDate()+pi*7+pli)
      rows.push({date:fmt(d,time),message:arr[pi%arr.length],network:HN[platform],platform,pillar,week:pi+1,day:pi*7+pli+1})
    })
  })
  return rows
}

function buildCampaign(firm:string,_angle:string,platforms:string[],start:Date,time:string):Row[]{
  const l=lib4w(firm) as any; const rows:Row[]=[]; let dc=0
  PILLARS.forEach((pillar,pi)=>{
    for(let d=0;d<7;d++){
      const pl=platforms[d%platforms.length]
      const arr=l[pillar][pl]||l[pillar][platforms[0]]
      const idx=Math.floor(d/platforms.length)%4
      const dt=new Date(start);dt.setDate(dt.getDate()+dc)
      rows.push({date:fmt(dt,time),message:arr[idx%arr.length],network:HN[pl],platform:pl,pillar,week:pi+1,day:dc+1})
      dc++
    }
  })
  return rows
}

function toCSV(rows:Row[]){
  const lines=[['Date','Message','Networks'].join(',')]
  rows.forEach(r=>lines.push([`"${r.date}"`,`"${r.message.replace(/"/g,'""')}"`,`"${r.network}"`].join(',')))
  return lines.join('\n')
}

function dlCSV(content:string,filename:string){
  const blob=new Blob([content],{type:'text/csv;charset=utf-8;'})
  const url=URL.createObjectURL(blob)
  const a=document.createElement('a');a.href=url;a.download=filename;a.click()
  URL.revokeObjectURL(url)
}

const C={bg:'#0a0c0f',card:'#0f1623',border:'#1e2a3a',gold:'#f5c842',green:'#22c87a',blue:'#3b82f6',text:'#e2e8f0',muted:'#64748b'}
const pC:Record<string,string>={Redundancy:'#3b82f6',Economics:'#22c87a',Speed:'#f5c842',Scalability:'#a78bfa'}

export default function ContentGenerator(){
  const [mode,setMode]=useState('onetime')
  const [firm,setFirm]=useState('')
  const [_angle,setAngle]=useState('pain')
  const [platforms,setPlatforms]=useState(['Twitter'])
  const [startDate,setStartDate]=useState(()=>new Date().toISOString().split('T')[0])
  const [postTime,setPostTime]=useState('09:00')
  const [schedule,setSchedule]=useState<Row[]|null>(null)
  const [copied,setCopied]=useState<Record<string|number,boolean>>({})
  const [fw,setFw]=useState(0)
  const [fp,setFp]=useState('All')

  const togglePlat=(p:string)=>setPlatforms(prev=>prev.includes(p)?(prev.length>1?prev.filter(x=>x!==p):prev):[...prev,p])
  const cp=(key:string|number,text:string)=>{navigator.clipboard.writeText(text);setCopied(p=>({...p,[key]:true}));setTimeout(()=>setCopied(p=>({...p,[key]:false})),2000)}
  const gen=()=>{
    if(!firm)return
    const d=new Date(startDate)
    let rows:Row[]
    if(mode==='onetime')rows=buildOneTime(firm,_angle,platforms,d,postTime)
    else if(mode==='weekly')rows=buildWeekly(firm,_angle,platforms,d,postTime)
    else rows=buildCampaign(firm,_angle,platforms,d,postTime)
    setSchedule(rows);setFw(0);setFp('All');setCopied({})
  }
  const exp=()=>{
    if(!schedule)return
    const slug=firm.replace(/\s+/g,'_')
    const d=new Date(startDate)
    const ds=`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
    dlCSV(toCSV(schedule),`MightyOx_${slug}_${mode}_${_angle}_${ds}.csv`)
  }
  const logout=async()=>{await supabase.auth.signOut();window.location.href='/prop-firm-api/login'}
  const disp=(schedule||[]).filter(r=>(fw===0||r.week===fw)&&(fp==='All'||r.pillar===fp))
  const dis=!firm||platforms.length===0

  const s={
    wrap:{fontFamily:"'DM Mono','Space Mono',monospace",background:C.bg,minHeight:'100vh',padding:'20px 18px',color:C.text,boxSizing:'border-box'as const},
    brand:{color:C.green,fontSize:'10px',letterSpacing:'2px',textTransform:'uppercase'as const,margin:'0 0 3px'},
    title:{color:C.gold,fontSize:'18px',fontWeight:'bold',margin:'0 0 18px'},
    lbl:{color:C.muted,fontSize:'10px',letterSpacing:'1px',textTransform:'uppercase'as const,marginBottom:'5px',display:'block'},
    sel:{width:'100%',background:C.card,border:`1px solid ${C.border}`,color:C.text,padding:'9px 10px',borderRadius:'5px',fontSize:'12px',fontFamily:'inherit',cursor:'pointer',boxSizing:'border-box'as const},
    inp:{width:'100%',background:C.card,border:`1px solid ${C.border}`,color:C.text,padding:'9px 10px',borderRadius:'5px',fontSize:'12px',fontFamily:'inherit',boxSizing:'border-box'as const},
    g2:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'},
    tr:{display:'flex',gap:'6px',marginBottom:'12px',flexWrap:'wrap'as const},
    mt:(a:boolean)=>({padding:'9px 16px',borderRadius:'5px',fontSize:'11px',fontFamily:'inherit',cursor:'pointer',border:a?`1px solid ${C.green}`:`1px solid ${C.border}`,background:a?'#0d2e1f':C.card,color:a?C.green:C.muted,fontWeight:a?'bold':'normal',letterSpacing:'1px',textTransform:'uppercase'as const,flex:'1'}),
    pb:(a:boolean)=>({padding:'6px 13px',borderRadius:'5px',fontSize:'11px',fontFamily:'inherit',cursor:'pointer',border:a?`1px solid ${C.blue}`:`1px solid ${C.border}`,background:a?'#0d1f3c':C.card,color:a?C.blue:C.muted}),
    gb:(d:boolean)=>({width:'100%',padding:'13px',background:d?C.card:C.green,border:'none',borderRadius:'5px',color:d?C.muted:C.bg,fontSize:'12px',fontWeight:'bold',fontFamily:'inherit',cursor:d?'not-allowed':'pointer',letterSpacing:'1px',textTransform:'uppercase'as const,marginTop:'4px'}),
    csvB:{padding:'9px 16px',background:C.gold,border:'none',borderRadius:'5px',color:C.bg,fontSize:'11px',fontWeight:'bold',fontFamily:'inherit',cursor:'pointer',letterSpacing:'1px',textTransform:'uppercase'as const},
    div:{borderTop:`1px solid ${C.border}`,margin:'18px 0'},
    pc:(p:string)=>({background:C.card,border:`1px solid ${C.border}`,borderLeft:`3px solid ${pC[p]||C.gold}`,borderRadius:'7px',padding:'14px',marginBottom:'8px'}),
    mr:{display:'flex',gap:'6px',flexWrap:'wrap'as const,marginBottom:'8px'},
    tag:(c:string)=>({fontSize:'10px',letterSpacing:'1px',textTransform:'uppercase'as const,color:c,border:`1px solid ${c}`,borderRadius:'3px',padding:'2px 7px'}),
    pt:{color:C.text,fontSize:'11px',lineHeight:'1.8',whiteSpace:'pre-wrap'as const,margin:0,fontFamily:'inherit'},
    row:{display:'flex',justifyContent:'space-between',alignItems:'center'},
    cb:(ok:boolean)=>({padding:'4px 10px',background:'transparent',border:ok?`1px solid ${C.green}`:`1px solid ${C.border}`,borderRadius:'4px',color:ok?C.green:C.muted,fontSize:'10px',fontFamily:'inherit',cursor:'pointer'}),
    sb:{background:C.card,border:`1px solid ${C.border}`,borderRadius:'7px',padding:'14px',marginBottom:'14px'},
    sg:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px',marginTop:'10px'},
    fb:(a:boolean)=>({padding:'5px 11px',borderRadius:'4px',fontSize:'10px',fontFamily:'inherit',cursor:'pointer',border:a?`1px solid ${C.gold}`:`1px solid ${C.border}`,background:a?'#1a1400':C.card,color:a?C.gold:C.muted}),
    ib:{background:'#0a1628',border:`1px solid ${C.border}`,borderRadius:'6px',padding:'10px 14px',marginBottom:'12px'},
    lo:{padding:'5px 12px',background:'transparent',border:`1px solid ${C.border}`,borderRadius:'4px',color:C.muted,fontSize:'10px',fontFamily:'inherit',cursor:'pointer'},
  }

  return(
    <div style={s.wrap}>
      <div style={s.row}>
        <div><p style={s.brand}>MightyOx Trading · Affiliate Campaign Suite</p><h1 style={s.title}>Content Generator</h1></div>
        <button style={s.lo} onClick={logout}>Sign Out</button>
      </div>
      <span style={s.lbl}>Campaign Mode</span>
      <div style={{...s.tr,gap:'8px',marginBottom:'8px'}}>
        {MODES.map(m=><button key={m.id} style={s.mt(mode===m.id)} onClick={()=>{setMode(m.id);setSchedule(null)}}>{m.label}</button>)}
      </div>
      <div style={{...s.ib,marginBottom:'14px'}}><span style={{color:C.muted,fontSize:'10px'}}>{modeDesc[mode]}</span></div>
      <div style={s.g2}>
        <div><span style={s.lbl}>Prop Firm</span>
          <select style={s.sel} value={firm} onChange={e=>{setFirm(e.target.value);setSchedule(null)}}>
            <option value="">— Select firm —</option>
            {FIRMS.map(f=><option key={f}>{f}</option>)}
          </select>
        </div>
        <div><span style={s.lbl}>Campaign Angle</span>
          <select style={s.sel} value={_angle} onChange={e=>{setAngle(e.target.value);setSchedule(null)}}>
            {ANGLES.map(a=><option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </div>
      </div>
      <div style={s.g2}>
        <div><span style={s.lbl}>Start Date</span><input style={s.inp} type="date" value={startDate} onChange={e=>{setStartDate(e.target.value);setSchedule(null)}}/></div>
        <div><span style={s.lbl}>Post Time</span><input style={s.inp} type="time" value={postTime} onChange={e=>{setPostTime(e.target.value);setSchedule(null)}}/></div>
      </div>
      <span style={s.lbl}>Platforms</span>
      <div style={s.tr}>{PLATFORMS.map(p=><button key={p} style={s.pb(platforms.includes(p))} onClick={()=>{togglePlat(p);setSchedule(null)}}>{p}</button>)}</div>
      {mode!=='onetime'&&<div style={{...s.ib,marginBottom:'14px'}}>
        <span style={{color:C.muted,fontSize:'10px',letterSpacing:'1px',textTransform:'uppercase'as const}}>Pillar Rotation</span>
        <div style={{...s.mr,marginTop:'6px'}}>{PILLARS.map(p=><span key={p} style={s.tag(pC[p])}>Wk {PILLARS.indexOf(p)+1}: {p}</span>)}</div>
      </div>}
      <button style={s.gb(dis)} onClick={gen} disabled={dis}>
        Generate {mode==='onetime'?'Posts':mode==='weekly'?'Weekly Schedule':'4-Week Campaign'}
      </button>
      {schedule&&<>
        <div style={s.div}/>
        <div style={s.sb}>
          <div style={s.row}>
            <span style={{color:C.gold,fontSize:'11px',letterSpacing:'1px',textTransform:'uppercase'as const}}>{firm} · {ANGLES.find(a=>a.id===_angle)?.label}</span>
            <button style={s.csvB} onClick={exp}>⬇ Export CSV</button>
          </div>
          <div style={s.sg}>
            {[{n:schedule.length,l:'Posts'},{n:mode==='onetime'?1:4,l:'Weeks'},{n:mode==='onetime'?1:4,l:'Pillars'},{n:platforms.length,l:'Platforms'}].map(({n,l})=>(
              <div key={l} style={{textAlign:'center'}}><div style={{color:C.gold,fontSize:'20px',fontWeight:'bold'}}>{n}</div><div style={{color:C.muted,fontSize:'9px',letterSpacing:'1px',textTransform:'uppercase'as const,marginTop:'2px'}}>{l}</div></div>
            ))}
          </div>
          <div style={{marginTop:'10px',color:C.muted,fontSize:'10px'}}>Date format: <span style={{color:C.green}}>YY/MM/DD HH:MM</span> · HootSuite-compatible · Code: <span style={{color:C.gold}}>{CODE}</span></div>
        </div>
        {mode!=='onetime'&&<>
          <span style={s.lbl}>Filter Week</span>
          <div style={{...s.tr,marginBottom:'10px'}}>{[0,1,2,3,4].map(w=><button key={w} style={s.fb(fw===w)} onClick={()=>setFw(w)}>{w===0?'All':`Wk ${w}`}</button>)}</div>
          <span style={s.lbl}>Filter Pillar</span>
          <div style={{...s.tr,marginBottom:'14px'}}>{['All',...PILLARS].map(p=><button key={p} style={s.fb(fp===p)} onClick={()=>setFp(p)}>{p}</button>)}</div>
        </>}
        {disp.map((r,i)=>(
          <div key={i} style={s.pc(r.pillar)}>
            <div style={s.mr}>
              {r.pillar!=='—'&&<span style={s.tag(pC[r.pillar]||C.gold)}>{r.pillar}</span>}
              <span style={s.tag(C.blue)}>{r.platform}</span>
              <span style={s.tag(C.muted)}>Day {r.day}</span>
              <span style={s.tag(C.green)}>{r.date}</span>
            </div>
            <pre style={s.pt}>{r.message}</pre>
            <div style={{...s.row,marginTop:'10px'}}>
              <span style={{color:C.border,fontSize:'10px'}}>{r.message.length} chars</span>
              <button style={s.cb(copied[i])} onClick={()=>cp(i,r.message)}>{copied[i]?'Copied ✓':'Copy'}</button>
            </div>
          </div>
        ))}
        <div style={{textAlign:'center',marginTop:'16px',paddingBottom:'20px'}}>
          <button style={s.csvB} onClick={exp}>⬇ Export HootSuite CSV</button>
        </div>
      </>}
    </div>
  )
}
