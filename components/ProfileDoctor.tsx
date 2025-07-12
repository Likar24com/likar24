import React, { useEffect, useRef, useState, ChangeEvent } from 'react'
import { supabase } from '../lib/supabase'
import Select, { StylesConfig } from 'react-select'
import { FiTrash2, FiPlus, FiMinus, FiRotateCcw, FiRotateCw } from 'react-icons/fi'
import { languageOptions, specializationOptions, timezoneOptions } from '../lib/constants'
import Cropper from 'react-easy-crop'
import getCroppedImg from '../utils/cropImage'

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

type DoctorProfile = {
  user_id: string
  last_name?: string
  first_name?: string
  middle_name?: string
  birth_date?: string
  timezone?: string
  specialization?: string[]
  languages_spoken?: string[]
  education?: string[]
  about?: string
  courses?: string[]
  photo?: string
  diploma_photos?: string[] | string
}

function AvatarDropzone({
  avatarPreview,
  onFile,
  onPreview,
}: {
  avatarPreview: string,
  onFile: (file: File) => void,
  onPreview: (src: string) => void,
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFile(e.target.files[0])
      e.target.value = ''
    }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 8 }}>
      <div
        onClick={() => avatarPreview && onPreview(avatarPreview)}
        style={{
          width: 140, height: 175, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: avatarPreview ? 'zoom-in' : 'pointer',
          background: '#f6fbff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          marginBottom: 12, overflow: 'hidden',
        }}>
        {!avatarPreview ? (
          <span style={{ color: '#0070f3', fontWeight: 600, fontSize: 48, userSelect: 'none' }}>+</span>
        ) : (
          <img
            src={avatarPreview}
            alt="avatar"
            style={{
              width: 140, height: 175, objectFit: 'cover', borderRadius: 10,
            }}
          />
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        style={{
          background: '#0070f3', color: '#fff', border: 'none', borderRadius: 8,
          padding: '12px 24px', fontWeight: 600, fontSize: 18, cursor: 'pointer', minWidth: 120,
        }}
      >
        Змінити фото
      </button>
    </div>
  )
}

