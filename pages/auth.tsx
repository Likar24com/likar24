import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';

const inputStyle = {
  width: '100%',
  padding: '10px',
  fontSize: '1rem',
  border: '1px solid #ccc',
  borderRadius: '6px',
  marginBottom: '1rem',
};

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
};

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
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      alert('❌ Помилка входу: ' + error.message);
    } else {
      router.push('/cabinet');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <label>Email:</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        style={inputStyle}
      />

      <label>Пароль:</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        style={inputStyle}
      />

      <button type="submit" disabled={loading} style={buttonStyle}>
        {loading ? 'Завантаження...' : 'Увійти'}
      </button>

      <p style={{ textAlign: 'center' }}>
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

    // 1) Створюємо обліковий запис
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error || !data.user) {
      setLoading(false);
      alert('❌ Помилка реєстрації: ' + (error?.message || 'Спробуйте ще раз.'));
      return;
    }
    const userId = data.user.id;

    // 2) Записуємо роль в users
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        role,
        created_at: new Date().toISOString(),
      });
    setLoading(false);

    if (insertError) {
      alert('❌ Не вдалося зберегти роль: ' + insertError.message);
      return;
    }

    // 3) Перенаправлення на відповідну сторінку
    if (role === 'patient') {
      router.push('/complete-patient');
    } else if (role === 'doctor') {
      router.push('/complete-doctor');
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
        style={inputStyle}
      />

      <label>Пароль:</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        style={inputStyle}
      />

      <label>Роль:</label>
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        required
        style={inputStyle}
      >
        <option value="">Оберіть роль</option>
        <option value="patient">Пацієнт</option>
        <option value="doctor">Лікар</option>
      </select>

      <button type="submit" disabled={loading} style={buttonStyle}>
        {loading ? 'Реєстрація...' : 'Зареєструватися'}
      </button>
    </form>
  );
}
