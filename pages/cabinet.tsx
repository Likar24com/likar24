// pages/cabinet.tsx
import React, { useEffect, useState } from 'react'
import { supabase }              from '../lib/supabase'
import { useRouter }             from 'next/router'

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
  const [userId, setUserId]           = useState<string|null>(null)
  const [loading, setLoading]         = useState(true)
  const [profile, setProfile]         = useState<Profile|null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [nextApp, setNextApp]         = useState<Appointment|null>(null)
  const [activeMenu, setActiveMenu]   = useState<'my-data'|'my-records'>('my-data')
  const [recordsTab, setRecordsTab]   = useState<'upcoming'|'past'>('upcoming')
  const [rescheduleApp, setRescheduleApp] = useState<Appointment|null>(null)
  const [newDateTime, setNewDateTime] = useState('')
  // стани полів
  const [firstName,   setFirstName]   = useState('')
  const [lastName,    setLastName]    = useState('')
  const [middleName,  setMiddleName]  = useState('')
  const [birthDate,   setBirthDate]   = useState('')
  const [weight,      setWeight]      = useState('')
  const [country,     setCountry]     = useState('')
  const [allergies,   setAllergies]   = useState<string[]>([])
  const [chronic,     setChronic]     = useState('')
  const [email,       setEmail]       = useState('')
  const [phone,       setPhone]       = useState('')
  const [password,    setPassword]    = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [errorsData,  setErrorsData]  = useState<Record<string,string>>({})
  const [savingData,  setSavingData]  = useState(false)

  const inputStyle = { border:'1px solid #ddd', padding:8, borderRadius:4, width:'100%', marginBottom:12 }
  const thTdStyle = { border:'1px solid #ddd', padding:8, textAlign:'left' as const }
  const sidebarButton = (active:boolean) => ({
    width:'100%', textAlign:'left' as const, padding:10,
    backgroundColor: active?'#0070f3':'transparent',
    color: active?'#fff':'#000',
    border:'none', borderRadius:4, marginBottom:8, cursor:'pointer'
  })

  useEffect(() => {
    ;(async () => {
      const { data:{ user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      setUserId(user.id)

      // --- Фетч профілю
      const { data: pr } = await supabase
        .from('users')
        .select(`first_name,last_name,middle_name,birth_date,weight,country,allergies,chronic_diseases,email,phone`)
        .eq('id', user.id)
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
        setEmail(pr.email)
        setPhone(pr.phone||'')
      }

      // --- Фетч записів
      const { data: apps } = await supabase
        .from('appointments')
        .select(`id,date_time,status,doctor(first_name,last_name,specialization)`)
        .eq('patient', user.id)
        .order('date_time',{ ascending:true })
      const arr = apps||[]
      setAppointments(arr)

      // --- Next
      const next = arr
        .filter(a=>a.status==='очікується' && new Date(a.date_time)>new Date())
        .sort((a,b)=>new Date(a.date_time).getTime()-new Date(b.date_time).getTime())
        .shift()||null
      setNextApp(next)

      setLoading(false)
    })()
  },[router])

  if (loading) return <p style={{textAlign:'center',marginTop:50}}>Завантаження…</p>

  // Вихід
  const handleSignOut = async()=>{
    await supabase.auth.signOut()
    router.push('/auth')
  }

  // CANCEL
  const cancelAppointment = async(id:string)=>{
    await supabase.from('appointments').update({status:'скасовано'}).eq('id',id)
    setAppointments(xs=> xs.map(a=>a.id===id?{...a,status:'скасовано'}:a))
    if (nextApp?.id===id) setNextApp(null)
  }

  // RESCHEDULE
  const openReschedule = (a:Appointment)=>{
    setRescheduleApp(a)
    setNewDateTime(a.date_time.slice(0,16))
  }
  const confirmReschedule = async()=>{
    if (!rescheduleApp) return
    await supabase
      .from('appointments')
      .update({ date_time:new Date(newDateTime).toISOString() })
      .eq('id', rescheduleApp.id)
    setAppointments(xs=>
      xs.map(a=>a.id===rescheduleApp.id?{...a,date_time:newDateTime}:a)
    )
    if (nextApp?.id===rescheduleApp.id) {
      setNextApp({...rescheduleApp,date_time:newDateTime})
    }
    setRescheduleApp(null)
  }

  // SAVE PROFILE
  const saveProfileData = async(e:React.FormEvent)=>{
    e.preventDefault()
    const errs:Record<string,string>={}
    if (!firstName) errs.firstName='Обовʼязково'
    if (!birthDate) errs.birthDate='Обовʼязково'
    if (!weight||isNaN(+weight)) errs.weight='Невірно'
    if (!country) errs.country='Обовʼязково'
    if (password&&password!==confirmPass) errs.confirmPass='Не співпадає'
    setErrorsData(errs)
    if (Object.keys(errs).length) return

    setSavingData(true)
    try {
      // UPDATE users
      await supabase
        .from('users')
        .update({
          first_name, last_name:lastName||null,
          middle_name, birth_date,
          weight:+weight, country,
          allergies, chronic_diseases:chronic||null
        })
        .eq('id',userId!)

      // UPDATE auth
      const upd:any={email}
      if (phone) upd.phone=phone
      if (password) upd.password=password
      if (Object.keys(upd).length){
        await supabase.auth.updateUser(upd)
      }

      // re-fetch profile
      const { data: pr } = await supabase
        .from('users')
        .select(`first_name,...,phone`)
        .eq('id',userId!)
        .single()
      if(pr) setProfile(pr)

      alert('✅ Збережено')
    }catch(err:any){
      console.error(err)
      alert('❌ '+err.message)
    }finally{
      setSavingData(false)
    }
  }

  return (
    <main style={{maxWidth:1000,margin:'2rem auto'}}>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <h1>Особистий кабінет</h1>
        <button onClick={handleSignOut}
          style={{padding:'8px 16px',backgroundColor:'#e00',color:'#fff',border:'none',borderRadius:4, cursor:'pointer'}}
        >Вихід</button>
      </div>

      {/* Next */}
      <section style={{padding:20,border:'1px solid #ddd',borderRadius:6,marginBottom:30}}>
        {nextApp
          ? <p><strong>{
              new Date(nextApp.date_time).toLocaleString('uk-UA',{dateStyle:'medium',timeStyle:'short'})
            }</strong> – лікар {nextApp.doctor.first_name} {nextApp.doctor.last_name}</p>
          : <p>Немає запланованих консультацій.</p>
        }
      </section>

      {/* Sidebar + Content */}
      <div style={{display:'flex',gap:20,alignItems:'flex-start'}}>
        <aside style={{width:200,position:'sticky',top:'2rem'}}>
          <button onClick={()=>setActiveMenu('my-data')} style={sidebarButton(activeMenu==='my-data')}>
            Мої дані
          </button>
          <button onClick={()=>setActiveMenu('my-records')} style={sidebarButton(activeMenu==='my-records')}>
            Мої записи
          </button>
        </aside>

        <article style={{flex:1}}>
          {activeMenu==='my-data' ? (
            <form onSubmit={saveProfileData} noValidate>
              <h2>Ваші дані</h2>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
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
                {/* Дата */}
                <div>
                  <label>Дата нар.*:</label><br/>
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
                  <input style={inputStyle} value={country} onChange={e=>setCountry(e.target.value)}/>
                  {errorsData.country && <p style={{color:'red'}}>{errorsData.country}</p>}
                </div>
                {/* Алергени */}
                <div style={{gridColumn:'1 / -1'}}>
                  <label>Алергени (через кому):</label><br/>
                  <input style={inputStyle}
                    value={allergies.join(', ')}
                    onChange={e=>setAllergies(e.target.value.split(',').map(s=>s.trim()).filter(Boolean))}
                  />
                </div>
                {/* Хрон. хвороби */}
                <div style={{gridColumn:'1 / -1'}}>
                  <label>Хронічні хвороби:</label><br/>
                  <textarea style={{...inputStyle,resize:'vertical'}} rows={3}
                    value={chronic} onChange={e=>setChronic(e.target.value)}
                  />
                </div>
                {/* Email */}
                <div>
                  <label>E-mail*:</label><br/>
                  <input type="email" style={inputStyle} value={email} onChange={e=>setEmail(e.target.value)} required/>
                </div>
                {/* Phone */}
                <div>
                  <label>Телефон:</label><br/>
                  <input type="tel" style={inputStyle} value={phone} onChange={e=>setPhone(e.target.value)}/>
                </div>
                {/* Пароль */}
                <div>
                  <label>Новий пароль:</label><br/>
                  <input type="password" style={inputStyle}
                    value={password} onChange={e=>setPassword(e.target.value)}
                    placeholder="залиште порожнім, щоб не змінювати"
                  />
                </div>
                {/* Підтв */}
                <div>
                  <label>Підтв. пароль:</label><br/>
                  <input type="password" style={inputStyle}
                    value={confirmPass} onChange={e=>setConfirmPass(e.target.value)}
                  />
                  {errorsData.confirmPass && <p style={{color:'red'}}>{errorsData.confirmPass}</p>}
                </div>
              </div>
              <button type="submit" disabled={savingData}
                style={{padding:'10px 20px',backgroundColor:'#0070f3',color:'#fff',border:'none',borderRadius:4,cursor:savingData?'not-allowed':'pointer'}}
              >
                {savingData?'Збереження…':'Зберегти зміни'}
              </button>
            </form>
          ) : (
            <>
              <h2>Мої записи</h2>
              {/* ...таблиця як раніше... */}
            </>
          )}
        </article>
      </div>

      {/* Модалка переносу */}
      {rescheduleApp && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',padding:20,borderRadius:6,minWidth:300}}>
            <h3>Перенести консультацію</h3>
            <input type="datetime-local" value={newDateTime}
              onChange={e=>setNewDateTime(e.target.value)}
              style={{border:'1px solid #ddd',padding:8,width:'100%',marginBottom:12}}
            />
            <div style={{textAlign:'right'}}>
              <button onClick={confirmReschedule} style={{marginRight:8}}>Підтвердити</button>
              <button onClick={()=>setRescheduleApp(null)}>Відмінити</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
