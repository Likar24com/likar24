import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'
import Select from 'react-select'

export default function CompleteDoctor() {
  const [userId, setUserId] = useState<string | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [languagesSpoken, setLanguagesSpoken] = useState<any[]>([])
  const [photo, setPhoto] = useState<File | null>(null)
  const [education, setEducation] = useState('')
  const [about, setAbout] = useState('')
  const [diplomaFiles, setDiplomaFiles] = useState<File[]>([])
  const [diplomaPreviews, setDiplomaPreviews] = useState<string[]>([])
  const [errors, setErrors] = useState<{ [k: string]: string }>({})
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  const specializationOptions = [
    'Терапевт', 'Кардіолог', 'Педіатр', 'Дерматолог', 'Невролог',
    'Офтальмолог', 'Хірург', 'Гінеколог', 'Стоматолог', 'Психотерапевт'
  ].map(v => ({ value: v, label: v }))

  const languageOptions = [
    'Українська', 'English', 'Русский', 'Polski', 'Deutsch',
    'Français', 'Español', 'Italiano', '中文', 'العربية', 'Türkçe', 'Português', 'தமிழ்', 'हिन्दी'
  ].map(v => ({ value: v, label: v }))

  const inputStyle = {
    width: '100%', padding: 10, fontSize: '1rem',
    border: '1px solid #ccc', borderRadius: 6, marginBottom: 8, minHeight: 40
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
  const buttonStyle = {
    width: '100%', padding: 12, fontSize: '1rem',
    backgroundColor: '#0070f3', color: '#fff',
    border: 'none', borderRadius: 6, cursor: 'pointer', marginTop: 16
  }

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id) { router.push('/auth'); return }
      setUserId(user.id)
    })()
  }, [router])

  // Прев’ю дипломів
  const handleDiplomas = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setDiplomaFiles(files)
    setDiplomaPreviews(files.map(f => URL.createObjectURL(f)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: { [k: string]: string } = {}
    if (!firstName.trim()) errs.firstName = 'Ім’я обов’язкове'
    if (!lastName.trim()) errs.lastName = 'Прізвище обов’язкове'
    if (!middleName.trim()) errs.middleName = 'По-батькові обов’язкове'
    if (!birthDate) errs.birthDate = 'Дата народження обов’язкова'
    if (!specialization) errs.specialization = 'Спеціалізація обов’язкова'
    if (!languagesSpoken.length) errs.languagesSpoken = 'Оберіть мови'
    if (!photo) errs.photo = 'Додайте фото профілю'
    if (!about.trim()) errs.about = 'Розкажіть про себе'
    if (!diplomaFiles.length) errs.diplomaFiles = 'Завантажте дипломи'
    setErrors(errs)
    if (Object.keys(errs).length) return

    setLoading(true)
    const updates: any = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      middle_name: middleName.trim(),
      birth_date: birthDate,
      specialization,
      languages_spoken: languagesSpoken.map(l => l.value),
      education,
      about
    }

    // Фото профілю
    if (photo && userId) {
      const ext = photo.name.split('.').pop()
      const key = `avatars/${userId}.${ext}`
      const { data: photoData, error: photoError } = await supabase.storage.from('avatars').upload(key, photo, { upsert: true })
      if (!photoError) updates.photo = photoData?.path
    }

    // Дипломи
    const paths: string[] = []
    for (const file of diplomaFiles) {
      const ext = file.name.split('.').pop()
      const key = `diplomas/${userId}-${file.name}`
      const { data: diplData } = await supabase.storage.from('diplomas').upload(key, file, { upsert: true })
      if (diplData?.path) paths.push(diplData.path)
    }
    updates.diploma_photos = paths

await supabase.from('users').update(updates).eq('id', userId)
setLoading(false)
router.push('/cabinet-doctor')

  }

  return (
    <main style={{ maxWidth: 700, margin: '2rem auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 16 }}>Профіль лікаря</h1>
      <form onSubmit={handleSubmit} noValidate>
        <label>Прізвище*:</label>
        <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} style={inputStyle} />
        {errors.lastName && <div style={{ color: 'red', marginTop: -6 }}>{errors.lastName}</div>}

        <label>Ім’я*:</label>
        <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} style={inputStyle} />
        {errors.firstName && <div style={{ color: 'red', marginTop: -6 }}>{errors.firstName}</div>}

        <label>По-батькові*:</label>
        <input type="text" value={middleName} onChange={e => setMiddleName(e.target.value)} style={inputStyle} />
        {errors.middleName && <div style={{ color: 'red', marginTop: -6 }}>{errors.middleName}</div>}

        <label>Дата народження*:</label>
        <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} style={inputStyle} />
        {errors.birthDate && <div style={{ color: 'red', marginTop: -6 }}>{errors.birthDate}</div>}

        <label>Спеціалізація*:</label>
        <Select
          options={specializationOptions}
          styles={selectStyles}
          value={specializationOptions.find(o => o.value === specialization) || null}
          onChange={o => setSpecialization(o?.value || '')}
          placeholder="Оберіть"
        />
        {errors.specialization && <div style={{ color: 'red', marginTop: -6 }}>{errors.specialization}</div>}

        <label>Мови спілкування*:</label>
        <Select
          isMulti
          options={languageOptions}
          styles={selectStyles}
          value={languagesSpoken}
          onChange={o => setLanguagesSpoken(o as any[])}
          placeholder="Оберіть"
        />
        {errors.languagesSpoken && <div style={{ color: 'red', marginTop: -6 }}>{errors.languagesSpoken}</div>}

        <label>Фото профілю*:</label>
        <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] || null)} style={inputStyle} />
        {errors.photo && <div style={{ color: 'red', marginTop: -6 }}>{errors.photo}</div>}

        <label>Освіта:</label>
        <input type="text" value={education} onChange={e => setEducation(e.target.value)} placeholder="Університет, рік" style={inputStyle} />

        <label>Про себе*:</label>
        <textarea value={about} onChange={e => setAbout(e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
        {errors.about && <div style={{ color: 'red', marginTop: -6 }}>{errors.about}</div>}

        <label>Фото дипломів*:</label>
        <input type="file" multiple accept="image/*" onChange={handleDiplomas} style={inputStyle} />
        {errors.diplomaFiles && <div style={{ color: 'red', marginTop: -6 }}>{errors.diplomaFiles}</div>}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          {diplomaPreviews.map((src, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <img src={src} style={{ width: 150, borderRadius: 4 }} alt={`Диплом ${i + 1}`} />
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%,-50%) rotate(-30deg)',
                color: 'rgba(255,255,255,0.5)', fontSize: 24, fontWeight: 'bold', pointerEvents: 'none'
              }}>Likar24</div>
            </div>
          ))}
        </div>

        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? 'Збереження…' : 'Зберегти'}
        </button>
      </form>
    </main>
  )
}
