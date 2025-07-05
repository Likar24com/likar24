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

  return (
    <main style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <h2>Введіть новий пароль</h2>
      <form onSubmit={handleUpdate}>
        <label>Новий пароль:</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        /><br /><br />

        <button type="submit">Змінити пароль</button>
      </form>
    </main>
  );
}
