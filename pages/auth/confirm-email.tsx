import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

export default function ConfirmEmailPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string>('')
  const [resent, setResent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  // Витягуємо email із sessionStorage (заповнюється при реєстрації)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('pending_email') || ''
      setEmail(stored)
    }
  }, [])

  // Перевіряємо підтвердження email (polling)
  useEffect(() => {
    let interval: any
    if (email) {
      interval = setInterval(async () => {
        setChecking(true)
        const { data, error } = await supabase.auth.getUser()
        setChecking(false)
        if (error) return
        if (data?.user && (data.user.email_confirmed_at || data.user.confirmed_at)) {
          // Очищаємо pending_email
          sessionStorage.removeItem('pending_email')

          // --- Додаємо редірект за роллю ---
          const { data: userRow } = await supabase
            .from('users')
            .select('role')
            .eq('id', data.user.id)
            .single()

          if (userRow?.role === 'doctor') router.replace('/complete-doctor')
          else                            router.replace('/complete-patient')
        }
      }, 3500)
    }
    return () => clearInterval(interval)
  }, [email, router])

  // Повторна відправка листа
  const resendEmail = async () => {
    setError(null)
    setResent(false)
    if (!email) {
      setError('Email невідомий. Перезавантажте сторінку.')
      return
    }
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) setError(error.message)
    else setResent(true)
  }

  return (
    <main style={{ maxWidth: 430, margin: '80px auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 18 }}>Підтвердіть e-mail</h1>
      <div style={{
        background: '#f6f7fa',
        border: '1px solid #e3e5ea',
        borderRadius: 8,
        padding: 24,
        fontSize: 16,
        textAlign: 'center',
      }}>
        <div style={{ marginBottom: 16 }}>
          На <b>{email}</b> надіслано лист для підтвердження.
        </div>
        <div style={{ marginBottom: 16 }}>
          Будь ласка, перевірте пошту (в т.ч. “Спам” та “Промоакції”).
        </div>
        <div style={{ marginBottom: 22, color: '#888', fontSize: 15 }}>
          Після підтвердження e-mail ця сторінка оновиться автоматично.
        </div>
        <button
          style={{
            padding: '9px 18px',
            fontSize: '1rem',
            backgroundColor: resent ? '#2ecc40' : '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            marginBottom: 8,
            opacity: checking ? 0.7 : 1,
          }}
          onClick={resendEmail}
          disabled={resent || checking}
        >
          {resent ? 'Лист надіслано ще раз' : 'Надіслати лист повторно'}
        </button>
        {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
        {checking && (
          <div style={{ marginTop: 16, color: '#888', fontSize: 15 }}>
            Перевіряємо підтвердження…
          </div>
        )}
      </div>
    </main>
  )
}
