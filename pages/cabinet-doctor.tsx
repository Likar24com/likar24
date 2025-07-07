// pages/cabinet-doctor.tsx
import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'
import Select from 'react-select'

const languageOptions = [
  'Українська', 'English', 'Русский', 'Polski', 'Deutsch',
  'Français', 'Español', 'Italiano', '中文', 'العربية', 'Türkçe', 'Português', 'தமிழ்', 'हिन्दी'
].map(v => ({ value: v, label: v }))
const specializationOptions = [
  'Терапевт', 'Кардіолог', 'Педіатр', 'Дерматолог', 'Невролог',
  'Офтальмолог', 'Хірург', 'Гінеколог', 'Стоматолог', 'Психотерапевт'
].map(v => ({ value: v, label: v }))

const inputStyle = {
  width: '100%', padding: 10, fontSize: '1rem',
  border: '1px solid #ccc', borderRadius: 6, marginBottom: 8, minHeight: 40
}
const selectStyles = {
  control: (base: any) => ({
    ...base, ...inputStyle, minHeight: 40, boxShadow: 'none'
  }),
  menu: (base: any) => ({ ...base, zIndex: 999 })
}
const buttonStyle = {
  padding: '0.5rem 1rem', fontSize: '1rem', backgroundColor: '#0070f3', color: '#fff', border: 'none',
  borderRadius: 6, cursor: 'pointer', marginTop: 8, marginRight: 8, minWidth: 120
}
const logoutStyle = { ...buttonStyle, backgroundColor: '#e00', marginRight: 0 }

enum Tab { MyData = 'Мої дані', Consults = 'Мої консультації' }
enum ConsultsTab { Today = 'Сьогодні', Upcoming = 'Заплановані', Past = 'Минули' }

