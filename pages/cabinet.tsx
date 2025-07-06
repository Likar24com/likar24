// pages/cabinet.tsx
import React, { useEffect, useState } from 'react'
import { supabase }              from '../lib/supabase'
import { useRouter }             from 'next/router'
import Link                      from 'next/link'

// Типи
type Appointment = {
  id: string
  date_time: string
  status: 'очікується' | 'завершено' | 'скасовано'
  doctor: { first_name: string; last_name: string; specialization: string }
}
type Profile = {
  first_name: string
  last_name?: string
  middle_name?: string
  birth_date?: string
  weight?: number
  country?: string
  allergies?: string[]
  chronic_diseases?: string
  email: string
  phone?: string
}

export default function PatientCabinet() {
  const router = useRouter()
  const [loading, setLoading]           = useState(true)
  const [profile, setProfile]           = useState<Profile | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [nextApp, setNextApp]           = useState<Appointment | null>(null)

  const [activeMenu, setActiveMenu]     = useState<'my-data' | 'my-records'>('my-data')
  const [recordsTab, setRecordsTab]     = useState<'upcoming' | 'past'>('upcoming')

  // Дія «вихід»
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  // Скасування
  const cancelAppointment = async (id: string) => {
    await supabase
      .from('appointments')
      .update({ status: 'скасовано' })
      .eq('id', id)
    setAppointments(apps =>
      apps.map(a => a.id === id ? { ...a, status: 'скасовано' } : a)
    )
    if (nextApp?.id === id) setNextApp(null)
  }

  // Перенесення
  const [rescheduleApp, setRescheduleApp] = useState<Appointment | null>(null)
  const [newDateTime, setNewDateTime]     = useState<string>('')

  const openReschedule = (app: Appointment) => {
    setRescheduleApp(app)
    setNewDateTime(app.date_time.slice(0,16))
  }
  const confirmReschedule = async () => {
    if (!rescheduleApp) return
    await supabase
      .from('appointments')
      .update({ date_time: new Date(newDateTime).toISOString() })
      .eq('id', rescheduleApp.id)
    setAppointments(apps =>
      apps.map(a =>
        a.id === rescheduleApp.id
          ? { ...a, date_time: newDateTime }
          : a
      )
    )
    if (nextApp?.id === rescheduleApp.id) {
      setNextApp({ ...rescheduleApp, date_time: newDateTime })
    }
    setRescheduleApp(null)
  }

  // Завантаження даних
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const uid = user.id

      // Профіль
      const { data: pr } = await supabase
        .from('users')
        .select(`
          first_name,last_name,middle_name,
          birth_date,weight,country,
          allergies,chronic_diseases,email,phone
        `)
        .eq('id', uid)
        .single()
      setProfile(pr)

      // Записи
      const { data: apps } = await supabase
        .from('appointments')
        .select(`
          id,date_time,status,
          doctor:first_user(first_name,last_name,specialization)
        `)
        .eq('patient', uid)
        .order('date_time', { ascending: true })
      setAppointments(apps || [])

      // Найближча
      const next = (apps || [])
        .filter(a => a.status === 'очікується' && new Date(a.date_time) > new Date())
        .sort((a,b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
        .shift() || null
      setNextApp(next)

      setLoading(false)
    })()
  }, [router])

  if (loading) {
    return <p style={{ textAlign:'center', marginTop:50 }}>Завантаження…</p>
  }

  // Стили
  const inputStyle = {
    width:'100%', padding:10, fontSize:'1rem',
    border:'1px solid #ccc', borderRadius:6, marginBottom:8
  }
  const thTdStyle = {
    border:'1px solid #ddd', padding:8, textAlign:'left' as const
  }

  return (
    <main style={{ maxWidth:1000, margin:'2rem auto', fontFamily:'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h1>Особистий кабінет</h1>
        <button
          onClick={handleSignOut}
          style={{
            padding:'8px 16px', backgroundColor:'#e00', color:'#fff',
            border:'none', borderRadius:4, cursor:'pointer'
          }}
        >Вихід</button>
      </div>

      {/* Блок найближчої консультації */}
      <section style={{ padding:20, border:'1px solid #ddd', borderRadius:6, marginBottom:30 }}>
        {nextApp ? (
          <p>
            <strong>
              {new Date(nextApp.date_time).toLocaleString('uk-UA',{dateStyle:'medium',timeStyle:'short'})}
            </strong>
            {' '}– лікар {nextApp.doctor.first_name} {nextApp.doctor.last_name}
          </p>
        ) : (
          <p>У вас немає запланованих консультацій.</p>
        )}
      </section>

      {/* Меню + контент */}
      <div style={{ display:'flex', gap:20 }}>
        {/* Sidebar */}
        <aside style={{ width:200 }}>
          <button
            onClick={()=>setActiveMenu('my-data')}
            style={{
              width:'100%', textAlign:'left', padding:10,
              backgroundColor: activeMenu==='my-data'? '#0070f3':'transparent',
              color: activeMenu==='my-data'? '#fff':'#000',
              border:'none', borderRadius:4, marginBottom:8, cursor:'pointer'
            }}
          >Мої дані</button>
          <button
            onClick={()=>setActiveMenu('my-records')}
            style={{
              width:'100%', textAlign:'left', padding:10,
              backgroundColor: activeMenu==='my-records'? '#0070f3':'transparent',
              color: activeMenu==='my-records'? '#fff':'#000',
              border:'none', borderRadius:4, cursor:'pointer'
            }}
          >Мої записи</button>
        </aside>

        {/* Main content */}
        <article style={{ flex:1 }}>
          {activeMenu === 'my-data' && (
            <>
              <h2>Ваші дані</h2>
              <div style={{
                display:'grid', gridTemplateColumns:'1fr 1fr', gap:20
              }}>
                <div>
                  <label>Ім’я:</label><br/>
                  <input value={profile?.first_name||''} disabled style={inputStyle}/>
                </div>
                <div>
                  <label>Прізвище:</label><br/>
                  <input value={profile?.last_name||''} disabled style={inputStyle}/>
                </div>
                <div>
                  <label>По-батькові:</label><br/>
                  <input value={profile?.middle_name||''} disabled style={inputStyle}/>
                </div>
                <div>
                  <label>Дата народження:</label><br/>
                  <input value={profile?.birth_date||''} disabled style={inputStyle}/>
                </div>
                <div>
                  <label>Вага (кг):</label><br/>
                  <input value={profile?.weight||''} disabled style={inputStyle}/>
                </div>
                <div>
                  <label>Країна:</label><br/>
                  <input value={profile?.country||''} disabled style={inputStyle}/>
                </div>
                <div style={{ gridColumn:'1 / -1' }}>
                  <label>Алергени:</label><br/>
                  <input value={(profile?.allergies||[]).join(', ')} disabled style={inputStyle}/>
                </div>
                <div style={{ gridColumn:'1 / -1' }}>
                  <label>Хронічні хвороби:</label><br/>
                  <textarea value={profile?.chronic_diseases||''} disabled rows={3}
                    style={{ ...inputStyle, resize:'vertical' }}/>
                </div>
              </div>
              <section style={{
                marginTop:30, padding:20, border:'1px solid #eee', borderRadius:6
              }}>
                <h3>Налаштування облікового запису</h3>
                <Link href="/settings">
                  <a>Змінити e-mail, телефон або пароль →</a>
                </Link>
              </section>
            </>
          )}

          {activeMenu === 'my-records' && (
            <>
              <h2>Мої записи</h2>
              {/* вкладки */}
              <div style={{ marginBottom:16 }}>
                <button
                  onClick={()=>setRecordsTab('upcoming')}
                  style={{
                    marginRight:8, padding:'6px 12px',
                    backgroundColor: recordsTab==='upcoming'?'#0070f3':'#f0f0f0',
                    color: recordsTab==='upcoming'?'#fff':'#000',
                    border:'none', borderRadius:4, cursor:'pointer'
                  }}
                >Заплановані</button>
                <button
                  onClick={()=>setRecordsTab('past')}
                  style={{
                    padding:'6px 12px',
                    backgroundColor: recordsTab==='past'?'#0070f3':'#f0f0f0',
                    color: recordsTab==='past'?'#fff':'#000',
                    border:'none', borderRadius:4, cursor:'pointer'
                  }}
                >Відбулися</button>
              </div>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    <th style={thTdStyle}>Дата/час</th>
                    <th style={thTdStyle}>Лікар</th>
                    <th style={thTdStyle}>Спеціальність</th>
                    <th style={thTdStyle}>Статус</th>
                    <th style={thTdStyle}>Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments
                    .filter(a =>
                      recordsTab==='upcoming'
                        ? a.status==='очікується'
                        : a.status==='завершено'
                    )
                    .map(a => (
                      <tr key={a.id}>
                        <td style={thTdStyle}>
                          {new Date(a.date_time).toLocaleString('uk-UA',{dateStyle:'short',timeStyle:'short'})}
                        </td>
                        <td style={thTdStyle}>{a.doctor.first_name} {a.doctor.last_name}</td>
                        <td style={thTdStyle}>{a.doctor.specialization}</td>
                        <td style={thTdStyle}>{a.status}</td>
                        <td style={thTdStyle}>
                          {a.status==='очікується' && (
                            <>
                              <button onClick={()=>cancelAppointment(a.id)}>Скасувати</button>{' '}
                              <button onClick={()=>openReschedule(a)}>Перенести</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  }
                  {appointments.filter(a =>
                    recordsTab==='upcoming'
                      ? a.status==='очікується'
                      : a.status==='завершено'
                  ).length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign:'center', padding:20 }}>
                        Немає записів.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          )}
        </article>
      </div>

      {/* Модалка перенесення */}
      {rescheduleApp && (
        <div className="modal" style={{
          position:'fixed', top:0,left:0,right:0,bottom:0,
          backgroundColor:'rgba(0,0,0,0.3)', display:'flex',
          alignItems:'center',justifyContent:'center'
        }}>
          <div style={{
            background:'#fff', padding:20, borderRadius:6, minWidth:300
          }}>
            <h3>Перенести консультацію</h3>
            <input
              type="datetime-local"
              value={newDateTime}
              onChange={e=>setNewDateTime(e.target.value)}
              style={{ ...inputStyle, marginBottom:12 }}
            />
            <div style={{ textAlign:'right' }}>
              <button onClick={confirmReschedule} style={{ marginRight:8 }}>Підтвердити</button>
              <button onClick={()=>setRescheduleApp(null)}>Відмінити</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
