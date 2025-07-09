import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'
import Select from 'react-select'
import { FiTrash2 } from 'react-icons/fi'
import { specializationOptions, languageOptions, timezoneOptions } from '../lib/constants'

export default function CompleteDoctor() {
  const [userId, setUserId] = useState<string | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [specializations, setSpecializations] = useState<any[]>([])
  const [languagesSpoken, setLanguagesSpoken] = useState<any[]>([])
  const [timezone, setTimezone] = useState<any>(null)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [education, setEducation] = useState('')
  const [about, setAbout] = useState('')
  const [diplomaFiles, setDiplomaFiles] = useState<File[]>([])
  const [diplomaPreviews, setDiplomaPreviews] = useState<string[]>([])
  const [errors, setErrors] = useState<{ [k: string]: string }>({})
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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

  // Аватар прев'ю
  useEffect(() => {
    if (photo) setPhotoPreview(URL.createObjectURL(photo))
    else setPhotoPreview(null)
    return () => { if (photoPreview) URL.revokeObjectURL(photoPreview) }
  }, [photo])

  // Дипломи прев'ю
  useEffect(() => {
    setDiplomaPreviews(diplomaFiles.map(f => URL.createObjectURL(f)))
    return () => { diplomaFiles.forEach(f => URL.revokeObjectURL(f as any)) }
  }, [diplomaFiles])

  // Додати дипломи
  const handleDiplomas = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setDiplomaFiles(prev => [...prev, ...files])
  }

  // Видалити диплом до сабміту
  const handleDiplomaRemove = (idx: number) => {
    setDiplomaFiles(files => files.filter((_, i) => i !== idx))
  }

  // Видалити аватар до сабміту
  const handlePhotoRemove = () => {
    setPhoto(null)
    setPhotoPreview(null)
  }

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: { [k: string]: string } = {}
    if (!firstName.trim()) errs.firstName = 'Ім’я обов’язкове'
    if (!lastName.trim()) errs.lastName = 'Прізвище обов’язкове'
    if (!middleName.trim()) errs.middleName = 'По-батькові обов’язкове'
    if (!birthDate) errs.birthDate = 'Дата народження обов’язкова'
    if (!specializations.length) errs.specializations = 'Оберіть спеціалізацію'
    if (!languagesSpoken.length) errs.languagesSpoken = 'Оберіть мови'
    if (!timezone) errs.timezone = 'Оберіть часовий пояс'
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
      specialization: specializations.map(s => s.value),
      languages_spoken: languagesSpoken.map(l => l.value),
      timezone: timezone.value,
      education,
      about,
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
      const key = `diplomas/${userId}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data: diplData, error: diplError } = await supabase.storage.from('diplomas').upload(key, file, { upsert: true })
      if (!diplError && diplData?.path) paths.push(diplData.path)
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

        <label>Часовий пояс*:</label>
        <Select
          options={timezoneOptions}
          styles={selectStyles}
          value={timezone}
          onChange={setTimezone}
          placeholder="Оберіть часовий пояс"
        />
        {errors.timezone && <div style={{ color: 'red', marginTop: -6 }}>{errors.timezone}</div>}

        <label>Спеціалізація*:</label>
        <Select
          isMulti
          options={specializationOptions}
          styles={selectStyles}
          value={specializations}
          onChange={o => setSpecializations(o as any[])}
          placeholder="Оберіть"
        />
        {errors.specializations && <div style={{ color: 'red', marginTop: -6 }}>{errors.specializations}</div>}

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          {photoPreview ? (
            <>
              <img src={photoPreview} style={{ width: 90, height: 110, borderRadius: 8, objectFit: 'cover', border: '1px solid #ccc' }} alt="avatar" />
              <button type="button" onClick={handlePhotoRemove} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <FiTrash2 size={22} color="#d00" />
              </button>
            </>
          ) : (
            <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] || null)} style={inputStyle} />
          )}
        </div>
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
              <img src={src} style={{ width: 150, borderRadius: 4, border: '1px solid #ccc' }} alt={`Диплом ${i + 1}`} />
              <button
                type="button"
                onClick={() => handleDiplomaRemove(i)}
                style={{
                  position: 'absolute', top: 2, right: 2, background: '#fff', border: 'none', borderRadius: '50%',
                  boxShadow: '0 1px 3px #999', cursor: 'pointer', padding: 3
                }}
                aria-label="Видалити диплом"
              >
                <FiTrash2 color="#d00" size={18} />
              </button>
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
