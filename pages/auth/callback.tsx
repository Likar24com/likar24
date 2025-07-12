// pages/auth/callback.tsx
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handleCallback() {
      // Збираємо токени з URL фрагмента (хеш)
      const hash = window.location.hash
      const params = new URLSearchParams(hash.substring(1))
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')
      const type = params.get('type') // "signup" або "magiclink" або "recovery"

      if (!access_token || !refresh_token) {
        setError('Відсутні токени доступу. Спробуйте зайти ще раз.')
        setLoading(false)
        return
      }

      // Логуємо користувача вручну (setSession)
      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      })
      if (error) {
        setError('Не вдалося завершити логін. ' + error.message)
        setLoading(false)
        return
      }

      // Далі перевіряємо роль користувача для редіректу
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) {
        setError('Користувача не знайдено.')
        setLoading(false)
        return
      }

      // Тепер визначаємо роль (з таблиці users)
      const { data: userRow } = await supabase
        .from('users')
        .select('role')
        .eq('id', userData.user.id)
        .single()

      if (!userRow || !userRow.role) {
        setError('Не вдалося визначити роль користувача.')
        setLoading(false)
        return
      }

      // --- Редіректи ---
      if (type === 'signup' || type === 'magiclink') {
        // Після підтвердження — одразу на завершення профілю
        if (userRow.role === 'doctor') {
          router.replace('/complete-doctor')
        } else {
          router.replace('/complete-patient')
        }
      } else {
        // Якщо recovery або просто логін — у кабінет
        if (userRow.role === 'doctor') {
          router.replace('/cabinet-doctor')
        } else {
          router.replace('/cabinet-patient')
        }
      }
      setLoading(false)
    }

    // Викликаємо, коли сторінка змонтована (тільки на клієнті)
    if (typeof window !== 'undefined') {
      handleCallback()
    }
  }, [router])

  return (
    <main style={{ padding: 60, textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h1>Авторизація…</h1>
      {loading && <div>Зачекайте, виконується авторизація…</div>}
      {error && (
        <div style={{ color: 'red', marginTop: 24 }}>{error}</div>
      )}
    </main>
  )
}
