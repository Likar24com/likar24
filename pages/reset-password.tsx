import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:3000/update-password',
    });

    if (error) {
      setMessage('❌ Помилка: ' + error.message);
    } else {
      setMessage('✅ Лист для скидання паролю надіслано!');
    }
  };

  return (
    <main style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <h2>Відновлення паролю</h2>
      <form onSubmit={handleReset}>
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        /><br /><br />

        <button type="submit">Надіслати інструкцію</button>
      </form>
      {message && <p style={{ marginTop: '1rem' }}>{message}</p>}
    </main>
  );
}
