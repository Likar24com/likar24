// pages/cabinet.tsx
import React, { useEffect, useState } from 'react'
import { supabase }          from '../lib/supabase'
import { useRouter }         from 'next/router'

type Appointment = { /* ваш тип */ }
type Profile     = { /* ваш тип */ }

export default function PatientCabinet() {
  const router = useRouter()

  // стани
  const [loading, setLoading]           = useState(true)
  const [profile, setProfile]           = useState<Profile|null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [nextApp, setNextApp]           = useState<Appointment|null>(null)

  const [activeMenu, setActiveMenu]     = useState<'my-data'|'my-records'>('my-data')
  const [recordsTab, setRecordsTab]     = useState<'upcoming'|'past'>('upcoming')

  const [rescheduleApp, setRescheduleApp] = useState<Appointment|null>(null)
  const [newDateTime, setNewDateTime]     = useState('')

  // стани форми «Мої дані»
  const [firstName,   setFirstName]   = useState('')
  const [lastName,    setLastName]    = useState('')
  const [middleName,  setMiddleName]  = useState('')
  const [birthDate,   setBirthDate]   = useState('')
  const [weight,      setWeight]      = useState('')
  const [country,     setCountry]     = useState('')
  const [allergies,   setAllergies]   = useState<string[]>([])
  const [chronic,     setChronic]     = useState('')
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [errorsData,  setErrorsData]  = useState<Record<string,string>>({})
  const [savingData,  setSavingData]  = useState(false)

  const inputStyle = {
    border:'1px solid #ddd', padding:8,
    borderRadius:4, width:'100%', marginBottom:12
  }

  useEffect(() => {
    (async () => {
      const { data:{ user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      // 1) Завантажуємо профіль
      const { data: pr } = await supabase
        .from('users')
        .select(`first_name,last_name,middle_name,
                 birth_date,weight,country,
                 allergies,chronic_diseases,email`)
        .eq('id', user.id)
        .single()
      if (pr) {
        setProfile(pr)
        // Ініціалізуємо стани полів **один раз**
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

      // 2) Завантажуємо записи
      const { data: apps } = await supabase
        .from('appointments')
        .select(`id,date_time,status,
                 doctor(first_name,last_name,specialization)`)
        .eq('patient', user.id)
        .order('date_time',{ ascending:true })
      const arr = apps || []
      setAppointments(arr)

      // 3) Найближча
      const next = arr
        .filter(a=> a.status==='очікується' && new Date(a.date_time)>new Date())
        .sort((a,b)=> new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
        .shift()||null
      setNextApp(next)

      setLoading(false)
    })()
  },[router])

  if (loading) {
    return <p style={{ textAlign:'center', marginTop:50 }}>Завантаження…</p>
  }

  // Вихід
  const handleSignOut = async() => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  // ... cancelAppointment, openReschedule, confirmReschedule залишаються без змін ...

  // Збереження даних профілю
  const saveProfileData = async(e:React.FormEvent) => {
    e.preventDefault()
    const errs:Record<string,string> = {}
    if (!firstName)    errs.firstName   = 'Обовʼязково'
    if (!birthDate)    errs.birthDate   = 'Обовʼязково'
    if (!weight||isNaN(+weight)) errs.weight='Невірно'
    if (!country)      errs.country     = 'Обовʼязково'
    if (password && password!==confirmPass) errs.confirmPass = 'Не співпадає'
    setErrorsData(errs)
    if (Object.keys(errs).length) return

    setSavingData(true)
    try {
      // Оновлюємо users
      await supabase
        .from('users')
        .update({
          first_name, last_name: lastName||null,
          middle_name, birth_date,
          weight:+weight, country,
          allergies, chronic_diseases: chronic||null,
          email
        })
        .eq('id', profile!.email /* або user.id */)

      // Оновлення пароля
      if (password) {
        await supabase.auth.updateUser({ password })
      }

      // Рефетч
      const { data: pr2 } = await supabase
        .from('users')
        .select(`first_name,last_name,middle_name,
                 birth_date,weight,country,
                 allergies,chronic_diseases,email`)
        .eq('id', profile!.email)
        .single()
      if (pr2) setProfile(pr2)

      alert('✅ Дані збережено')
    } catch(err:any) {
      alert('❌ ' + err.message)
    } finally {
      setSavingData(false)
    }
  }

  return (
    <main style={{ maxWidth:1000, margin:'2rem auto', fontFamily:'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{
        display:'flex', justifyContent:'space-between',
        alignItems:'center', marginBottom:20
      }}>
        <h1>Особистий кабінет</h1>
        <button onClick={handleSignOut}
          style={{ padding:'8px 16px', backgroundColor:'#e00',
                   color:'#fff', border:'none', borderRadius:4, cursor:'pointer' }}
        >Вихід</button>
      </div>

      {/* Next appointment */}
      <section style={{
        padding:20, border:'1px solid #ddd', borderRadius:6,
        marginBottom:30
      }}>
        {nextApp
          ? <p><strong>{
              new Date(nextApp.date_time)
                .toLocaleString('uk-UA',{ dateStyle:'medium', timeStyle:'short' })
            }</strong>{' '}
            – лікар {nextApp.doctor.first_name} {nextApp.doctor.last_name}
            </p>
          : <p>Немає запланованих консультацій.</p>
        }
      </section>

      {/* Sidebar + Content */}
      <div style={{ display:'flex', gap:20, alignItems:'flex-start' }}>
        <aside style={{ width:200, position:'sticky', top:'2rem' }}>
          <button onClick={()=>setActiveMenu('my-data')}
            style={sidebarButton(activeMenu==='my-data')}
          >Мої дані</button>
          <button onClick={()=>setActiveMenu('my-records')}
            style={sidebarButton(activeMenu==='my-records')}
          >Мої записи</button>
        </aside>

        <article style={{ flex:1, minHeight:400 }}>
          {activeMenu==='my-data' ? (
            // ********* ФОРМА Мої дані *********
            <form onSubmit={saveProfileData} noValidate>
              <h2>Ваші дані</h2>
              <div style={{
                display:'grid',
                gridTemplateColumns:'1fr 1fr',
                gap:20,
                marginBottom:20
              }}>
                {/* Ім’я */}
                <div>
                  <label>Ім’я*:</label><br/>
                  <input
                    style={inputStyle}
                    value={firstName}
                    onChange={e=>setFirstName(e.target.value)}
                  />
                  {errorsData.firstName && <p style={{color:'red'}}>{errorsData.firstName}</p>}
                </div>
                {/* Прізвище */}
                <div>
                  <label>Прізвище:</label><br/>
                  <input
                    style={inputStyle}
                    value={lastName}
                    onChange={e=>setLastName(e.target.value)}
                  />
                </div>
                {/* По-батькові */}
                <div>
                  <label>По-батькові:</label><br/>
                  <input
                    style={inputStyle}
                    value={middleName}
                    onChange={e=>setMiddleName(e.target.value)}
                  />
                </div>
                {/* Дата */}
                <div>
                  <label>Дата народження*:</label><br/>
                  <input
                    type="date"
                    style={inputStyle}
                    value={birthDate}
                    onChange={e=>setBirthDate(e.target.value)}
                  />
                  {errorsData.birthDate && <p style={{color:'red'}}>{errorsData.birthDate}</p>}
                </div>
                {/* Вага */}
                <div>
                  <label>Вага (кг)*:</label><br/>
                  <input
                    type="number"
                    style={inputStyle}
                    value={weight}
                    onChange={e=>setWeight(e.target.value)}
                  />
                  {errorsData.weight && <p style={{color:'red'}}>{errorsData.weight}</p>}
                </div>
                {/* Країна */}
                <div>
                  <label>Країна*:</label><br/>
                  <input
                    style={inputStyle}
                    value={country}
                    onChange={e=>setCountry(e.target.value)}
                  />
                  {errorsData.country && <p style={{color:'red'}}>{errorsData.country}</p>}
                </div>
                {/* Алергени */}
                <div style={{ gridColumn:'1 / -1' }}>
                  <label>Алергени (через кому):</label><br/>
                  <input
                    style={inputStyle}
                    value={allergies.join(', ')}
                    onChange={e=>setAllergies(
                      e.target.value.split(',').map(s=>s.trim()).filter(Boolean)
                    )}
                  />
                </div>
                {/* Хронічні */}
                <div style={{ gridColumn:'1 / -1' }}>
                  <label>Хронічні хвороби:</label><br/>
                  <textarea
                    style={{...inputStyle,resize:'vertical'}} rows={3}
                    value={chronic}
                    onChange={e=>setChronic(e.target.value)}
                  />
                </div>
                {/* E-mail */}
                <div>
                  <label>E-mail*:</label><br/>
                  <input
                    type="email"
                    style={inputStyle}
                    value={email}
                    onChange={e=>setEmail(e.target.value)}
                    required
                  />
                </div>
                {/* Новий пароль */}
                <div>
                  <label>Новий пароль:</label><br/>
                  <input
                    type="password"
                    style={inputStyle}
                    value={password}
                    onChange={e=>setPassword(e.target.value)}
                    placeholder="залиште порожнім, щоб не змінювати"
                  />
                </div>
                {/* Підтв пароля */}
                <div>
                  <label>Підтвердьте пароль:</label><br/>
                  <input
                    type="password"
                    style={inputStyle}
                    value={confirmPass}
                    onChange={e=>setConfirmPass(e.target.value)}
                  />
                  {errorsData.confirmPass && <p style={{color:'red'}}>{errorsData.confirmPass}</p>}
                </div>
              </div>

              <button type="submit" disabled={savingData}
                style={{
                  padding:'10px 20px',
                  backgroundColor:'#0070f3',
                  color:'#fff',
                  border:'none',
                  borderRadius:4,
                  cursor:savingData?'not-allowed':'pointer'
                }}
              >
                {savingData ? 'Збереження…' : 'Зберегти зміни'}
              </button>
            </form>

          ) : (

            /* ******** Мої записи ******** */
            <>
              <h2>Мої записи</h2>
              {/* тут ваша таблиця із записами, як раніше */}
            </>
          )}
        </article>
      </div>

      {/* Модалка переносу */}
      {rescheduleApp && (
        <div style={{
          position:'fixed', top:0,left:0,right:0,bottom:0,
          backgroundColor:'rgba(0,0,0,0.3)',
          display:'flex', alignItems:'center', justifyContent:'center'
        }}>
          <div style={{ background:'#fff', padding:20, borderRadius:6, minWidth:300 }}>
            <h3>Перенести консультацію</h3>
            <input
              type="datetime-local"
              value={newDateTime}
              onChange={e=>setNewDateTime(e.target.value)}
              style={{ border:'1px solid #ddd', padding:8, width:'100%', marginBottom:12 }}
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
