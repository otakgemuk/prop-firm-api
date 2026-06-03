import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      setSession(data.session)
    })
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_e: string, s: Session | null) => setSession(s)
    )
    return () => listener.subscription.unsubscribe()
  }, [])

  if (session === undefined) return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      height: '100vh', background: '#0a0c0f', color: '#64748b',
      fontFamily: 'DM Mono,monospace', fontSize: '12px', letterSpacing: '2px'
    }}>
      LOADING...
    </div>
  )

  if (!session) {
    window.location.href = '/prop-firm-api/login'
    return null
  }

  return <>{children}</>
}
