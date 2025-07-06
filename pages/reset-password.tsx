import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:3000/update-password', // замінити на продакшн-URL при деплої
    });

    if (error) {
      setMessage('❌ Помилка: ' + error.message);
    } else {
      setMessage('✅ Лист для скидання паролю надіслано!');
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    fontSize: '1rem',
    border: '1px solid #ccc',
    borderRadius: '6px',
    marginBottom: '1.5rem',
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

  return (
    <main style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>
        🔐 Відновлення паролю
      </h2>
      <form onSubmit={handleReset}>
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />

        <button type="submit" style={buttonStyle}>
          Надіслати інструкцію
        </button>
      </form>

      {message && (
        <p style={{ marginTop: '1.5rem', textAlign: 'center' }}>{message}</p>
      )}
    </main>
  );
}
