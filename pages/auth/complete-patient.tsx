import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'
import Select from 'react-select'
import { countryOptions, allergyOptions } from '../lib/constants'

export default function CompletePatient() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [weight, setWeight] = useState('')
  const [country, setCountry] = useState('')
  const [allergies, setAllergies] = useState<string[]>([])
  const [chronicDiseases, setChronic] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const inputStyle = {
    width: '100%', padding: 10, fontSize: '1rem',
    border: '1px solid #ccc', borderRadius: 6, marginBottom: 8,
  }
  const selectStyles = {
    control: (base: any) => ({ ...base, ...inputStyle, minHeight: 'auto' }),
    menu: (base: any) => ({ ...base, zIndex: 999 }),
  }
  const buttonStyle = {
    width: '100%', padding: 10, fontSize: '1rem',
    backgroundColor: '#0070f3', color: '#fff',
    border: 'none', borderRadius: 6,
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1, marginTop: 12,
  }

  useEffect(() => {
    (async () => {
      const { data: { user }, error: userErr } = await supabase.auth.getUser()
      if (userErr || !user) {
        router.push('/auth'); return
      }
      setUserId(user.id)

      // Перевіряємо, чи профіль вже заповнено
      const { data: pr } = await supabase
        .from('patient_profiles')
        .select('first_name')
        .eq('user_id', user.id)
        .single()

      if (pr?.first_name) {
        router.replace('/cabinet-patient/profile')
      }
    })()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}

    if (!firstName) errs.firstName = 'Ім’я обов’язкове'
    if (!birthDate) errs.birthDate = 'Дата народження обов’язкова'
    if (!weight) errs.weight = 'Вага обов’язкова'
    if (!country) errs.country = 'Оберіть країну'
    if (!allergies.length) errs.allergies = 'Оберіть хоча б один алерген'

    setErrors(errs)
    if (Object.keys(errs).length) return

    setLoading(true)
    try {
      const updates = {
        first_name: firstName,
        last_name: lastName || null,
        middle_name: middleName || null,
        birth_date: birthDate,
        weight: weight ? parseFloat(weight) : null,
        country,
        allergies,
        chronic_diseases: chronicDiseases || null,
      }

      // Якщо профіль існує, оновлюємо, інакше створюємо
      const { data: exist } = await supabase
        .from('patient_profiles')
        .select('user_id')
        .eq('user_id', userId)
        .single()

      let res
      if (exist) {
        res = await supabase
          .from('patient_profiles')
          .update(updates)
          .eq('user_id', userId)
      } else {
        res = await supabase
          .from('patient_profiles')
          .insert([{ ...updates, user_id: userId }])
      }

      if (res.error) throw res.error
      router.push('/cabinet-patient/profile')
    } catch (err: any) {
      console.error(err)
      alert('❌ Не вдалося зберегти: ' + (err.message || err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 16 }}>Профіль пацієнта</h1>
      <form onSubmit={handleSubmit} noValidate>
        <label>Ім’я*:</label>
        <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} style={inputStyle} />
        {errors.firstName && <p style={{ color: 'red' }}>{errors.firstName}</p>}

        <label>Прізвище:</label>
        <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} style={inputStyle} />

        <label>По-батькові:</label>
        <input type="text" value={middleName} onChange={e => setMiddleName(e.target.value)} style={inputStyle} />

        <label>Дата народження*:</label>
        <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} style={inputStyle} />
        {errors.birthDate && <p style={{ color: 'red' }}>{errors.birthDate}</p>}

        <label>Вага (кг)*:</label>
        <input type="number" value={weight} onChange={e => setWeight(e.target.value)} style={inputStyle} />
        {errors.weight && <p style={{ color: 'red' }}>{errors.weight}</p>}

        <label>Країна*:</label>
        <Select
          options={countryOptions}
          value={countryOptions.find(o => o.value === country) || null}
          onChange={o => setCountry((o as any)?.value || '')}
          placeholder="Оберіть країну"
          styles={selectStyles}
        />
        {errors.country && <p style={{ color: 'red' }}>{errors.country}</p>}

        <label>Алергени*:</label>
        <Select
          isMulti
          options={allergyOptions}
          value={allergyOptions.filter(o => allergies.includes(o.value))}
          onChange={o => setAllergies((o as any[]).map(x => x.value))}
          placeholder="Оберіть алергени"
          styles={selectStyles}
        />
        {errors.allergies && <p style={{ color: 'red' }}>{errors.allergies}</p>}

        <label>Хронічні хвороби:</label>
        <textarea value={chronicDiseases} onChange={e => setChronic(e.target.value)} rows={4}
          style={{ ...inputStyle, resize: 'vertical' }} />

        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? 'Збереження…' : 'Зберегти'}
        </button>
      </form>
    </main>
  )
}
