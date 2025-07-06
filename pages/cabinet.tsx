// pages/cabinet.tsx
import React, { useEffect, useState } from 'react'
import { supabase }              from '../lib/supabase'
import { useRouter }             from 'next/router'
import Link                      from 'next/link'

// Типи
type Appointment = {
  id: string
  date_time: string
  status: 'очікується'|'завершено'|'скасовано'
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

  // Лоадер
  const [loading, setLoading]           = useState(true)
  // зчитані з БД
  const [profile, setProfile]           = useState<Profile|null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [nextApp, setNextApp]           = useState<Appointment|null>(null)

  // контролі меню
  const [activeMenu, setActiveMenu]     = useState<'my-data'|'my-records'>('my-data')
  const [recordsTab, setRecordsTab]     = useState<'upcoming'|'past'>('upcoming')

  // для переносу
  const [rescheduleApp, setRescheduleApp] = useState<Appointment|null>(null)
  const [newDateTime, setNewDateTime]     = useState<string>('')

  // *** НОВІ СТАНИ ДЛЯ ФОРМИ «Мої дані» ***
  const [firstName,    setFirstName]    = useState('')
  const [lastName,     setLastName]     = useState('')
  const [middleName,   setMiddleName]   = useState('')
  const [birthDate,    setBirthDate]    = useState('')
  const [weight,       setWeight]       = useState<string>('')
  const [country,      setCountry]      = useState('')
  const [allergies,    setAllergies]    = useState<string[]>([])
  const [chronic,      setChronic]      = useState('')
  const [email,        setEmail]        = useState('')
  const [phone,        setPhone]        = useState('')
  const [password,     setPassword]     = useState('')
  const [confirmPass,  setConfirmPass]  = useState('')
  const [errorsData,   setErrorsData]   = useState<Record<string,string>>({})
  const [savingData,   setSavingData]   = useState(false)

  // при монтовані зчитуємо і розкладаємо в стани
  useEffect(() => {
    ;(async () => {
      const { data:{ user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const uid = user.id

      // профіль з users
      const { data: pr } = await supabase
        .from('users')
        .select(`
          first_name,last_name,middle_name,
          birth_date,weight,country,
          allergies,chronic_diseases,email,phone
        `)
        .eq('id', uid)
        .single()
      if (pr) {
        setProfile(pr)
        setFirstName(pr.first_name)
        setLastName(pr.last_name||'')
        setMiddleName(pr.middle_name||'')
        setBirthDate(pr.birth_date||'')
        setWeight(pr.weight?.toString()||'')
        setCountry(pr.country||'')
        setAllergies(pr.allergies||[])
        setChronic(pr.chronic_diseases||'')
        setEmail(pr.email||'')
        setPhone(pr.phone||'')
      }

      // записи
      const { data: apps } = await supabase
        .from('appointments')
        .select(`
          id,date_time,status,
          doctor(first_name,last_name,specialization)
        `)
        .eq('patient', uid)
        .order('date_time',{ ascending:true })
      const arr = apps||[]
      setAppointments(arr)
      // знаходжу next
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

  //
  // — Операції для «Мої записи» (як раніше) —
  //

  const cancelAppointment = async (id:string) => {
    await supabase.from('appointments').update({ status:'скасовано' }).eq('id',id)
    setAppointments(apps=> apps.map(a=> a.id===id?{...a,status:'скасовано'}:a))
    if (nextApp?.id===id) setNextApp(null)
  }
  const openReschedule = (app:Appointment) => {
    setRescheduleApp(app)
    setNewDateTime(app.date_time.slice(0,16))
  }
  const confirmReschedule = async() => {
    if (!rescheduleApp) return
    await supabase
      .from('appointments')
      .update({ date_time:new Date(newDateTime).toISOString() })
      .eq('id', rescheduleApp.id)
    setAppointments(apps=>
      apps.map(a=>
        a.id===rescheduleApp.id
          ?{...a,date_time:newDateTime}
          :a
      )
    )
    if (nextApp?.id===rescheduleApp.id)
      setNextApp({ ...rescheduleApp, date_time:newDateTime })
    setRescheduleApp(null)
  }

  // — Операція вихід —
  const handleSignOut = async()=>{
    await supabase.auth.signOut()
    router.push('/auth')
  }

  //
  // — НОВА ФУНКЦІЯ: збереження даних My-Data —
  //
  const saveProfileData = async (e:React.FormEvent) => {
    e.preventDefault()
    const errs:Record<string,string>={}
    if(!firstName) errs.firstName='Ім’я обов’язкове'
    if(!birthDate) errs.birthDate='Дата обов’язкова'
    if(!weight || isNaN(Number(weight))) errs.weight='Вкажіть вагу'
    if(!country) errs.country='Країна обов’язкова'
    if(password && password!==confirmPass)
      errs.confirmPass='Паролі не співпадають'
    setErrorsData(errs)
    if(Object.keys(errs).length) return

    setSavingData(true)
    try {
      const updates:any = {
        first_name:firstName,
        last_name: lastName||null,
        middle_name: middleName||null,
        birth_date: birthDate,
        weight: Number(weight),
        country,
        allergies, // масив рядків
        chronic_diseases: chronic||null
      }
      // оновлюємо users
      let { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', supabase.auth.user()?.id)
      if(error) throw error

      // оновлюємо email, phone, password через auth
      const authUpdates:any = { email }
      if(phone) authUpdates.phone=phone
      if(password) authUpdates.password=password

      if(Object.keys(authUpdates).length){
        const { error: e2 } = await supabase.auth.updateUser(authUpdates)
        if(e2) throw e2
      }

      alert('✅ Дані успішно збережено')
    } catch(err:any){
      console.error(err)
      alert('❌ Помилка: '+err.message)
    } finally {
      setSavingData(false)
    }
  }

  // стилі
  const inputStyle = { border:'1px solid #ddd', padding:8, borderRadius:4, width:'100%' }
  const thTdStyle = { border:'1px solid #ddd', padding:8, textAlign:'left' as const }

  return (
    <main style={{ maxWidth:1000, margin:'2rem auto', fontFamily:'Arial, sans-serif' }}>

      {/* — Header — */}
      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20
      }}>
        <h1>Особистий кабінет</h1>
        <button
          onClick={handleSignOut}
          style={{
            padding:'8px 16px', backgroundColor:'#e00', color:'#fff',
            border:'none', borderRadius:4, cursor:'pointer'
          }}
        >Вихід</button>
      </div>

      {/* — Блок next consultation — */}
      <section style={{
        padding:20, border:'1px solid #ddd', borderRadius:6, marginBottom:30
      }}>
        {nextApp
          ? <p>
              <strong>{
                new Date(nextApp.date_time)
                  .toLocaleString('uk-UA',{dateStyle:'medium',timeStyle:'short'})
              }</strong>
              {' '}– лікар {nextApp.doctor.first_name} {nextApp.doctor.last_name}
            </p>
          : <p>У вас немає запланованих консультацій.</p>
        }
      </section>

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

        {/* CONTENT */}
        <article style={{ flex:1 }}>
          {activeMenu==='my-data' && (
            <form onSubmit={saveProfileData} noValidate>
              <h2>Ваші дані</h2>
              <div style={{
                display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20
              }}>
                <div>
                  <label>Ім’я*:</label><br/>
                  <input
                    value={firstName}
                    onChange={e=>setFirstName(e.target.value)}
                    style={inputStyle}
                  />
                  {errorsData.firstName && <p style={{color:'red'}}>{errorsData.firstName}</p>}
                </div>
                <div>
                  <label>Прізвище:</label><br/>
                  <input
                    value={lastName}
                    onChange={e=>setLastName(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div style={{gridColumn:'1 / -1'}}>
                  <label>По-батькові:</label><br/>
                  <input
                    value={middleName}
                    onChange={e=>setMiddleName(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>Дата народження*:</label><br/>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={e=>setBirthDate(e.target.value)}
                    style={inputStyle}
                  />
                  {errorsData.birthDate && <p style={{color:'red'}}>{errorsData.birthDate}</p>}
                </div>
                <div>
                  <label>Вага (кг)*:</label><br/>
                  <input
                    type="number"
                    value={weight}
                    onChange={e=>setWeight(e.target.value)}
                    style={inputStyle}
                  />
                  {errorsData.weight && <p style={{color:'red'}}>{errorsData.weight}</p>}
                </div>
                <div>
                  <label>Країна*:</label><br/>
                  <input
                    value={country}
                    onChange={e=>setCountry(e.target.value)}
                    style={inputStyle}
                  />
                  {errorsData.country && <p style={{color:'red'}}>{errorsData.country}</p>}
                </div>
                <div style={{gridColumn:'1 / -1'}}>
                  <label>Алергени:</label><br/>
                  <input
                    value={allergies.join(', ')}
                    onChange={e=>setAllergies(e.target.value.split(',').map(s=>s.trim()))}
                    placeholder="через кому"
                    style={inputStyle}
                  />  
                </div>
                <div style={{gridColumn:'1 / -1'}}>
                  <label>Хронічні хвороби:</label><br/>
                  <textarea
                    value={chronic}
                    onChange={e=>setChronic(e.target.value)}
                    rows={3}
                    style={{...inputStyle,resize:'vertical'}}
                  />
                </div>

                {/* e-mail/phone/password */}
                <div>
                  <label>E-mail*:</label><br/>
                  <input
                    type="email"
                    value={email}
                    onChange={e=>setEmail(e.target.value)}
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label>Телефон:</label><br/>
                  <input
                    type="tel"
                    value={phone||''}
                    onChange={e=>setPhone(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label>Новий пароль:</label><br/>
                  <input
                    type="password"
                    value={password}
                    onChange={e=>setPassword(e.target.value)}
                    style={inputStyle}
                    placeholder="залиште порожнім, щоб не змінювати"
                  />
                </div>
                <div>
                  <label>Підтвердження паролю:</label><br/>
                  <input
                    type="password"
                    value={confirmPass}
                    onChange={e=>setConfirmPass(e.target.value)}
                    style={inputStyle}
                  />
                  {errorsData.confirmPass && <p style={{color:'red'}}>{errorsData.confirmPass}</p>}
                </div>
              </div>

              <button
                type="submit"
                style={{
                  padding:'10px 20px', backgroundColor:'#0070f3', color:'#fff',
                  border:'none', borderRadius:4, cursor:savingData?'not-allowed':'pointer'
                }}
                disabled={savingData}
              >
                {savingData? 'Збереження…':'Зберегти зміни'}
              </button>
            </form>
          )}

          {activeMenu==='my-records' && (
            <>
              {/* — тут ваш код «Мої записи» без змін — */}
            </>
          )}
        </article>
      </div>

      {/* модалка перенесення — без змін */}
      {rescheduleApp && (
        <div style={{
          position:'fixed',top:0,left:0,right:0,bottom:0,
          backgroundColor:'rgba(0,0,0,0.3)',
          display:'flex',alignItems:'center',justifyContent:'center'
        }}>
          <div style={{ background:'#fff',padding:20,borderRadius:6,minWidth:300 }}>
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
