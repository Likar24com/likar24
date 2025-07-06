// pages/cabinet.tsx
import React, { useEffect, useState } from 'react'
import { supabase }                      from '../lib/supabase'
import { useRouter }                     from 'next/router'
import { countryOptions, allergyOptions } from '../lib/constants'

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
}

export default function PatientCabinet() {
  const router = useRouter()
  const [userId, setUserId]             = useState<string|null>(null)
  const [loading, setLoading]           = useState(true)
  const [profile, setProfile]           = useState<Profile|null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [nextApp, setNextApp]           = useState<Appointment|null>(null)

  // UI-стани
  const [activeMenu, setActiveMenu]       = useState<'my-data'|'my-records'>('my-data')
  const [recordsTab, setRecordsTab]       = useState<'upcoming'|'past'>('upcoming')
  const [rescheduleApp, setRescheduleApp] = useState<Appointment|null>(null)
  const [newDateTime, setNewDateTime]     = useState('')

  // форми «Мої дані»
  const [firstName,  setFirstName]   = useState('')
  const [lastName,   setLastName]    = useState('')
  const [middleName, setMiddleName]  = useState('')
  const [birthDate,  setBirthDate]   = useState('')
  const [weight,     setWeight]      = useState('')
  const [country,    setCountry]     = useState('')
  const [allergies,  setAllergies]   = useState<string[]>([])
  const [chronic,    setChronic]     = useState('')
  const [email,      setEmail]       = useState('')
  const [password,   setPassword]    = useState('')
  const [confirmPass,setConfirmPass] = useState('')
  const [errorsData, setErrorsData]  = useState<Record<string,string>>({})
  const [savingData, setSavingData]  = useState(false)

  const inputStyle    = { border:'1px solid #ddd', padding:8, borderRadius:4, width:'100%', marginBottom:12 }
  const buttonStyle   = { padding:'10px 20px', backgroundColor:'#0070f3', color:'#fff', border:'none', borderRadius:4, cursor:savingData?'not-allowed':'pointer' }
  const thTdStyle     = { border:'1px solid #ddd', padding:8, textAlign:'left' as const }
  const sidebarButton = (active:boolean) => ({
    width:'100%', textAlign:'left' as const, padding:10,
    backgroundColor: active? '#0070f3':'transparent',
    color: active? '#fff':'#000',
    border:'none', borderRadius:4, marginBottom:8, cursor:'pointer'
  })

  useEffect(()=>{
    ;(async()=>{
      const { data:{ user }, error: userErr } = await supabase.auth.getUser()
      if (userErr || !user) {
        router.push('/auth')
        return
      }
      setUserId(user.id)

      // Fetch profile
      const { data: pr, error: prErr } = await supabase
        .from<Profile>('users')
        .select(`
          first_name,last_name,middle_name,
          birth_date,weight,country,
          allergies,chronic_diseases,email
        `)
        .eq('id', user.id).single()
      if (prErr) console.error(prErr)
      if (pr) {
        setProfile(pr)
        setFirstName(pr.first_name)
        setLastName(pr.last_name || '')
        setMiddleName(pr.middle_name || '')
        setBirthDate(pr.birth_date || '')
        setWeight(pr.weight?.toString() || '')
        setCountry(pr.country || '')
        setAllergies(pr.allergies || [])
        setChronic(pr.chronic_diseases || '')
        setEmail(pr.email)
      }

      // Fetch appointments
      const { data: apps, error: appsErr } = await supabase
        .from<Appointment>('appointments')
        .select(`id,date_time,status,doctor(first_name,last_name,specialization)`)
        .eq('patient', user.id)
        .order('date_time',{ ascending:true })
      if (appsErr) console.error(appsErr)
      setAppointments(apps || [])

      // Next appointment
      const next = (apps||[])
        .filter(a=> a.status==='очікується' && new Date(a.date_time)>new Date())
        .sort((a,b)=> new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
        .shift()|| null
      setNextApp(next)

      setLoading(false)
    })()
  },[router])

  if (loading) return <p style={{textAlign:'center',marginTop:50}}>Завантаження…</p>

  // Save profile
  const saveProfileData = async(e:React.FormEvent)=>{
    e.preventDefault()
    const errs:Record<string,string> = {}
    if (!firstName) errs.firstName='Обовʼязково'
    if (!birthDate) errs.birthDate='Обовʼязково'
    if (!weight||isNaN(+weight)) errs.weight='Невірно'
    if (!country) errs.country='Обовʼязково'
    if (password && password!==confirmPass) errs.confirmPass='Не співпадає'
    setErrorsData(errs)
    if (Object.keys(errs).length) return

    setSavingData(true)
    await supabase.from('users').update({
      first_name: firstName,
      last_name: lastName||null,
      middle_name,
      birth_date,
      weight:+weight,
      country,
      allergies,
      chronic_diseases: chronic||null,
      email
    }).eq('id', userId!)

    if (password) await supabase.auth.updateUser({ password })

    // Re-fetch fresh
    const { data: pr2 } = await supabase
      .from<Profile>('users')
      .select(`
        first_name,last_name,middle_name,
        birth_date,weight,country,
        allergies,chronic_diseases,email
      `).eq('id', userId!).single()
    if (pr2) setProfile(pr2)

    setSavingData(false)
    alert('✅ Дані збережено')
  }

  return (
    <main style={{ maxWidth:1000, margin:'2rem auto', fontFamily:'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
        <h1>Особистий кабінет</h1>
        <button onClick={async()=>{
          await supabase.auth.signOut()
          router.push('/auth')
        }} style={{ padding:'8px 16px', backgroundColor:'#e00', color:'#fff', border:'none', borderRadius:4 }}>
          Вихід
        </button>
      </div>

      {/* Next appointment */}
      <section style={{ padding:20, border:'1px solid #ddd', borderRadius:6, marginBottom:30 }}>
        {nextApp
          ? <p><strong>{
              new Date(nextApp.date_time).toLocaleString('uk-UA',{ dateStyle:'medium', timeStyle:'short' })
            }</strong> – лікар {nextApp.doctor.first_name} {nextApp.doctor.last_name}</p>
          : <p>Немає запланованих консультацій.</p>
        }
      </section>

      {/* Sidebar + Content */}
      <div style={{ display:'flex', gap:20, alignItems:'flex-start' }}>
        <aside style={{ width:200, position:'sticky', top:'2rem' }}>
          <button onClick={()=>setActiveMenu('my-data')}    style={sidebarButton(activeMenu==='my-data')}>Мої дані</button>
          <button onClick={()=>setActiveMenu('my-records')} style={sidebarButton(activeMenu==='my-records')}>Мої записи</button>
        </aside>

        <article style={{ flex:1, minHeight:600, transition:'opacity .2s' }}>
          {/* My Data */}
          <div style={{ display: activeMenu==='my-data'?'block':'none' }}>
            <form onSubmit={saveProfileData} noValidate>
              <h2>Ваші дані</h2>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
                {/* Ім’я */}
                <div>
                  <label>Ім’я*:</label><br/>
                  <input style={inputStyle} value={firstName} onChange={e=>setFirstName(e.target.value)}/>
                  {errorsData.firstName && <p style={{color:'red'}}>{errorsData.firstName}</p>}
                </div>
                {/* Прізвище */}
                <div>
                  <label>Прізвище:</label><br/>
                  <input style={inputStyle} value={lastName} onChange={e=>setLastName(e.target.value)}/>
                </div>
                {/* По-батькові */}
                <div>
                  <label>По-батькові:</label><br/>
                  <input style={inputStyle} value={middleName} onChange={e=>setMiddleName(e.target.value)}/>
                </div>
                {/* Дата народження */}
                <div>
                  <label>Дата народження*:</label><br/>
                  <input type="date" style={inputStyle} value={birthDate} onChange={e=>setBirthDate(e.target.value)}/>
                  {errorsData.birthDate && <p style={{color:'red'}}>{errorsData.birthDate}</p>}
                </div>
                {/* Вага */}
                <div>
                  <label>Вага (кг)*:</label><br/>
                  <input type="number" style={inputStyle} value={weight} onChange={e=>setWeight(e.target.value)}/>
                  {errorsData.weight && <p style={{color:'red'}}>{errorsData.weight}</p>}
                </div>
                {/* Країна */}
                <div>
                  <label>Країна*:</label><br/>
                  <select style={inputStyle} value={country} onChange={e=>setCountry(e.target.value)}>
                    <option value="">— оберіть країну —</option>
                    {countryOptions.map(c=>
                      <option key={c.value} value={c.value}>{c.label}</option>
                    )}
                  </select>
                  {errorsData.country && <p style={{color:'red'}}>{errorsData.country}</p>}
                </div>
                {/* Алергени */}
                <div style={{ gridColumn:'1 / -1' }}>
                  <label>Алергени:</label><br/>
                  <select multiple style={{ ...inputStyle, height:120 }} value={allergies}
                    onChange={e=>{
                      const vals = Array.from(e.target.selectedOptions, o=>o.value)
                      setAllergies(vals)
                    }}>
                    {allergyOptions.map(a=>
                      <option key={a.value} value={a.value}>{a.label}</option>
                    )}
                  </select>
                </div>
                {/* Хронічні */}
                <div style={{ gridColumn:'1 / -1' }}>
                  <label>Хронічні захворювання:</label><br/>
                  <textarea style={{...inputStyle,resize:'vertical'}} rows={3}
                    value={chronic} onChange={e=>setChronic(e.target.value)}/>
                </div>
                {/* E-mail */}
                <div>
                  <label>E-mail*:</label><br/>
                  <input type="email" style={inputStyle} value={email} onChange={e=>setEmail(e.target.value)} required/>
                </div>
                {/* Новий пароль */}
                <div>
                  <label>Новий пароль:</label><br/>
                  <input type="password" style={inputStyle} value={password} onChange={e=>setPassword(e.target.value)}
                    placeholder="залиште порожнім, щоб не змінювати"/>
                </div>
                {/* Підтвердити пароль */}
                <div>
                  <label>Підтвердьте пароль:</label><br/>
                  <input type="password" style={inputStyle} value={confirmPass} onChange={e=>setConfirmPass(e.target.value)}/>
                  {errorsData.confirmPass && <p style={{color:'red'}}>{errorsData.confirmPass}</p>}
                </div>
              </div>
              <button type="submit" style={buttonStyle} disabled={savingData}>
                {savingData?'Збереження…':'Зберегти зміни'}
              </button>
            </form>
          </div>

          {/* My Records */}
          <div style={{ display: activeMenu==='my-records'?'block':'none' }}>
            {/* … тут ваш список записів … */}
          </div>
        </article>
      </div>

      {/* Reschedule Modal */}
      {rescheduleApp && (
        <div style={{
          position:'fixed', top:0,left:0,right:0,bottom:0,
          backgroundColor:'rgba(0,0,0,0.3)',
          display:'flex', alignItems:'center', justifyContent:'center'
        }}>
          {/* … ваш modal тут … */}
        </div>
      )}
    </main>
  )
}
