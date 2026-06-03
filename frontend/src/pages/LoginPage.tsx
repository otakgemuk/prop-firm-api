import { useState } from 'react'
import { supabase } from '../lib/supabase'

const S: Record<string, React.CSSProperties> = {
  wrap:  { fontFamily:"'DM Mono','Space Mono',monospace", background:'#0a0c0f', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' },
  card:  { background:'#0f1623', border:'1px solid #1e2a3a', borderRadius:'10px', padding:'36px 28px', width:'100%', maxWidth:'380px' },
  brand: { color:'#22c87a', fontSize:'10px', letterSpacing:'2px', textTransform:'uppercase', margin:'0 0 4px' },
  title: { color:'#f5c842', fontSize:'20px', fontWeight:'bold', margin:'0 0 24px' },
  label: { color:'#64748b', fontSize:'10px', letterSpacing:'1px', textTransform:'uppercase', marginBottom:'5px', display:'block' },
  input: { width:'100%', background:'#0a0c0f', border:'1px solid #1e2a3a', color:'#e2e8f0', padding:'10px 12px',
           borderRadius:'5px', fontSize:'13px', fontFamily:'inherit', boxSizing:'border-box' as const, marginBottom:'14px' },
  btn:   { width:'100%', padding:'13px', background:'#22c87a', border:'none', borderRadius:'5px', color:'#0a0c0f',
           fontSize:'12px', fontWeight:'bold', fontFamily:'inherit', cursor:'pointer', letterSpacing:'1px', textTransform:'uppercase' as const },
  err:   { color:'#ef4444', fontSize:'11px', marginBottom:'12px' },
}

export default function LoginPage() {
  const [email, setEmail]     = useState('')
  const [pass,  setPass]      = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const login = async () => {
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (error) { setError(error.message); setLoading(false) }
    else window.location.href = '/prop-firm-api/content-generator'
  }

  return (
    <div style={S.wrap}>
      <div style={S.card}>
        <p style={S.brand}>MightyOx Trading</p>
        <h1 style={S.title}>Member Login</h1>
        {error && <p style={S.err}>{error}</p>}
        <span style={S.label}>Email</span>
        <input style={S.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" />
        <span style={S.label}>Password</span>
        <input style={S.input} type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••"
          onKeyDown={e => e.key === 'Enter' && login()} />
        <button style={S.btn} onClick={login} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </div>
    </div>
  )
}