function DiplomasDropzone({
  previews,
  onFiles,
  onRemoveByIdx,
  onPreview,
}: { previews: string[], onFiles: (files: File[]) => void, onRemoveByIdx: (idx: number) => void, onPreview: (src: string) => void }) {
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
          <img
            src={src}
            alt={`Диплом ${i + 1}`}
            style={{ width: 110, height: 78, objectFit: 'cover', borderRadius: 10, border: '1px solid #ddd', cursor: 'zoom-in' }}
            onClick={() => onPreview(src)}
          />
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

export default function ProfileDoctor() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<DoctorProfile | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [avatarKey, setAvatarKey] = useState<string>('')
  const [diplomas, setDiplomas] = useState<string[]>([])
  const [diplomaPreviews, setDiplomaPreviews] = useState<string[]>([])
  const [imageToShow, setImageToShow] = useState<string | null>(null)
  // Cropper
  const [showCropper, setShowCropper] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState<string>('')
  const [cropZoom, setCropZoom] = useState(1)
  const [cropRotation, setCropRotation] = useState(0)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  // Email/password для USERS
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)
      setEmail(user.email || '')
      // doctor_profiles
      const { data: pr } = await supabase.from('doctor_profiles').select('*').eq('user_id', user.id).single()
      if (pr) {
        setProfile({
          ...pr,
          education: Array.isArray(pr.education) ? pr.education : pr.education ? [pr.education] : [''],
          courses: Array.isArray(pr.courses) ? pr.courses : pr.courses ? [pr.courses] : [''],
          specialization: Array.isArray(pr.specialization) ? pr.specialization : [],
          languages_spoken: Array.isArray(pr.languages_spoken) ? pr.languages_spoken : [],
        })
        if (pr.photo) {
          setAvatarKey(pr.photo)
          const { data } = supabase.storage.from('avatars').getPublicUrl(pr.photo)
          setAvatarPreview(data.publicUrl)
        }
        if (pr.diploma_photos) {
          const diplomasArr = Array.isArray(pr.diploma_photos)
            ? pr.diploma_photos
            : typeof pr.diploma_photos === 'string' && pr.diploma_photos.length
              ? [pr.diploma_photos]
              : []
          setDiplomas(diplomasArr)
        }
      }
    }
    load()
  }, [])

  // Дипломи: previews (publicUrls)
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

  // --- Оновити поле профілю doctor_profiles ---
  const saveField = async (key: keyof DoctorProfile, value: any) => {
    if (!user) return
    const updateData = { [key]: value }
    setProfile(prev => prev ? { ...prev, ...updateData } : prev)
    await supabase.from('doctor_profiles').update(updateData).eq('user_id', user.id)
  }

  // --- Освіта/Курси автозбереження ---
  const handleEducationChange = (idx: number, val: string) => {
    const education = (profile?.education || []).map((e, i) => i === idx ? val : e)
    setProfile(pr => pr ? { ...pr, education } : pr)
    saveField('education', education)
  }
  const handleAddEducation = () => {
    const education = [...(profile?.education || []), '']
    setProfile(pr => pr ? { ...pr, education } : pr)
    saveField('education', education)
  }
  const handleRemoveEducation = (idx: number) => {
    const education = (profile?.education || []).filter((_, i) => i !== idx)
    setProfile(pr => pr ? { ...pr, education } : pr)
    saveField('education', education)
  }
  const handleCourseChange = (idx: number, val: string) => {
    const courses = (profile?.courses || []).map((e, i) => i === idx ? val : e)
    setProfile(pr => pr ? { ...pr, courses } : pr)
    saveField('courses', courses)
  }
  const handleAddCourse = () => {
    const courses = [...(profile?.courses || []), '']
    setProfile(pr => pr ? { ...pr, courses } : pr)
    saveField('courses', courses)
  }
  const handleRemoveCourse = (idx: number) => {
    const courses = (profile?.courses || []).filter((_, i) => i !== idx)
    setProfile(pr => pr ? { ...pr, courses } : pr)
    saveField('courses', courses)
  }

  // --- Select, Input, Date ---
  const handleSelect = (key: keyof DoctorProfile, value: any) => {
    if (Array.isArray(value)) saveField(key, value.map((v: any) => v.value))
    else saveField(key, value?.value || '')
  }
  const handleInput = (key: keyof DoctorProfile, value: any) => { saveField(key, value) }
  const handleDate = (value: string) => saveField('birth_date', value)

  // --- Аватар ---
  const handleAvatarPreview = (src: string) => { setImageToShow(src) }
  const handleAvatarFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      setCropImageSrc(reader.result as string)
      setCropZoom(1)
      setCropRotation(0)
      setShowCropper(true)
    }
    reader.readAsDataURL(file)
  }
  // Cropper
  const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => setCroppedAreaPixels(croppedAreaPixels)
  const handleCropSave = async () => {
    if (!cropImageSrc || !croppedAreaPixels || !user) return
    const croppedFile = await getCroppedImg(cropImageSrc, croppedAreaPixels, cropRotation)
    if (!croppedFile) return

    // 1. Видалити старий файл з storage, якщо він був
    if (avatarKey) {
      await supabase.storage.from('avatars').remove([avatarKey])
    }
    // 2. Завантажити новий
    const ext = croppedFile.name.split('.').pop()
    const key = `avatars/${user.id}_${Date.now()}.${ext}`
    await supabase.storage.from('avatars').upload(key, croppedFile, { upsert: true })
    await supabase.from('doctor_profiles').update({ photo: key }).eq('user_id', user.id)
    setAvatarKey(key)
    const { data } = supabase.storage.from('avatars').getPublicUrl(key)
    setAvatarPreview(data.publicUrl)
    setProfile(pr => pr ? { ...pr, photo: key } : pr)
    setShowCropper(false)
    setCropImageSrc('')
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
    await supabase.from('doctor_profiles').update({ diploma_photos: allDiplomas }).eq('user_id', user.id)
    setDiplomas(allDiplomas)
    setProfile(pr => pr ? { ...pr, diploma_photos: allDiplomas } : pr)
  }
  const handleDiplomaDelete = async (idx: number) => {
    if (!user) return
    if (window.confirm('Ви дійсно хочете видалити цей диплом?')) {
      const toDelete = diplomas[idx]
      await supabase.storage.from('diplomas').remove([toDelete])
      const newDiplomas = diplomas.filter((_, i) => i !== idx)
      await supabase.from('doctor_profiles').update({ diploma_photos: newDiplomas }).eq('user_id', user.id)
      setDiplomas(newDiplomas)
      setProfile(pr => pr ? { ...pr, diploma_photos: newDiplomas } : pr)
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

  if (!profile) return <div style={{ padding: 50, textAlign: 'center' }}>Завантаження…</div>
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 24,
      borderRadius: 12,
      border: '1px solid #dde6f2',
      padding: 24,
      minHeight: 540
    }}>
      {/* --- Cropper modal --- */}
      {showCropper && (
        <div style={{
          position: 'fixed', left: 0, top: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
              <div style={{ width: 320, height: 320, position: 'relative' }}>
                <Cropper
                  image={cropImageSrc || ''}
                  crop={crop}
                  zoom={cropZoom}
                  rotation={cropRotation}
                  aspect={4 / 5}
                  onCropChange={setCrop}
                  onZoomChange={setCropZoom}
                  onRotationChange={setCropRotation}
                  onCropComplete={onCropComplete}
                  cropShape="rect"
                  restrictPosition={true}
                  minZoom={1}
                  maxZoom={2}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 10 }}>
                <button type="button" onClick={() => setCropRotation(r => r - 90)}
                  style={{ background: '#eee', border: 'none', borderRadius: 6, padding: 5, fontWeight: 700, fontSize: 18, cursor: 'pointer' }}>
                  <FiRotateCcw size={20} />
                </button>
                <button type="button" onClick={() => setCropZoom(z => Math.max(1, Math.round((z - 0.1) * 100) / 100))}
                  style={{ background: '#eee', border: 'none', borderRadius: 6, padding: 5, fontWeight: 700, fontSize: 18, cursor: 'pointer' }}>
                  <FiMinus size={20} />
                </button>
                <span style={{ minWidth: 30, textAlign: 'center', fontWeight: 600 }}>{cropZoom.toFixed(2)}x</span>
                <button type="button" onClick={() => setCropZoom(z => Math.min(2, Math.round((z + 0.1) * 100) / 100))}
                  style={{ background: '#eee', border: 'none', borderRadius: 6, padding: 5, fontWeight: 700, fontSize: 18, cursor: 'pointer' }}>
                  <FiPlus size={20} />
                </button>
                <button type="button" onClick={() => setCropRotation(r => r + 90)}
                  style={{ background: '#eee', border: 'none', borderRadius: 6, padding: 5, fontWeight: 700, fontSize: 18, cursor: 'pointer' }}>
                  <FiRotateCw size={20} />
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 18 }}>
                <button
                  onClick={handleCropSave}
                  style={{
                    background: '#e0fbe2', color: '#1a7f29', border: 'none',
                    borderRadius: 5, padding: '8px 28px', fontWeight: 700, fontSize: 18, cursor: 'pointer'
                  }}
                >Обрізати та зберегти</button>
                <button
                  onClick={() => setShowCropper(false)}
                  style={{
                    background: '#ffeaea', color: '#d00', border: 'none',
                    borderRadius: 5, padding: '8px 28px', fontWeight: 700, fontSize: 18, cursor: 'pointer'
                  }}
                >Скасувати</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal image view --- */}
      {imageToShow && (
        <div onClick={() => setImageToShow(null)}
          style={{
            position: 'fixed', left: 0, top: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out'
          }}>
          <img src={imageToShow} style={{ maxWidth: '95vw', maxHeight: '90vh', borderRadius: 16, boxShadow: '0 8px 40px #222' }} alt="Зображення" />
        </div>
      )}

      <form style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
        {/* Row: Avatar + ПІБ */}
        <div style={{ display: 'flex', gap: 24 }}>
          <div>
            <AvatarDropzone
              avatarPreview={avatarPreview}
              onFile={handleAvatarFile}
              onPreview={handleAvatarPreview}
            />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label>Прізвище*</label>
            <input
              style={{ ...inputStyle, marginBottom: 0 }}
              value={profile.last_name || ''}
              onChange={e => handleInput('last_name', e.target.value)}
            />
            <label>Ім’я*</label>
            <input
              style={{ ...inputStyle, marginBottom: 0 }}
              value={profile.first_name || ''}
              onChange={e => handleInput('first_name', e.target.value)}
            />
            <label>По-батькові*</label>
            <input
              style={{ ...inputStyle, marginBottom: 0 }}
              value={profile.middle_name || ''}
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
              value={profile.birth_date || ''}
              onChange={e => handleDate(e.target.value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Часовий пояс*</label>
            <Select
              options={timezoneOptions}
              styles={selectStyles}
              value={timezoneOptions.find(tz => tz.value === profile.timezone) || null}
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
            value={specializationOptions.filter(o => (profile.specialization || []).includes(o.value))}
            onChange={v => handleSelect('specialization', v)}
            placeholder="Оберіть спеціалізації"
          />
          <label style={{ marginTop: 16 }}>Мови*</label>
          <Select
            isMulti
            options={languageOptions}
            styles={selectStyles}
            value={languageOptions.filter(o => (profile.languages_spoken || []).includes(o.value))}
            onChange={v => handleSelect('languages_spoken', v)}
            placeholder="Оберіть мови"
          />
          {/* ---- Освіта ---- */}
          <label style={{ marginTop: 16 }}>Освіта</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {(profile.education || []).map((ed, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="text"
                  value={ed}
                  onChange={e => handleEducationChange(idx, e.target.value)}
                  placeholder=""
                  style={{ ...inputStyle, marginBottom: 0 }}
                />
                {(profile.education?.length || 0) > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveEducation(idx)}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                    title="Видалити"
                  >
                    <FiTrash2 color="#d00" size={20} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" style={{
              background: '#eef6fc', color: '#0070f3', border: '1px dashed #0070f3',
              padding: '6px 14px', borderRadius: 6, cursor: 'pointer', marginTop: 8, fontSize: 15
            }} onClick={handleAddEducation}>
              Додати ще одну освіту
            </button>
          </div>
          {/* ---- Курси ---- */}
          <label style={{ marginTop: 16 }}>Участь у курсах</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {(profile.courses || []).map((course, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="text"
                  value={course}
                  onChange={e => handleCourseChange(idx, e.target.value)}
                  placeholder=""
                  style={{ ...inputStyle, marginBottom: 0 }}
                />
                {(profile.courses?.length || 0) > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCourse(idx)}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                    title="Видалити"
                  >
                    <FiTrash2 color="#d00" size={20} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" style={{
              background: '#eef6fc', color: '#0070f3', border: '1px dashed #0070f3',
              padding: '6px 14px', borderRadius: 6, cursor: 'pointer', marginTop: 8, fontSize: 15
            }} onClick={handleAddCourse}>
              Додати ще одну участь у курсах
            </button>
          </div>
          {/* ---- Дипломи ---- */}
          <label style={{ marginTop: 16 }}>Фото диплома / спеціалізації / сертифікату / ліцензії*</label>
          <DiplomasDropzone
            previews={diplomaPreviews}
            onFiles={handleDiplomaAdd}
            onRemoveByIdx={handleDiplomaDelete}
            onPreview={setImageToShow}
          />
        </div>
        {/* ---- Про себе ---- */}
        <label style={{ marginTop: 16 }}>Про себе*</label>
        <textarea
          style={{ ...inputStyle, minHeight: 80 }}
          value={profile.about || ''}
          onChange={e => handleInput('about', e.target.value)}
        />
      </form>

      {/* --- Зміна e-mail --- */}
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
        <button type="button" onClick={handleEmailSave} style={{
          ...inputStyle,
          background: '#0070f3',
          color: '#fff',
          minHeight: 36,
          marginBottom: 0
        }}>
          Зберегти e-mail
        </button>
      </fieldset>

      {/* --- Зміна пароля --- */}
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
        <button type="button" onClick={handlePasswordSave} style={{
          ...inputStyle,
          background: '#0070f3',
          color: '#fff',
          minHeight: 36,
          marginBottom: 0
        }}>
          Зберегти пароль
        </button>
      </fieldset>
    </div>
  )
}
