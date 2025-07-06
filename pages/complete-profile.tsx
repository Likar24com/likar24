import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Select from 'react-select';

export default function CompleteProfile() {
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState('');
  const [firstName, setFirstName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [about, setAbout] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const router = useRouter();

  const specializations = [
    'Терапевт',
    'Кардіолог',
    'Педіатр',
    'Дерматолог',
    'Невролог',
    'Офтальмолог',
    'Хірург',
    'Гінеколог',
    'Стоматолог',
    'Психотерапевт',
  ];

  const specializationOptions = specializations.map((spec) => ({
    value: spec,
    label: spec,
  }));

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

  useEffect(() => {
    const getUser = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const id = userData?.user?.id;
      if (!id) return;

      setUserId(id);

      const { data: userInfo } = await supabase
        .from('users')
        .select('role')
        .eq('id', id)
        .single();

      if (userInfo?.role) {
        setRole(userInfo.role);
      }
    };

    getUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const updates: any = {
      first_name: firstName,
    };

    if (role === 'doctor') {
      updates.specialization = specialization;
      updates.about = about;

      if (photo) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${userId}.${fileExt}`;
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(fileName, photo, { upsert: true });

        if (!error && data) {
          updates.photo = data.path;
        }
      }
    }

    await supabase.from('users').update(updates).eq('id', userId);

    alert('✅ Профіль оновлено!');
    router.push('/cabinet');
  };

  return (
    <main style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <h1 style={{ textAlign: 'center' }}>Заповнення профілю</h1>

      <form onSubmit={handleSubmit}>
        <label>Ім’я:</label>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          style={inputStyle}
        />

        {role === 'doctor' && (
          <>
            <label>Спеціалізація:</label>
            <div style={{ marginBottom: '1rem' }}>
              <Select
                options={specializationOptions}
                value={specializationOptions.find((o) => o.value === specialization)}
                onChange={(selected) => setSpecialization(selected?.value || '')}
                placeholder="Оберіть спеціалізацію..."
                isSearchable
              />
            </div>

            <label>Про себе:</label>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              rows={4}
              required
              style={{ ...inputStyle, resize: 'vertical' }}
            />

            <label>Фото:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              style={inputStyle}
            />
          </>
        )}

        <button type="submit" style={buttonStyle}>Зберегти</button>
      </form>
    </main>
  );
}
