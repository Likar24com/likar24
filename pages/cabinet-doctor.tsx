import React, { useEffect, useRef, useState, ChangeEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'
import Select, { StylesConfig } from 'react-select'
import { FiTrash2, FiPlus } from 'react-icons/fi'
import { languageOptions, specializationOptions, timezoneOptions } from '../lib/constants'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: 10, fontSize: '1rem',
  border: '1px solid #ccc', borderRadius: 6, marginBottom: 8, minHeight: 40
}
const selectStyles: StylesConfig<any, true> = {
  control: (base) => ({
    ...base, ...inputStyle, minHeight: 40, boxShadow: 'none'
  }),
  menu: (base) => ({ ...base, zIndex: 999 })
}
const buttonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem', fontSize: '1rem', backgroundColor: '#0070f3', color: '#fff', border: 'none',
  borderRadius: 6, cursor: 'pointer', marginTop: 8, marginRight: 8, minWidth: 120
}
const logoutStyle = { ...buttonStyle, backgroundColor: '#e00', marginRight: 0 }

type UserProfile = {
  id: string
  email?: string
  last_name?: string
  first_name?: string
  middle_name?: string
  birth_date?: string
  timezone?: string
  specialization?: string[]
  languages_spoken?: string[]
  education?: string
  about?: string
  photo?: string
  diploma_photos?: string[] | string
}

type Appointment = {
  id: number
  date: string
  patient: { first_name: string; last_name: string }
}

enum Tab { MyData = 'Мої дані', Consults = 'Мої консультації', Finance = 'Мої фінанси', Schedule = 'Мій робочий графік' }
enum ConsultsTab { Today = 'Сьогодні', Upcoming = 'Заплановані', Past = 'Минули' }

// Dropzone для аватара
function AvatarDropzone({
  avatarPreview,
  onFile,
  onRemove
}: { avatarPreview: string, onFile: (file: File) => void, onRemove: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFile(e.target.files[0])
      e.target.value = ''
    }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 8 }}>
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          width: 94, height: 112, border: '2px dashed #0070f3', borderRadius: 10, display: 'flex',
          alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#f6fbff', position: 'relative'
        }}>
        {!avatarPreview ? (
          <span style={{ color: '#0070f3', fontWeight: 600, fontSize: 36, userSelect: 'none' }}>+</span>
        ) : (
          <img src={avatarPreview} alt="avatar" style={{ width: 90, height: 110, borderRadius: 8, objectFit: 'cover' }} />
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />
        {avatarPreview && (
          <button type="button" onClick={e => { e.stopPropagation(); onRemove(); }}
            style={{
              position: 'absolute', top: 0, right: 0, background: '#fff',
              border: 'none', borderRadius: '50%', boxShadow: '0 1px 3px #999',
              cursor: 'pointer', padding: 4, zIndex: 3
            }}>
            <FiTrash2 color="#d00" size={18} />
          </button>
        )}
      </div>
      <span style={{ color: '#888', fontSize: 13, marginTop: 4 }}>Завантажте фото (4:5)</span>
    </div>
  )
}

// Dropzone для дипломів
function DiplomasDropzone({
  previews,
  onFiles,
  onRemoveByIdx
}: { previews: string[], onFiles: (files: File[]) => void, onRemoveByIdx: (idx: number) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFiles(Array.from(e.target.files))
      e.target.value = ''
    }
  }
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          width: 110, height: 78, border: '2px dashed #0070f3', borderRadius: 10, display: 'flex',
          alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#eef6fc', fontSize: 28, fontWeight: 700, userSelect: 'none'
        }}>
        +
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />
      </div>
      {previews.map((src, i) => (
        <div key={i} style={{ position: 'relative' }}>
          <img src={src} alt={`Диплом ${i + 1}`} style={{ width: 110, height: 78, objectFit: 'cover', borderRadius: 10, border: '1px solid #ddd' }} />
          <button type="button"
            onClick={() => onRemoveByIdx(i)}
            style={{
              position: 'absolute', top: -8, right: -8, background: '#fff', border: 'none', borderRadius: '50%',
              boxShadow: '0 1px 3px #999', cursor: 'pointer', padding: 3
            }}>
            <FiTrash2 color="#d00" size={18} />
          </button>
        </div>
      ))}
    </div>
  )
}

