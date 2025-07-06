import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Select from 'react-select';

export default function CompleteProfile() {
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState('');

  // Спільні
  const [firstName, setFirstName] = useState('');

  // Поля пацієнта
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [weight, setWeight] = useState('');
  const [country, setCountry] = useState('');
  const [allergies, setAllergies] = useState<any[]>([]);
  const [chronicDiseases, setChronicDiseases] = useState('');

  // Поля лікаря
  const [specialization, setSpecialization] = useState('');
  const [about, setAbout] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);

  const router = useRouter();

  // Опції для селектів
  const specializationOptions = [
    'Терапевт','Кардіолог','Педіатр','Дерматолог','Невролог',
    'Офтальмолог','Хірург','Гінеколог','Стоматолог','Психотерапевт',
  ].map((s) => ({ value: s, label: s }));

  const countryOptions = [
    'Україна','Польща','Німеччина','Франція','Італія','Іспанія','США','Канада',
  ].map((c) => ({ value: c, label: c }));

  const allergyOptions = [
    'Пилок','Медикаменти','Глютен','Горіхи','Молочні продукти','Морепродукти',
  ].map((a) => ({ value: a, label: a }));

  // Стилі
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

  // Завантажуємо роль користувача
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;
      setUserId(user.id);
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      if (data?.role) setRole(data.role);
    })();
  }, []);

  // Обробник форми з валідацією
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (role === 'patient') {
      if (!country) {
        alert('❗ Будь ласка, оберіть країну проживання.');
        return;
      }
      if (allergies.length === 0) {
        alert('❗ Будь ласка, оберіть хоча б один алерген.');
        return;
      }
    }

    const updates: any = { first_name: firstName };

    if (role === 'patient') {
      updates.last_name = lastName;
      updates.middle_name = middleName;
      updates.birth_date = birthDate;
      updates.weight = parseFloat(weight);
      updates.country = country;
      updates.allergies = allergies.map((a) => a.value);
      updates.chronic_diseases = chronicDiseases;
    }

    if (role === 'doctor') {
      updates.specialization = specialization;
      updates.about = about;
      if (photo) {
        const ext = photo.name.split('.').pop();
        const fileName = `${userId}.${ext}`;
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(fileName, photo, { upsert: true });
        if (!error) updates.photo = data.path;
      }
    }

    await supabase.from('users').update(updates).eq('id', userId);
    alert('✅ Профіль оновлено!');
    router.push('/cabinet');
  };

  // Логіка дизейблу кнопки
  const isSaveDisabled = role === 'patient'
    ? !firstName || !birthDate || !weight || !country || allergies.length === 0
    : role === 'doctor'
    ? !firstName || !specialization || !about
    : true;

  return (
    <main style={{ maxWidth: '600px', margin: '2rem auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Заповнення профілю</h1>
      <form onSubmit={handleSubmit}>
        {/* Ім’я */}
        <label>Ім’я*:</label>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          style={inputStyle}
        />

        {/* Поля пацієнта */}
        {role === 'patient' && (
          <>
            <label>Прізвище:</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              style={inputStyle}
            />

            <label>По-батькові:</label>
            <input
              type="text"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              style={inputStyle}
            />

            <label>Дата народження*:</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              required
              style={inputStyle}
            />

            <label>Вага (кг)*:</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
              style={inputStyle}
            />

            <label>Країна проживання*:</label>
            <Select
              options={countryOptions}
              value={countryOptions.find((o) => o.value === country)}
              onChange={(o) => setCountry(o?.value || '')}
              placeholder="Оберіть країну"
            />
            <div style={{ height: '1rem' }} />

            <label>Алергени*:</label>
            <Select
              isMulti
              options={allergyOptions}
              value={allergies}
              onChange={(o) => setAllergies(o as any[])}
              placeholder="Оберіть алергени"
            />
            <div style={{ height: '1rem' }} />

            <label>Хронічні хвороби:</label>
            <textarea
              value={chronicDiseases}
              onChange={(e) => setChronicDiseases(e.target.value)}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </>
        )}

        {/* Поля лікаря */}
        {role === 'doctor' && (
          <>
            <label>Спеціалізація*:</label>
            <Select
              options={specializationOptions}
              value={specializationOptions.find((o) => o.value === specialization)}
              onChange={(o) => setSpecialization(o?.value || '')}
              placeholder="Оберіть спеціалізацію"
              isSearchable
            />
            <div style={{ height: '1rem' }} />

            <label>Про себе*:</label>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              rows={4}
              required
              style={{ ...inputStyle, resize: 'vertical' }}
            />
            <div style={{ height: '1rem' }} />

            <label>Фото:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              style={inputStyle}
            />
          </>
        )}

        <button type="submit" style={buttonStyle} disabled={isSaveDisabled}>
          Зберегти
        </button>
      </form>
    </main>
  );
}
