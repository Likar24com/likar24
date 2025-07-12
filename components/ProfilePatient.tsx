import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import Select from 'react-select'
import { countryOptions, allergyOptions } from '../lib/constants'

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

const inputStyle: React.CSSProperties = {
  width: '100%', padding: 10, fontSize: '1rem',
  border: '1px solid #ccc', borderRadius: 6, marginBottom: 8, minHeight: 40,
}
const selectStyles = {
  control: (base: any) => ({
    ...base, ...inputStyle, minHeight: 40, boxShadow: 'none'
  }),
  menu: (base: any) => ({ ...base, zIndex: 999 }),
}

function isEmailValid(email: string) {
  // Базова перевірка, але Supabase додатково перевіряє на сервері
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
}

export default function ProfilePatient() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  // Form fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [weight, setWeight] = useState('')
  const [country, setCountry] = useState<any>(null)
  const [allergies, setAllergies] = useState<any[]>([])
  const [chronicDiseases, setChronicDiseases] = useState('')

  // Loading & errors
  const [autoSaveErr, setAutoSaveErr] = useState('')

  // Email/password
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Завантажити дані профілю
  useEffect(() => {
    async function load() {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) { router.push('/auth'); return }
      setUser(user)
      setEmail(user.email || '')

      // Завантажити профіль з patient_profiles
      const { data: pr } = await supabase.from('patient_profiles').select('*').eq('user_id', user.id).single()
      if (pr) {
        setProfile(pr)
        setFirstName(pr.first_name || '')
        setLastName(pr.last_name || '')
        setMiddleName(pr.middle_name || '')
        setBirthDate(pr.birth_date || '')
        setWeight(pr.weight ? String(pr.weight) : '')
        setCountry(countryOptions.find(c => c.value === pr.country) || null)
        setAllergies(allergyOptions.filter(a => pr.allergies?.includes(a.value)))
        setChronicDiseases(pr.chronic_diseases || '')
      }
    }
    load()
  }, [router])

  // Дебаунс автозбереження
  const debouncedSave = useCallback(
    (() => {
      let timeout: ReturnType<typeof setTimeout>
      return (update: any) => {
        clearTimeout(timeout)
        timeout = setTimeout(async () => {
          setAutoSaveErr('')
          if (!user) return
          const updates = {
            first_name: firstName,
            last_name: lastName,
            middle_name: middleName,
            birth_date: birthDate,
            weight: weight ? parseFloat(weight) : null,
            country: country?.value || null,
            allergies: allergies.map((a: any) => a.value),
            chronic_diseases: chronicDiseases,
            ...update,
          }
          const { error } = await supabase.from('patient_profiles').update(updates).eq('user_id', user.id)
          if (error) setAutoSaveErr('❌ ' + error.message)
        }, 500)
      }
    })()
  , [user, firstName, lastName, middleName, birthDate, weight, country, allergies, chronicDiseases])

  // Автоматичне збереження при зміні полів профілю
  useEffect(() => {
    if (!profile) return
    debouncedSave({})
    // eslint-disable-next-line
  }, [firstName, lastName, middleName, birthDate, weight, country, allergies, chronicDiseases])

  // Оновити email
  const handleEmailSave = async () => {
    setEmailError('')
    setEmailSuccess('')
    if (!email || !isEmailValid(email)) {
      setEmailError('Введіть коректний e-mail у форматі user@example.com')
      return
    }
    if (!user) return
    setEmailLoading(true)
    const { error } = await supabase.auth.updateUser({ email })
    setEmailLoading(false)
    if (error) setEmailError('❌ ' + (error.message || 'Email address is invalid'))
    else setEmailSuccess('E-mail оновлено')
  }

  // Оновити пароль
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
    if (newPassword.length < 6) {
      setPasswordError('Пароль має містити мінімум 6 символів')
      return
    }
    setPasswordLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordLoading(false)
    if (error) setPasswordError('❌ ' + error.message)
    else {
      setPasswordSuccess('Пароль оновлено')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  if (!profile) return <div style={{ padding: 50, textAlign: 'center' }}>Завантаження…</div>
  return (
    <form style={{ display: 'grid', gap: 28, maxWidth: 650, margin: '0 auto' }}>
      {/* --- Основні дані --- */}
      <fieldset style={{ border: '1px solid #ddd', borderRadius: 6, padding: 16 }}>
        <legend style={{ fontWeight: 'bold', marginBottom: 12 }}>Мої дані</legend>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label>Ім'я*</label>
            <input style={inputStyle} value={firstName} onChange={e => setFirstName(e.target.value)} onBlur={() => debouncedSave({})} />
          </div>
          <div>
            <label>Прізвище</label>
            <input style={inputStyle} value={lastName} onChange={e => setLastName(e.target.value)} onBlur={() => debouncedSave({})} />
          </div>
          <div>
            <label>По-батькові</label>
            <input style={inputStyle} value={middleName} onChange={e => setMiddleName(e.target.value)} onBlur={() => debouncedSave({})} />
          </div>
          <div>
            <label>Дата народження*</label>
            <input style={inputStyle} type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} onBlur={() => debouncedSave({})} />
          </div>
          <div>
            <label>Вага (кг)*</label>
            <input style={inputStyle} type="number" value={weight} onChange={e => setWeight(e.target.value)} onBlur={() => debouncedSave({})} />
          </div>
          <div>
            <label>Країна*</label>
            <Select styles={selectStyles} options={countryOptions} value={country}
              onChange={o => { setCountry(o); debouncedSave({ country: o?.value }) }} placeholder="Оберіть країну" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Алергени*</label>
            <Select styles={selectStyles} isMulti options={allergyOptions} value={allergies}
              onChange={o => { setAllergies(o as any[]); debouncedSave({ allergies: (o as any[]).map(a => a.value) }) }} placeholder="Оберіть алергени" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Хронічні хвороби</label>
            <textarea style={{ ...inputStyle, resize: 'vertical' }} value={chronicDiseases}
              onChange={e => setChronicDiseases(e.target.value)} onBlur={() => debouncedSave({})} rows={3} />
          </div>
        </div>
        {autoSaveErr && <div style={{ color: 'red', marginTop: 8 }}>{autoSaveErr}</div>}
      </fieldset>

      {/* --- Email --- */}
      <fieldset style={{ border: '1px solid #ddd', borderRadius: 6, padding: 16 }}>
        <legend style={{ fontWeight: 'bold', marginBottom: 12 }}>Змінити e-mail</legend>
        <input
          style={inputStyle}
          type="email"
          value={email}
          onChange={e => {
            setEmail(e.target.value);
            setEmailError('');
            setEmailSuccess('');
          }}
          placeholder="E-mail"
          autoComplete="off"
        />
        <div style={{ fontSize: 13, color: '#888', margin: '4px 0 10px 0' }}>
          Використовуйте реальний e-mail, наприклад, @gmail.com, @outlook.com
        </div>
        {emailError && (
          <div style={{ color: 'red', marginTop: 8, display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: 30, lineHeight: 1, marginRight: 8 }}>❌</span>
            {emailError}
          </div>
        )}
        {emailSuccess && (
          <div style={{ color: 'green', marginTop: 8, display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: 28, marginRight: 8 }}>✔️</span>
            {emailSuccess}
          </div>
        )}
        <button
          type="button"
          onClick={handleEmailSave}
          style={{ ...inputStyle, ...{ background: '#0070f3', color: '#fff', cursor: 'pointer', minWidth: 120 } }}
          disabled={emailLoading}
        >
          {emailLoading ? 'Збереження…' : 'Зберегти e-mail'}
        </button>
      </fieldset>

      {/* --- Пароль --- */}
      <fieldset style={{ border: '1px solid #ddd', borderRadius: 6, padding: 16 }}>
        <legend style={{ fontWeight: 'bold', marginBottom: 12 }}>Змінити пароль</legend>
        <input style={inputStyle} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Новий пароль" />
        <input style={inputStyle} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Підтвердіть пароль" />
        {passwordError && <div style={{ color: 'red', marginTop: 8 }}>{passwordError}</div>}
        {passwordSuccess && <div style={{ color: 'green', marginTop: 8 }}>{passwordSuccess}</div>}
        <button type="button" onClick={handlePasswordSave} style={{ ...inputStyle, ...{ background: '#0070f3', color: '#fff', cursor: 'pointer', minWidth: 120 } }} disabled={passwordLoading}>
          {passwordLoading ? 'Збереження…' : 'Зберегти пароль'}
        </button>
      </fieldset>
    </form>
  )
}
