import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'
import Select from 'react-select'
import { FiTrash2, FiRotateCcw, FiRotateCw, FiPlus, FiMinus } from 'react-icons/fi'
import Cropper from 'react-easy-crop'
import getCroppedImg from '../utils/cropImage'
import { specializationOptions, languageOptions, timezoneOptions } from '../lib/constants'

// --- DROPZONE COMPONENTS ---
type AvatarDropzoneProps = {
  onFile: (file: File) => void
  preview: string | null
  onRemove: () => void
  onPreview: (src: string) => void
}
function AvatarDropzone({ onFile, preview, onRemove, onPreview }: AvatarDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFile(e.target.files[0])
      e.target.value = ''
    }
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          width: 94, height: 112, border: '2px dashed #0070f3', borderRadius: 10, display: 'flex',
          alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#f6fbff', position: 'relative'
        }}>
        {!preview ? (
          <span style={{ color: '#0070f3', fontWeight: 600, fontSize: 36, userSelect: 'none' }}>+</span>
        ) : (
          <img src={preview} alt="avatar" style={{ width: 90, height: 110, borderRadius: 8, objectFit: 'cover' }}
            onClick={e => { e.stopPropagation(); onPreview(preview) }}
          />
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />
        {preview && (
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
      <span style={{ color: '#888' }}>Завантажте фото (4:5, .jpg/.png)</span>
    </div>
  )
}

type DropzoneProps = {
  onFiles: (files: File[]) => void
  previews: string[]
  onRemoveByIdx: (idx: number) => void
  onPreview: (src: string) => void
}
function Dropzone({ onFiles, previews, onRemoveByIdx, onPreview }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFiles(Array.from(e.target.files))
      e.target.value = ''
    }
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          width: 100, height: 70, border: '2px dashed #0070f3', borderRadius: 7,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          background: '#f6fbff', fontSize: 28, fontWeight: 700, userSelect: 'none'
        }}>
        +
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />
      </div>
      {previews.map((src, i) => (
        <div key={i} style={{ position: 'relative', width: 100, height: 70 }}>
          <img
            src={src}
            alt={`Диплом ${i + 1}`}
            style={{
              width: 100, height: 70, objectFit: 'cover', borderRadius: 5,
              border: '1px solid #ccc', cursor: 'zoom-in'
            }}
            onClick={() => onPreview(src)}
          />
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onRemoveByIdx(i); }}
            style={{
              position: 'absolute', top: 2, right: 2, background: '#fff', border: 'none', borderRadius: '50%',
              boxShadow: '0 1px 3px #999', cursor: 'pointer', padding: 2, zIndex: 3
            }}
            aria-label="Видалити диплом"
          >
            <FiTrash2 color="#d00" size={15} />
          </button>
        </div>
      ))}
    </div>
  )
}

