import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';

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
        <div style={{ flex: 1, borderRight: '1px solid #ccc', paddingRight: '1rem' }}>
          <h2>Увійти</h2>
          <LoginForm />
        </div>

        <div style={{ flex: 1, paddingLeft: '1rem' }}>
          <h2>Зареєструватися</h2>
          <RegisterForm />
        </div>
      </div>
    </main>
  );
}

function LoginForm() {
  return (
    <form>
      <label>Email:</label>
      <input type="email" name="email" required /><br /><br />

      <label>Пароль:</label>
      <input type="password" name="password" required /><br /><br />

      <button type="submit">Увійти</button>

      <p style={{ marginTop: '1rem' }}>
  <a href="/reset-password">Забули пароль?</a>
</p>

    </form>
  );
}


function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Реєстрація через Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error || !data.user) {
        alert('❌ Помилка: ' + (error?.message || 'Користувача не створено.'));
        setLoading(false);
        return;
      }

      const userId = data.user.id;

      // 2. Записуємо роль у таблицю users
   const { error: insertError } = await supabase.from('users').insert({
  id: userId,
  email: email, // ✅ додаємо email
  role: role,
  created_at: new Date().toISOString(),
  });


      if (insertError) {
        alert('❌ Не вдалося зберегти роль: ' + insertError.message);
        setLoading(false);
        return;
      }

      // 3. Перенаправлення
      router.push('/complete-profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <label>Email:</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      /><br /><br />

      <label>Пароль:</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      /><br /><br />

      <label>Роль:</label>
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        required
      >
        <option value="">Оберіть роль</option>
        <option value="patient">Пацієнт</option>
        <option value="doctor">Лікар</option>
      </select><br /><br />

      <button type="submit" disabled={loading}>
        {loading ? 'Реєстрація...' : 'Зареєструватися'}
      </button>
    </form>
  );
}
