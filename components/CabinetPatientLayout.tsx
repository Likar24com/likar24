import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

type CabinetPatientLayoutProps = {
  current: string;
  children: React.ReactNode;
}

const menu = [
  { key: 'profile', label: 'Мої дані', path: '/cabinet-patient/profile' },
  { key: 'consults', label: 'Мої записи на консультацію', path: '/cabinet-patient/consults' },
  // додайте інші пункти меню за потреби
]

export default function CabinetPatientLayout({ current, children }: CabinetPatientLayoutProps) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [nearestConsult, setNearestConsult] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/auth')
        return
      }
      if (!(user.confirmed_at || user.email_confirmed_at)) {
        sessionStorage.setItem('pending_email', user.email || '')
        router.replace('/confirm-email')
        return
      }
      setUser(user)
      setLoading(false)
    })()
  }, [router])

  useEffect(() => {
    if (!user) return
    async function loadConsult() {
      const { data: cons } = await supabase
        .from('appointments')
        .select('id,date,doctor!inner(first_name,last_name)')
        .eq('patient_id', user.id)
        .order('date', { ascending: true })
        .limit(1)
      const now = new Date()
      const next = (cons || []).find(c => new Date(c.date) >= now)
      setNearestConsult(next || null)
    }
    loadConsult()
  }, [user])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}>Завантаження…</div>

  return (
    <div style={{ maxWidth: 1100, margin: '2rem auto', minHeight: 700, fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52 }}>
        <div style={{ fontSize: 30, fontWeight: 700, color: '#232b3e' }}>Кабінет пацієнта</div>
        <button
          onClick={handleLogout}
          style={{
            background: '#e00', color: '#fff', border: 'none', borderRadius: 7,
            padding: '10px 26px', fontWeight: 700, fontSize: 17, cursor: 'pointer'
          }}>
          Вихід
        </button>
      </div>
      <div style={{
        background: '#f2f8fd', borderRadius: 15, margin: '30px 0 36px 0', padding: '22px 28px',
        border: '1px solid #e8eef7', minHeight: 60
      }}>
        <div style={{ fontWeight: 700, fontSize: 21, marginBottom: 3 }}>Найближчий запис на консультацію</div>
        {!nearestConsult
          ? <div style={{ color: '#7c8797', fontSize: 17, paddingTop: 5 }}>Немає запланованих консультацій</div>
          : (
            <div style={{ fontSize: 16, marginTop: 4 }}>
              {new Date(nearestConsult.date).toLocaleDateString()}&nbsp;
              {new Date(nearestConsult.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}&nbsp;
              — {nearestConsult.doctor?.first_name} {nearestConsult.doctor?.last_name}
            </div>
          )
        }
      </div>
      <div style={{ display: 'flex', minHeight: 500 }}>
        <nav style={{
          width: 220, borderRight: '1px solid #ddd', paddingRight: 16, minHeight: 500,
          display: 'flex', flexDirection: 'column', gap: 2
        }}>
          {menu.map(item => (
            <div
              key={item.key}
              onClick={() => router.push(item.path)}
              style={{
                padding: '13px 0 13px 14px', cursor: 'pointer',
                background: current === item.key ? '#e8eef7' : 'transparent',
                fontWeight: current === item.key ? 'bold' : 'normal',
                borderRadius: 7,
                color: current === item.key ? '#0070f3' : '#1d2332',
                marginBottom: 2
              }}
            >{item.label}</div>
          ))}
        </nav>
        <div style={{ flex: 1, paddingLeft: 32, minHeight: 500 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
