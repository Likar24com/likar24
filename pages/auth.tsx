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
        <div style={{ flex: 1, borderRight: '1px solid #ddd', paddingRight: '1rem' }}>
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
      <input type="email" name="email" required style={inputStyle} />

      <label>Пароль:</label>
      <input type="password" name="password" required style={inputStyle} />

      <button type="submit" style={buttonStyle}>Увійти</button>

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
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error || !data.user) {
        alert('❌ Помилка: ' + (error?.message || 'Користувача не створено.'));
        setLoading(false);
        return;
      }

      const userId = data.user.id;

      const { error: insertError } = await supabase.from('users').insert({
        id: userId,
        email,
        role,
        created_at: new Date().toISOString(),
      });

      if (insertError) {
        alert('❌ Не вдалося зберегти роль: ' + insertError.message);
        setLoading(false);
        return;
      }

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
