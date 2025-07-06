// pages/auth.tsx
import React, { useState } from 'react'
import { supabase }       from '../lib/supabase'
import { useRouter }      from 'next/router'

const EMAIL_REGEX = /^\S+@\S+\.\S+$/

const inputStyle = {
  width: '100%',
  padding: '10px',
  fontSize: '1rem',
  border: '1px solid #ccc',
  borderRadius: '6px',
  marginBottom: '0.5rem',
}
const buttonStyle = {
  width: '100%',
  padding: '10px',
  fontSize: '1rem',
  backgroundColor: '#0070f3',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  marginBottom: '1rem',
}

export default function AuthPage() {
  return (
    <main style={{ padding: '2rem' }}>
      <h1 style={{ textAlign: 'center' }}>Вхід та реєстрація</h1>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '2rem',
          marginTop: '2rem',
          maxWidth: '800px',
          marginInline: 'auto',
        }}
      >
        {/* ----- Увійти ----- */}
        <div style={{ flex: 1, borderRight: '1px solid #ddd', paddingRight: '1rem' }}>
          <h2>Увійти</h2>
          <LoginForm />
        </div>

        {/* ----- Зареєструватися ----- */}
        <div style={{ flex: 1, paddingLeft: '1rem' }}>
          <h2>Зареєструватися</h2>
          <RegisterForm />
        </div>
      </div>
    </main>
  )
}

function LoginForm() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string|null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!EMAIL_REGEX.test(email)) {
      setError('Будь ласка, введіть коректний e-mail')
      return
    }

    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (authError) {
      setError(authError.message)
    } else {
      router.push('/cabinet')
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <label>E-mail</label>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        style={inputStyle}
      />

      <label>Пароль</label>
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        style={inputStyle}
      />

      {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

      <button type="submit" disabled={loading} style={buttonStyle}>
        {loading ? 'Завантаження…' : 'Увійти'}
      </button>

      <p style={{ textAlign: 'center' }}>
        <a href="/reset-password">Забули пароль?</a>
      </p>
    </form>
  )
}

function RegisterForm() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string|null>(null)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // 1) Просте клієнтське валідування
    if (!EMAIL_REGEX.test(email)) {
      setError('Будь ласка, введіть коректний e-mail')
      return
    }
    if (password.length < 6) {
      setError('Пароль має бути щонайменше 6 символів')
      return
    }
    if (!role) {
      setError('Оберіть, будь ласка, роль')
      return
    }

    setLoading(true)
    // 2) Створюємо обліковий запис
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError || !data.user) {
      setLoading(false)
      setError(signUpError?.message ?? 'Невідома помилка реєстрації')
      return
    }

    // 3) Записуємо додаткові дані в таблицю users
    const userId = data.user.id
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        role,
        created_at: new Date().toISOString(),
      })
    setLoading(false)

    if (insertError) {
      setError('Не вдалося зберегти роль: ' + insertError.message)
      return
    }

    // 4) Переходимо до заповнення профілю
    if (role === 'patient') {
      router.push('/complete-patient')
    } else {
      router.push('/complete-doctor')
    }
  }

  return (
    <form onSubmit={handleRegister}>
      <label>E-mail</label>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        style={inputStyle}
      />

      <label>Пароль</label>
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        minLength={6}
        style={inputStyle}
      />

      <label>Роль</label>
      <select
        value={role}
        onChange={e => setRole(e.target.value)}
        required
        style={inputStyle}
      >
        <option value="">Оберіть роль</option>
        <option value="patient">Пацієнт</option>
        <option value="doctor">Лікар</option>
      </select>

      {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

      <button type="submit" disabled={loading} style={buttonStyle}>
        {loading ? 'Реєстрація…' : 'Зареєструватися'}
      </button>
    </form>
  )
}