export default function CabinetDoctor() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [fields, setFields] = useState<Partial<UserProfile>>({})
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [avatarKey, setAvatarKey] = useState<string>('')
  const [diplomas, setDiplomas] = useState<string[]>([])
  const [diplomaPreviews, setDiplomaPreviews] = useState<string[]>([])
  const [consults, setConsults] = useState<Appointment[]>([])
  const [tab, setTab] = useState<Tab>(Tab.MyData)
  const [consultTab, setConsultTab] = useState<ConsultsTab>(ConsultsTab.Today)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  // === Fetch profile & preview logic ===
  useEffect(() => {
    async function load() {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) { router.push('/auth'); return }
      setUser(user)
      setEmail(user.email || '')

      const { data: pr } = await supabase.from('users').select('*').eq('id', user.id).single()
      if (pr) {
        setProfile(pr)
        setFields({
          last_name: pr.last_name || '',
          first_name: pr.first_name || '',
          middle_name: pr.middle_name || '',
          birth_date: pr.birth_date || '',
          timezone: pr.timezone || '',
          specialization: Array.isArray(pr.specialization) ? pr.specialization : [],
          languages_spoken: Array.isArray(pr.languages_spoken) ? pr.languages_spoken : [],
          education: pr.education || '',
          about: pr.about || '',
        })
        if (pr.photo) {
          setAvatarKey(pr.photo)
          const { data } = supabase.storage.from('avatars').getPublicUrl(pr.photo)
          setAvatarPreview(data.publicUrl)
        } else {
          setAvatarPreview('')
          setAvatarKey('')
        }
        // Дипломи: підтримка і масиву і рядка
        if (pr.diploma_photos) {
          const diplomasArr = Array.isArray(pr.diploma_photos)
            ? pr.diploma_photos
            : typeof pr.diploma_photos === 'string' && pr.diploma_photos.length
              ? [pr.diploma_photos]
              : [];
          setDiplomas(diplomasArr)
        } else setDiplomas([])
      }
      // Консультації
      const { data: cons } = await supabase
        .from('appointments')
        .select('id,date,patient!inner(first_name,last_name)')
        .eq('doctor_id', user.id)
        .order('date', { ascending: true })
      const normalized = (cons || []).map((c: any) => ({
        ...c,
        patient: Array.isArray(c.patient) ? c.patient[0] : c.patient
      }))
      setConsults(normalized)
    }
    load()
  }, [router])

  // --- Дипломи: previews (publicUrls)
  useEffect(() => {
    async function generatePreviews() {
      const arr: string[] = []
      for (const key of diplomas) {
        const { data } = supabase.storage.from('diplomas').getPublicUrl(key)
        arr.push(data.publicUrl)
      }
      setDiplomaPreviews(arr)
    }
    if (diplomas.length) generatePreviews()
    else setDiplomaPreviews([])
  }, [diplomas])

  // --- Зберегти поле профілю
  const saveField = async (key: keyof UserProfile, value: any) => {
    setFields(prev => ({ ...prev, [key]: value }))
    if (!user) return
    await supabase.from('users').update({ [key]: value }).eq('id', user.id)
  }
  const handleSelect = (key: keyof UserProfile, value: any) => {
    if (Array.isArray(value)) saveField(key, value.map((v: any) => v.value))
    else saveField(key, value?.value || '')
  }
  const handleInput = (key: keyof UserProfile, value: any) => { saveField(key, value) }
  const handleDate = (value: string) => saveField('birth_date', value)

  // --- Аватар ---
  const handleAvatarFile = async (file: File) => {
    if (!user) return
    // Видаляємо старий аватар якщо є
    if (avatarKey) await supabase.storage.from('avatars').remove([avatarKey])
    // Завантажуємо новий
    const ext = file.name.split('.').pop()
    const key = `avatars/${user.id}.${ext}`
    await supabase.storage.from('avatars').upload(key, file, { upsert: true })
    await supabase.from('users').update({ photo: key }).eq('id', user.id)
    setAvatarKey(key)
    const { data } = supabase.storage.from('avatars').getPublicUrl(key)
    setAvatarPreview(data.publicUrl)
  }
  const handleAvatarRemove = async () => {
    if (!user || !avatarKey) return
    await supabase.storage.from('avatars').remove([avatarKey])
    await supabase.from('users').update({ photo: null }).eq('id', user.id)
    setAvatarKey('')
    setAvatarPreview('')
  }

  // --- Дипломи ---
  const handleDiplomaAdd = async (files: File[]) => {
    if (!user || !files.length) return
    const uploadedKeys: string[] = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const key = `diplomas/${user.id}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      await supabase.storage.from('diplomas').upload(key, file)
      uploadedKeys.push(key)
    }
    const allDiplomas = [...diplomas, ...uploadedKeys]
    await supabase.from('users').update({ diploma_photos: allDiplomas }).eq('id', user.id)
    setDiplomas(allDiplomas)
  }
  const handleDiplomaDelete = async (idx: number) => {
    if (!user) return
    if (window.confirm('Ви дійсно хочете видалити цей диплом?')) {
      const toDelete = diplomas[idx]
      await supabase.storage.from('diplomas').remove([toDelete])
      const newDiplomas = diplomas.filter((_, i) => i !== idx)
      await supabase.from('users').update({ diploma_photos: newDiplomas }).eq('id', user.id)
      setDiplomas(newDiplomas)
    }
  }

  // --- Email/Password ---
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

  // --- Consults filters ---
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

  // --- РЕНДЕР ---
  return (
    <div style={{ maxWidth: 1000, margin: '2rem auto', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>Кабінет лікаря</h1>
        <button onClick={handleLogout} style={logoutStyle}>Вихід</button>
      </div>
      <div style={{ display: 'flex' }}>
        {/* Sidebar */}
        <nav style={{ width: 220, borderRight: '1px solid #ddd', paddingRight: 16 }}>
          {[Tab.MyData, Tab.Consults, Tab.Finance, Tab.Schedule].map(t => (
            <div
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '10px 0', cursor: 'pointer', fontWeight: t === tab ? 'bold' : 'normal'
              }}
            >{t}</div>
          ))}
        </nav>
        <div style={{ flex: 1, paddingLeft: 24, minHeight: 500 }}>
          {/* --- Мої дані --- */}
          {tab === Tab.MyData && profile && (
            <form style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
              width: '100%',
              borderRadius: 12,
              border: '1px solid #dde6f2',
              padding: 24
            }}>
              {/* Row: Avatar + ПІБ */}
              <div style={{ display: 'flex', gap: 24 }}>
                <AvatarDropzone
                  avatarPreview={avatarPreview}
                  onFile={handleAvatarFile}
                  onRemove={handleAvatarRemove}
                />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label>Прізвище*</label>
                  <input
                    style={{ ...inputStyle, marginBottom: 0 }}
                    value={fields.last_name || ''}
                    onChange={e => handleInput('last_name', e.target.value)}
                  />
                  <label>Ім’я*</label>
                  <input
                    style={{ ...inputStyle, marginBottom: 0 }}
                    value={fields.first_name || ''}
                    onChange={e => handleInput('first_name', e.target.value)}
                  />
                  <label>По-батькові*</label>
                  <input
                    style={{ ...inputStyle, marginBottom: 0 }}
                    value={fields.middle_name || ''}
                    onChange={e => handleInput('middle_name', e.target.value)}
                  />
                </div>
              </div>
              {/* Дата нар + час. пояс */}
              <div style={{ display: 'flex', gap: 24 }}>
                <div style={{ flex: 1 }}>
                  <label>Дата народження*</label>
                  <input
                    type="date"
                    style={{ ...inputStyle }}
                    value={fields.birth_date || ''}
                    onChange={e => handleDate(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Часовий пояс*</label>
                  <Select
                    options={timezoneOptions}
                    styles={selectStyles}
                    value={timezoneOptions.find(tz => tz.value === fields.timezone) || null}
                    onChange={o => handleSelect('timezone', o)}
                    placeholder="Оберіть часовий пояс"
                  />
                </div>
              </div>
              {/* Решта полів одним стовпчиком */}
              <div>
                <label>Спеціалізації*</label>
                <Select
                  isMulti
                  options={specializationOptions}
                  styles={selectStyles}
                  value={specializationOptions.filter(o => (fields.specialization || []).includes(o.value))}
                  onChange={v => handleSelect('specialization', v)}
                  placeholder="Оберіть спеціалізації"
                />
                <label style={{ marginTop: 16 }}>Мови*</label>
                <Select
                  isMulti
                  options={languageOptions}
                  styles={selectStyles}
                  value={languageOptions.filter(o => (fields.languages_spoken || []).includes(o.value))}
                  onChange={v => handleSelect('languages_spoken', v)}
                  placeholder="Оберіть мови"
                />
                <label style={{ marginTop: 16 }}>Освіта</label>
                <input
                  style={{ ...inputStyle }}
                  value={fields.education || ''}
                  onChange={e => handleInput('education', e.target.value)}
                />
                <label style={{ marginTop: 16 }}>Про себе*</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 80 }}
                  value={fields.about || ''}
                  onChange={e => handleInput('about', e.target.value)}
                />
              </div>
              {/* Дипломи */}
              <div>
                <label>Дипломи</label>
                <DiplomasDropzone
                  previews={diplomaPreviews}
                  onFiles={handleDiplomaAdd}
                  onRemoveByIdx={handleDiplomaDelete}
                />
              </div>
            </form>
          )}

          {/* --- E-mail --- */}
          {tab === Tab.MyData && (
            <fieldset style={{
              border: '1px solid #ddd', borderRadius: 6, padding: 16, marginTop: 32,
              width: '100%'
            }}>
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
          )}

          {/* --- Пароль --- */}
          {tab === Tab.MyData && (
            <fieldset style={{
              border: '1px solid #ddd', borderRadius: 6, padding: 16, marginTop: 16,
              width: '100%'
            }}>
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
          )}

          {/* --- Мої консультації --- */}
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
                        <td style={{ padding: 8 }}>{c.patient?.first_name} {c.patient?.last_name}</td>
                        <td style={{ padding: 8 }}>{/* дії */}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* --- Мої фінанси --- */}
          {tab === Tab.Finance && (
            <div style={{ padding: 24 }}>
              <h2 style={{ marginBottom: 20 }}>Мої фінанси</h2>
              <p>Фінансовий функціонал буде доступний найближчим часом.</p>
            </div>
          )}

          {/* --- Мій робочий графік --- */}
          {tab === Tab.Schedule && (
            <div style={{ padding: 24 }}>
              <h2 style={{ marginBottom: 20 }}>Мій робочий графік</h2>
              <p>Функціонал для планування графіку у розробці.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
