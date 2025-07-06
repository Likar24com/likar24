import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';

export default function UpdatePassword() {
  const [newPassword, setNewPassword] = useState('');
  const router = useRouter();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      alert('❌ Помилка: ' + error.message);
    } else {
      alert('✅ Пароль оновлено!');
      router.push('/auth');
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
        🔑 Зміна паролю
      </h2>
      <form onSubmit={handleUpdate}>
        <label>Новий пароль:</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          style={inputStyle}
        />

        <button type="submit" style={buttonStyle}>
          Змінити пароль
        </button>
      </form>
    </main>
  );
}
