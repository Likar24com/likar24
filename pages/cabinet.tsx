import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import Select, { SingleValue, MultiValue } from 'react-select'
import { countryOptions, allergyOptions } from '../lib/constants'

type Appointment = { id: number; date: string; doctor: { first_name: string; last_name: string }[] }

type Profile = {
  first_name: string
  last_name: string
  middle_name?: string
  birth_date?: string
  weight?: number
  country?: string
  allergies?: string[]
  chronic_diseases?: string
}

enum Tab { MyData = 'Мої дані', Records = 'Мої записи' }
enum RecordsSubTab { Upcoming = 'Заплановані', Past = 'Відбулися' }

type StyleObject = React.CSSProperties
const inputStyle: StyleObject = {
  width: '100%', padding: 10, fontSize: '1rem',
  border: '1px solid #ccc', borderRadius: 6, marginBottom: 8, minHeight: 40,
}
const selectStyles = {
  control: (base: any) => ({
    ...base, ...inputStyle, minHeight: 40, boxShadow: 'none'
  }),
  menu: (base: any) => ({ ...base, zIndex: 999 }),
  valueContainer: (base: any) => ({
    ...base, padding: '0 8px', minHeight: 40, height: 40, alignItems: 'center'
  }),
  input: (base: any) => ({
    ...base, margin: 0, padding: 0, minHeight: 40, height: 40
  })
}
const buttonStyle: StyleObject = {
  padding: '0.5rem 1.5rem', fontSize: '1rem',
  backgroundColor: '#0070f3', color: '#fff', border: 'none',
  borderRadius: 6, cursor: 'pointer', marginTop: 8, marginRight: 10, transition: 'background .15s'
}
const buttonActiveStyle: StyleObject = { ...buttonStyle, backgroundColor: '#0361c7' }
const logoutStyle: StyleObject = { ...buttonStyle, backgroundColor: '#e00', marginRight: 0 }

