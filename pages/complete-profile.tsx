import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Select from 'react-select';

export default function CompleteProfile() {
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState('');

  // Спільні
  const [firstName, setFirstName] = useState('');

  // Пацієнт
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [weight, setWeight] = useState('');
  const [country, setCountry] = useState('');
  const [allergies, setAllergies] = useState<any[]>([]);
  const [chronicDiseases, setChronicDiseases] = useState('');

  // Лікар
  const [specialization, setSpecialization] = useState('');
  const [about, setAbout] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const router = useRouter();

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

  const inputStyle = {
    width: '100%', padding: '10px', fontSize: '1rem',
    border: '1px solid #ccc', borderRadius: '6px', marginBottom: '4px',
  };

  const buttonStyle = {
    width: '100%', padding: '10px', fontSize: '1rem',
    backgroundColor: '#0070f3', color: '#fff',
    border: 'none', borderRadius: '6px', cursor: 'pointer',
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    // Очищаємо попередні помилки
    const newErrors: typeof errors = {};
    if (!firstName) newErrors.firstName = 'Ім’я обов’язкове';
    if (role === 'patient') {
      if (!birthDate) newErrors.birthDate = 'Дата народження обов’язкова';
      if (!weight) newErrors.weight = 'Вага обов’язкова';
      if (!country) newErrors.country = 'Оберіть країну проживання';
      if (allergies.length === 0) newErrors.allergies = 'Оберіть хоча б один алерген';
    }
    if (role === 'doctor') {
      if (!specialization) newErrors.specialization = 'Оберіть спеціалізацію';
      if (!about) newErrors.about = 'Розкажіть про себе';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    // Підготовка оновлень
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

  return (
    <main style={{ maxWidth: '600px', margin: '2rem auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Заповнення профілю</h1>
      <form onSubmit={handleSubmit} noValidate>
        {/* Ім’я */}
        <label>Ім’я*:</label>
        <input
          type="text" value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          style={inputStyle}
        />
        {errors.firstName && <p style={{ color: 'red', margin: '0 0 1rem' }}>{errors.firstName}</p>}

        {role === 'patient' && (
          <>
            <label>Прізвище:</label>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} style={inputStyle} />

            <label>По-батькові:</label>
            <input type="text" value={middleName} onChange={(e) => setMiddleName(e.target.value)} style={inputStyle} />

            <label>Дата народження*:</label>
            <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} style={inputStyle} />
            {errors.birthDate && <p style={{ color: 'red', margin: '0 0 1rem' }}>{errors.birthDate}</p>}

            <label>Вага (кг)*:</label>
            <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} style={inputStyle} />
            {errors.weight && <p style={{ color: 'red', margin: '0 0 1rem' }}>{errors.weight}</p>}

            <label>Країна проживання*:</label>
            <Select
              options={countryOptions}
              value={countryOptions.find((o) => o.value === country)}
              onChange={(o) => setCountry(o?.value || '')}
              placeholder="Оберіть країну"
            />
            {errors.country && <p style={{ color: 'red', margin: '0 0 1rem' }}>{errors.country}</p>}

            <label>Алергени*:</label>
            <Select
              isMulti options={allergyOptions}
              value={allergies}
              onChange={(o) => setAllergies(o as any[])}
              placeholder="Оберіть алергени"
            />
            {errors.allergies && <p style={{ color: 'red', margin: '0 0 1rem' }}>{errors.allergies}</p>}

            <label>Хронічні хвороби:</label>
            <textarea
              value={chronicDiseases}
              onChange={(e) => setChronicDiseases(e.target.value)}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </>
        )}

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
            {errors.specialization && <p style={{ color: 'red', margin: '0 0 1rem' }}>{errors.specialization}</p>}

            <label>Про себе*:</label>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
            {errors.about && <p style={{ color: 'red', margin: '0 0 1rem' }}>{errors.about}</p>}

            <label>Фото:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              style={inputStyle}
            />
          </>
        )}

        <button type="submit" style={buttonStyle}>
          Зберегти
        </button>
      </form>
    </main>
  );
}