// ---- MAIN FORM ----

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
  const [education, setEducation] = useState<string[]>([''])
  const [courses, setCourses] = useState<string[]>([''])
  const [about, setAbout] = useState('')
  const [diplomaFiles, setDiplomaFiles] = useState<File[]>([])
  const [diplomaPreviews, setDiplomaPreviews] = useState<string[]>([])
  const [errors, setErrors] = useState<{ [k: string]: string }>({})
  const [loading, setLoading] = useState(false)
  // --- Cropper state
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState<string>('')
  const [imageToShow, setImageToShow] = useState<string | null>(null)
  const router = useRouter()

  // --- avatar crop workflow
  const openCropper = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      setCropImageSrc(reader.result as string)
      setZoom(1)
      setRotation(0)
      setShowCropper(true)
    }
    reader.readAsDataURL(file)
  }
  const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }
  const handleCropSave = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return
    const croppedFile = await getCroppedImg(cropImageSrc, croppedAreaPixels, rotation)
    if (!croppedFile) return
    setPhoto(croppedFile)
    setPhotoPreview(URL.createObjectURL(croppedFile))
    setShowCropper(false)
    setCropImageSrc('')
  }

  // avatar preview effect
  useEffect(() => {
    if (photo) setPhotoPreview(URL.createObjectURL(photo))
    else setPhotoPreview(null)
    return () => { if (photoPreview) URL.revokeObjectURL(photoPreview) }
  }, [photo])

  // diploma preview effect
  useEffect(() => {
    setDiplomaPreviews(diplomaFiles.filter(Boolean).map(f => URL.createObjectURL(f)))
    return () => { diplomaFiles.forEach(f => f && URL.revokeObjectURL(f as any)) }
  }, [diplomaFiles])

  // handle dropzone diplomas
  const handleDiplomas = (files: File[]) => setDiplomaFiles(prev => [...prev, ...files])
  // handle avatar dropzone
  const handlePhotoFile = (file: File) => { if (file) openCropper(file) }
  // remove diploma
  const handleDiplomaRemove = (idx: number) => {
    setDiplomaFiles(files => files.filter((_, i) => i !== idx))
    setDiplomaPreviews(prev => prev.filter((_, i) => i !== idx))
  }
  // remove avatar
  const handlePhotoRemove = () => { setPhoto(null); setPhotoPreview(null) }
  // education/courses
  const handleEducationChange = (idx: number, val: string) => setEducation(ed => ed.map((e, i) => i === idx ? val : e))
  const handleAddEducation = () => setEducation(ed => [...ed, ''])
  const handleRemoveEducation = (idx: number) => setEducation(ed => ed.filter((_, i) => i !== idx))
  const handleCourseChange = (idx: number, val: string) => setCourses(c => c.map((e, i) => i === idx ? val : e))
  const handleAddCourse = () => setCourses(c => [...c, ''])
  const handleRemoveCourse = (idx: number) => setCourses(c => c.filter((_, i) => i !== idx))
  // full image preview
  const handleImageClick = (src: string) => setImageToShow(src)
  const handleCloseImage = () => setImageToShow(null)

  // fetch user
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id) { router.push('/auth'); return }
      setUserId(user.id)
      // Якщо треба підгрузити існуючі дані при редагуванні — додати тут select doctor_profiles
    })()
  }, [router])

  // submit
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
    if (!diplomaFiles.filter(Boolean).length) errs.diplomaFiles = 'Завантажте дипломи/сертифікати/ліцензії'
    setErrors(errs)
    if (Object.keys(errs).length) return

    setLoading(true)
    const updates: any = {
      user_id: userId, // ВАЖЛИВО! Ключ вашої таблиці
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      middle_name: middleName.trim(),
      birth_date: birthDate,
      specialization: specializations.map(s => s.value),
      languages_spoken: languagesSpoken.map(l => l.value),
      timezone: timezone.value,
      education: education.filter(e => e.trim()),
      courses: courses.filter(c => c.trim()),
      about,
    }

    // Фото профілю
    if (photo && userId) {
      const ext = photo.name.split('.').pop()
      const key = `avatars/${userId}.${ext}`
      const { data: photoData, error: photoError } = await supabase.storage.from('avatars').upload(key, photo, { upsert: true })
      if (!photoError) updates.photo = photoData?.path
    }

    // Дипломи/сертифікати/ліцензії
    const paths: string[] = []
    for (const file of diplomaFiles) {
      if (!file) continue
      const ext = file.name.split('.').pop()
      const key = `diplomas/${userId}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data: diplData, error: diplError } = await supabase.storage.from('diplomas').upload(key, file, { upsert: true })
      if (!diplError && diplData?.path) paths.push(diplData.path)
    }
    updates.diploma_photos = paths

    // --- Основне: upsert по user_id ---
    await supabase.from('doctor_profiles').upsert(updates, { onConflict: 'user_id' })

    setLoading(false)
    router.push('/cabinet-doctor')
  }

  // styles
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
  const addBtnStyle = {
    background: '#eef6fc', color: '#0070f3', border: '1px dashed #0070f3',
    padding: '6px 14px', borderRadius: 6, cursor: 'pointer', marginTop: 8, fontSize: 15
  }

  return (
    <main style={{ maxWidth: 700, margin: '2rem auto', fontFamily: 'Arial, sans-serif' }}>
      {/* CROP modal */}
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
                  zoom={zoom}
                  rotation={rotation}
                  aspect={4 / 5}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                  cropShape="rect"
                  restrictPosition={true}
                  minZoom={1}
                  maxZoom={2}
                />
              </div>
              {/* Кнопки керування */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setRotation(r => r - 90)}
                  style={{
                    background: '#eee', border: 'none', borderRadius: 6, padding: 5,
                    fontWeight: 700, fontSize: 18, cursor: 'pointer'
                  }}>
                  <FiRotateCcw size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.max(1, Math.round((z - 0.1) * 100) / 100))}
                  style={{
                    background: '#eee', border: 'none', borderRadius: 6, padding: 5,
                    fontWeight: 700, fontSize: 18, cursor: 'pointer'
                  }}>
                  <FiMinus size={20} />
                </button>
                <span style={{ minWidth: 30, textAlign: 'center', fontWeight: 600 }}>{zoom.toFixed(2)}x</span>
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.min(2, Math.round((z + 0.1) * 100) / 100))}
                  style={{
                    background: '#eee', border: 'none', borderRadius: 6, padding: 5,
                    fontWeight: 700, fontSize: 18, cursor: 'pointer'
                  }}>
                  <FiPlus size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation(r => r + 90)}
                  style={{
                    background: '#eee', border: 'none', borderRadius: 6, padding: 5,
                    fontWeight: 700, fontSize: 18, cursor: 'pointer'
                  }}>
                  <FiRotateCw size={20} />
                </button>
              </div>
              {/* Кнопки збереження */}
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

      {/* Модальне вікно збільшення фото */}
      {imageToShow && (
        <div onClick={handleCloseImage}
          style={{
            position: 'fixed', left: 0, top: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out'
          }}>
          <img src={imageToShow} style={{ maxWidth: '95vw', maxHeight: '90vh', borderRadius: 16, boxShadow: '0 8px 40px #222' }} alt="Зображення" />
        </div>
      )}

      {/* ФОРМА */}
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
        <AvatarDropzone
          onFile={handlePhotoFile}
          preview={photoPreview}
          onRemove={handlePhotoRemove}
          onPreview={handleImageClick}
        />
        {errors.photo && <div style={{ color: 'red', marginTop: -6 }}>{errors.photo}</div>}

        <label>Освіта:</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {education.map((ed, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="text"
                value={ed}
                onChange={e => handleEducationChange(idx, e.target.value)}
                placeholder=""
                style={{ ...inputStyle, marginBottom: 0 }}
              />
              {education.length > 1 && (
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
          <button type="button" style={addBtnStyle} onClick={handleAddEducation}>
            Додати ще одну освіту
          </button>
        </div>

        <label>Участь у курсах:</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {courses.map((course, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="text"
                value={course}
                onChange={e => handleCourseChange(idx, e.target.value)}
                placeholder=""
                style={{ ...inputStyle, marginBottom: 0 }}
              />
              {courses.length > 1 && (
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
          <button type="button" style={addBtnStyle} onClick={handleAddCourse}>
            Додати ще одну участь у курсах
          </button>
        </div>

        <label>Фото диплома / спеціалізації / сертифікату / ліцензії*:</label>
        <Dropzone
          onFiles={handleDiplomas}
          previews={diplomaPreviews}
          onRemoveByIdx={handleDiplomaRemove}
          onPreview={handleImageClick}
        />
        {errors.diplomaFiles && <div style={{ color: 'red', marginTop: -6 }}>{errors.diplomaFiles}</div>}

        <label>Про себе*:</label>
        <textarea value={about} onChange={e => setAbout(e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
        {errors.about && <div style={{ color: 'red', marginTop: -6 }}>{errors.about}</div>}

        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? 'Збереження…' : 'Зберегти'}
        </button>
      </form>
    </main>
  )
}