export default function CabinetDoctor() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [consults, setConsults] = useState<any[]>([])
  const [tab, setTab] = useState<Tab>(Tab.MyData)
  const [consultTab, setConsultTab] = useState<ConsultsTab>(ConsultsTab.Today)
  const [nextConsult, setNextConsult] = useState<any>(null)
  // e-mail/password state
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) { router.push('/auth'); return }
      setUser(user)
      setEmail(user.email || '')

      // Профіль лікаря
      const { data: pr } = await supabase.from('users').select('*').eq('id', user.id).single()
      if (pr) setProfile(pr)

      // Всі консультації
      const { data: cons } = await supabase
        .from('appointments')
        .select('id,date,patient!inner(first_name,last_name)')
        .eq('doctor_id', user.id)
        .order('date', { ascending: true })
      setConsults(cons || [])

      // Найближча консультація
      const now = new Date()
      const sorted = (cons || []).filter(c => new Date(c.date) >= now)
      setNextConsult(sorted.length ? sorted[0] : null)
    }
    load()
  }, [router])

  const handleEmailSave = async () => {
    setEmailError('')
    setEmailSuccess('')
    if (!email.trim()) { setEmailError('Введіть e-mail'); return }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setEmailError('Некоректний e-mail'); return }
    const { error } = await supabase.auth.updateUser({ email })
    if (error) setEmailError(error.message)
    else setEmailSuccess('✅ E-mail оновлено')
  }
  const handlePasswordSave = async () => {
    setPasswordError('')
    setPasswordSuccess('')
    if (!newPassword || newPassword.length < 6) { setPasswordError('Пароль мін. 6 символів'); return }
    if (newPassword !== confirmPassword) { setPasswordError('Паролі не співпадають'); return }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setPasswordError(error.message)
    else {
      setPasswordSuccess('✅ Пароль оновлено')
      setNewPassword('')
      setConfirmPassword('')
    }
  }
  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/auth') }

  // Фільтри консультацій
  const now = new Date()
  const todayIso = now.toISOString().split('T')[0]
  const filteredConsults = consults.filter(c => {
    const consultDate = new Date(c.date)
    if (consultTab === ConsultsTab.Today)
      return c.date.startsWith(todayIso)
    if (consultTab === ConsultsTab.Upcoming)
      return consultDate > now && !c.date.startsWith(todayIso)
    if (consultTab === ConsultsTab.Past)
      return consultDate < now && !c.date.startsWith(todayIso)
    return false
  })

  return (
    <div style={{ maxWidth: 1000, margin: '2rem auto', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>Кабінет лікаря</h1>
        <button onClick={handleLogout} style={logoutStyle}>Вихід</button>
      </div>
      <div style={{ padding: 16, background: '#f9f9f9', borderRadius: 6, marginBottom: 24 }}>
        {nextConsult ? (
          <>
            <strong>Найближча консультація: </strong>
            {new Date(nextConsult.date).toLocaleString()} з пацієнтом {nextConsult.patient.first_name} {nextConsult.patient.last_name}
          </>
        ) : 'Немає запланованих консультацій'}
      </div>
      <div style={{ display: 'flex' }}>
        {/* Sidebar */}
        <nav style={{ width: 220, borderRight: '1px solid #ddd', paddingRight: 16 }}>
          {[Tab.MyData, Tab.Consults].map(t => (
            <div
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '10px 0', cursor: 'pointer', fontWeight: t === tab ? 'bold' : 'normal'
              }}
            >{t}</div>
          ))}
        </nav>
        {/* Content */}
        <div style={{ flex: 1, paddingLeft: 24, minHeight: 500 }}>
          {tab === Tab.MyData && profile && (
            <form style={{ display: 'grid', gap: 24, maxWidth: 520 }}>
              <fieldset style={{ border: '1px solid #ddd', borderRadius: 6, padding: 16 }}>
                <legend style={{ fontWeight: 'bold', marginBottom: 12 }}>Мої дані</legend>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 16, rowGap: 12 }}>
                  <div>
                    <label>Прізвище*</label>
                    <input style={inputStyle} value={profile.last_name || ''} disabled />
                  </div>
                  <div>
                    <label>Ім'я*</label>
                    <input style={inputStyle} value={profile.first_name || ''} disabled />
                  </div>
                  <div>
                    <label>По-батькові*</label>
                    <input style={inputStyle} value={profile.middle_name || ''} disabled />
                  </div>
                  <div>
                    <label>Дата народження*</label>
                    <input style={inputStyle} type="date" value={profile.birth_date || ''} disabled />
                  </div>
                  <div>
                    <label>Спеціалізація*</label>
                    <Select
                      styles={selectStyles}
                      options={specializationOptions}
                      value={specializationOptions.find(s => s.value === profile.specialization) || null}
                      isDisabled
                    />
                  </div>
                  <div>
                    <label>Мови*</label>
                    <Select
                      isMulti
                      styles={selectStyles}
                      options={languageOptions}
                      value={languageOptions.filter(l => (profile.languages_spoken || []).includes(l.value))}
                      isDisabled
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Освіта</label>
                    <input style={inputStyle} value={profile.education || ''} disabled />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Про себе*</label>
                    <textarea style={{ ...inputStyle, resize: 'vertical' }} value={profile.about || ''} rows={3} disabled />
                  </div>
                </div>
              </fieldset>
              {/* E-mail */}
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
                <button type="button" onClick={handleEmailSave} style={buttonStyle}>
                  Зберегти e-mail
                </button>
              </fieldset>
              {/* Пароль */}
              <fieldset style={{ border: '1px solid #ddd', borderRadius: 6, padding: 16 }}>
                <legend style={{ fontWeight: 'bold', marginBottom: 12 }}>Змінити пароль</legend>
                <input
                  style={inputStyle}
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Новий пароль"
                />
                <input
                  style={inputStyle}
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Підтвердіть пароль"
                />
                {passwordError && <div style={{ color: 'red', marginTop: 8 }}>{passwordError}</div>}
                {passwordSuccess && <div style={{ color: 'green', marginTop: 8 }}>{passwordSuccess}</div>}
                <button type="button" onClick={handlePasswordSave} style={buttonStyle}>
                  Зберегти пароль
                </button>
              </fieldset>
            </form>
          )}
          {tab === Tab.Consults && (
            <div>
              <div style={{ marginBottom: 16 }}>
                {[ConsultsTab.Today, ConsultsTab.Upcoming, ConsultsTab.Past].map(rt => (
                  <button
                    key={rt}
                    onClick={() => setConsultTab(rt)}
                    style={{
                      ...buttonStyle,
                      backgroundColor: consultTab === rt ? '#0070f3' : '#eef6fc',
                      color: consultTab === rt ? '#fff' : '#0070f3'
                    }}>
                    {rt}
                  </button>
                ))}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'left' }}>Дата</th>
                    <th style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'left' }}>Час</th>
                    <th style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'left' }}>Пацієнт</th>
                    <th style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'left' }}>Дія</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredConsults.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: 16, color: '#888' }}>
                        Немає консультацій
                      </td>
                    </tr>
                  ) : (
                    filteredConsults.map(c => (
                      <tr key={c.id}>
                        <td style={{ padding: 8 }}>{new Date(c.date).toLocaleDateString()}</td>
                        <td style={{ padding: 8 }}>{new Date(c.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td style={{ padding: 8 }}>{c.patient.first_name} {c.patient.last_name}</td>
                        <td style={{ padding: 8 }}>{/* тут можуть бути дії */}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
