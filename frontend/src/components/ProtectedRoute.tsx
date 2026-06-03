import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => listener.subscription.unsubscribe()
  }, [])

  if (session === undefined) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh',
      background:'#0a0c0f', color:'#64748b', fontFamily:'DM Mono,monospace', fontSize:'12px', letterSpacing:'2px' }}>
      LOADING...
    </div>
  )

  if (!session) {
    window.location.href = '/prop-firm-api/login'
    return null
  }

  return <>{children}</>
}