export default function CabinetPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null)
  const [tab, setTab] = useState<Tab>(Tab.MyData)
  const [recordsTab, setRecordsTab] = useState<RecordsSubTab>(RecordsSubTab.Upcoming)

  // form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [country, setCountry] = useState<SingleValue<{ value: string; label: string }>>(null)
  const [allergies, setAllergies] = useState<MultiValue<{ value: string; label: string }>>([])
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string>('')

  // email/password state
  const [email, setEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState<string>('')
  const [emailSuccess, setEmailSuccess] = useState<string>('')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState<string>('')
  const [passwordSuccess, setPasswordSuccess] = useState<string>('')

  useEffect(() => {
    async function load() {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) { router.push('/auth'); return }
      setUser(user)
      setEmail(user.email || '')

      // profile
      const { data: pr } = await supabase.from('users').select('*').eq('id', user.id).single()
      if (pr) {
        setProfile(pr)
        setFirstName(pr.first_name)
        setLastName(pr.last_name)
        setCountry(countryOptions.find(c => c.value === pr.country) || null)
        setAllergies(allergyOptions.filter(a => pr.allergies?.includes(a.value)))
      }
      // appointments
      const { data: apps } = await supabase
        .from('appointments')
        .select('id,date,doctor!inner(first_name,last_name)')
        .eq('patient_id', user.id)
        .order('date', { ascending: true })
      const list = apps || []
      const normalized = list.map(a => ({ ...a, doctor: Array.isArray(a.doctor) ? a.doctor : [a.doctor] }))
      setAppointments(normalized)
      const now = new Date().toISOString()
      const next = normalized.find(a => a.date > now) || null
      setNextAppointment(next)
    }
    load()
  }, [router])

  // ===== ВАЛІДАЦІЯ =====
  const canSave =
    !!firstName.trim() &&
    !!country &&
    !!profile?.birth_date &&
    !!profile?.weight &&
    allergies.length > 0

  const emailValid = !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleSave = async () => {
    setFormError('')
    if (!canSave) {
      setFormError('Заповніть усі обов’язкові поля (Ім’я, вага, дата народження, країна, алергени)')
      return
    }
    if (!user) return
    setLoading(true)
    await supabase.from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        country: country.value,
        allergies: allergies.map(a => a.value)
      })
      .eq('id', user.id)
    setLoading(false)
    alert('✅ Дані оновлено')
  }

  const handleEmailSave = async () => {
    setEmailError('')
    setEmailSuccess('')
    if (!emailValid) {
      setEmailError('Введіть коректний e-mail')
      return
    }
    if (!user) return
    setEmailLoading(true)
    const { error } = await supabase.auth.updateUser({ email })
    setEmailLoading(false)
    if (error) setEmailError('❌ ' + error.message)
    else setEmailSuccess('✅ E-mail оновлено')
  }

  const handlePasswordSave = async () => {
    setPasswordError('')
    setPasswordSuccess('')
    if (!newPassword || !confirmPassword) {
      setPasswordError('Введіть обидва поля паролю')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Паролі не співпадають')
      return
    }
    setPasswordLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordLoading(false)
    if (error) setPasswordError('❌ ' + error.message)
    else {
      setPasswordSuccess('✅ Пароль оновлено')
      setNewPassword(''); setConfirmPassword('')
    }
  }

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/auth') }

  return (
    <div style={{ maxWidth: 1000, margin: '2rem auto', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>Персональний кабінет</h1>
        <button onClick={handleLogout} style={logoutStyle}>Вихід</button>
      </div>

      {/* Next appointment */}
      <div style={{ padding: 16, background: '#f9f9f9', borderRadius: 6, marginBottom: 24 }}>
        {nextAppointment ? (
          <>
            <strong>Наступна консультація: </strong>
            {new Date(nextAppointment.date).toLocaleDateString()} {' '}
            {new Date(nextAppointment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} з Dr. {nextAppointment.doctor[0].first_name} {nextAppointment.doctor[0].last_name}
          </>
        ) : 'Немає запланованих консультацій'}
      </div>

      <div style={{ display: 'flex' }}>
        {/* Sidebar */}
        <nav style={{ width: 200, borderRight: '1px solid #ddd', paddingRight: 16 }}>
          {[Tab.MyData, Tab.Records].map(t => (
            <div
              key={t}
              onClick={() => setTab(t)}
              style={{ padding: '8px 0', cursor: 'pointer', fontWeight: t === tab ? 'bold' : 'normal' }}
            >
              {t}
            </div>
          ))}
        </nav>

        {/* Content */}
        <div style={{ flex: 1, paddingLeft: 24, minHeight: 500 }}>
          {tab === Tab.MyData && profile && (
            <form style={{ display: 'grid', gap: 24, maxWidth: 650 }}>
              {/* Block 1: Основні дані */}
              <fieldset style={{ border: '1px solid #ddd', borderRadius: 6, padding: 16 }}>
                <legend style={{ fontWeight: 'bold', marginBottom: 12 }}>Мої дані</legend>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 16, rowGap: 12 }}>
                  <div>
                    <label>Ім'я*</label>
                    <input
                      style={inputStyle}
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="Ім'я"
                    />
                  </div>
                  <div>
                    <label>Прізвище</label>
                    <input
                      style={inputStyle}
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="Прізвище"
                    />
                  </div>
                  <div>
                    <label>По-батькові</label>
                    <input
                      style={inputStyle}
                      disabled
                      value={profile.middle_name || ''}
                      placeholder="По-батькові"
                    />
                  </div>
                  <div>
                    <label>Дата народження*</label>
                    <input
                      style={inputStyle}
                      disabled
                      type="date"
                      value={profile.birth_date || ''}
                    />
                  </div>
                  <div>
                    <label>Вага (кг)*</label>
                    <input
                      style={inputStyle}
                      disabled
                      type="number"
                      value={profile.weight || ''}
                    />
                  </div>
                  <div>
                    <label>Країна*</label>
                    <Select
                      styles={selectStyles}
                      options={countryOptions}
                      value={country}
                      onChange={o => setCountry(o)}
                      placeholder="Оберіть країну"
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Алергени*</label>
                    <Select
                      styles={selectStyles}
                      isMulti
                      options={allergyOptions}
                      value={allergies}
                      onChange={o => setAllergies(o)}
                      placeholder="Оберіть алергени"
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Хронічні хвороби</label>
                    <textarea
                      style={{ ...inputStyle, resize: 'vertical' }}
                      disabled
                      value={profile.chronic_diseases || ''}
                      rows={3}
                    />
                  </div>
                </div>
                {formError && <div style={{ color: 'red', marginTop: 8 }}>{formError}</div>}
                <button
                  type="button"
                  onClick={handleSave}
                  style={{ ...buttonStyle, backgroundColor: canSave ? '#0070f3' : '#aaa', color: '#fff' }}
                  disabled={loading || !canSave}
                >
                  {loading ? 'Збереження…' : 'Зберегти'}
                </button>
              </fieldset>

{/* Block 2: Е-mail */}
<fieldset style={{ border: '1px solid #ddd', borderRadius: 6, padding: 16 }}>
  <legend style={{ fontWeight: 'bold', marginBottom: 12 }}>Змінити e-mail</legend>
  <input
    style={inputStyle}
    type="email"
    value={email}
    onChange={e => setEmail(e.target.value)}
    placeholder="E-mail"
  />
  {emailError && <div style={{ color: 'red', marginTop: 8 }}>{emailError}</div>}
  {emailSuccess && <div style={{ color: 'green', marginTop: 8 }}>{emailSuccess}</div>}
  <button
    type="button"
    onClick={handleEmailSave}
    style={buttonStyle}
    disabled={emailLoading}
  >
    {emailLoading ? 'Збереження…' : 'Зберегти e-mail'}
  </button>
</fieldset>


              {/* Block 3: Пароль */}
              <fieldset style={{ border: '1px solid #ddd', borderRadius: 6, padding: 16 }}>
                <legend style={{ fontWeight: 'bold', marginBottom: 12 }}>Змінити пароль</legend>
                <input style={inputStyle} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Новий пароль" />
                <input style={inputStyle} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Підтвердіть пароль" />
                {passwordError && <div style={{ color: 'red', marginTop: 8 }}>{passwordError}</div>}
                {passwordSuccess && <div style={{ color: 'green', marginTop: 8 }}>{passwordSuccess}</div>}
                <button
                  type="button"
                  onClick={handlePasswordSave}
                  style={buttonStyle}
                  disabled={passwordLoading}
                >
                  {passwordLoading ? 'Збереження…' : 'Зберегти пароль'}
                </button>
              </fieldset>
            </form>
          )}

          {tab === Tab.Records && (
            <div>
              <div style={{ marginBottom: 16 }}>
                {[RecordsSubTab.Upcoming, RecordsSubTab.Past].map(rt => (
                  <button
                    key={rt}
                    onClick={() => setRecordsTab(rt)}
                    style={rt === recordsTab ? buttonActiveStyle : buttonStyle}
                  >{rt}</button>
                ))}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: 8 }}>Дата</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Час</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Лікар</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Дія</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.filter(a => (recordsTab === RecordsSubTab.Upcoming ? new Date(a.date) > new Date() : new Date(a.date) <= new Date())).map(a => {
                    const dt = new Date(a.date)
                    return (
                      <tr key={a.id}>
                        <td style={{ padding: 8 }}>{dt.toLocaleDateString()}</td>
                        <td style={{ padding: 8 }}>{dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td style={{ padding: 8 }}>{a.doctor[0].first_name} {a.doctor[0].last_name}</td>
                        <td style={{ padding: 8 }}></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
