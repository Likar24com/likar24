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
  const [languagesSpoken, setLanguagesSpoken] = useState<any[]>([]);
  const [diplomaFiles, setDiplomaFiles] = useState<File[]>([]);
  const [diplomaPreviews, setDiplomaPreviews] = useState<string[]>([]);

  // Помилки
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const router = useRouter();

  // Опції для селектів
  const specializationOptions = [
    'Терапевт','Кардіолог','Педіатр','Дерматолог','Невролог',
    'Офтальмолог','Хірург','Гінеколог','Стоматолог','Психотерапевт',
  ].map(s => ({ value: s, label: s }));
  const countryOptions = [
    'Україна','Польща','Німеччина','Франція','Італія','Іспанія','США','Канада'
  ].map(c => ({ value: c, label: c }));
  const allergyOptions = [
    'Пилок','Медикаменти','Глютен','Горіхи','Молочні продукти','Морепродукти'
  ].map(a => ({ value: a, label: a }));
  const languageOptions = [
    'Українська','English','Русский','Polski','Deutsch',
    'Français','Español','Italiano','中文','العربية','Türkçe','Português',
    'தமிழ்','हिन्दी'
  ].map(l => ({ value: l, label: l }));

  // Стилі
  const inputStyle = {
    width: '100%', padding: '10px', fontSize: '1rem',
    border: '1px solid #ccc', borderRadius: '6px', marginBottom: '4px'
  };
  const buttonStyle = {
    width: '100%', padding: '10px', fontSize: '1rem',
    backgroundColor: '#0070f3', color: '#fff', border: 'none',
    borderRadius: '6px', cursor: 'pointer', marginTop: '1rem'
  };

  // Завантажуємо роль
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;
      setUserId(user.id);
      const { data } = await supabase
        .from('users').select('role').eq('id', user.id).single();
      if (data?.role) setRole(data.role);
    })();
  }, []);

  // Прев’ю фото дипломів
  const handleDiplomas = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setDiplomaFiles(files);
    setDiplomaPreviews(files.map(f => URL.createObjectURL(f)));
  };

  // Сабміт із валідацією
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const newErrors: typeof errors = {};

    if (!firstName) newErrors.firstName = 'Ім’я обов’язкове';

    if (role === 'patient') {
      if (!birthDate) newErrors.birthDate = 'Дата народження обов’язкова';
      if (!weight) newErrors.weight = 'Вага обов’язкова';
      if (!country) newErrors.country = 'Оберіть країну проживання';
      if (allergies.length === 0) newErrors.allergies = 'Оберіть алергени';
    }

    if (role === 'doctor') {
      if (!specialization) newErrors.specialization = 'Спеціалізація обов’язкова';
      if (!languagesSpoken.length) newErrors.languagesSpoken = 'Оберіть мови спілкування';
      if (!photo) newErrors.photo = 'Фото профілю обов’язкове';
      if (!about) newErrors.about = 'Розкажіть про себе';
      if (!diplomaFiles.length) newErrors.diplomaFiles = 'Завантажте фото дипломів';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    // Формуємо оновлення
    const updates: any = { first_name: firstName };
    if (role === 'patient') {
      updates.last_name = lastName;
      updates.middle_name = middleName;
      updates.birth_date = birthDate;
      updates.weight = parseFloat(weight);
      updates.country = country;
      updates.allergies = allergies.map(a => a.value);
      updates.chronic_diseases = chronicDiseases;
    }
    if (role === 'doctor') {
      updates.specialization = specialization;
      updates.languages_spoken = languagesSpoken.map(l => l.value);
      updates.about = about;

      // Завантажуємо фото профілю
      if (photo) {
        const ext = photo.name.split('.').pop();
        const name = `avatars/${userId}.${ext}`;
        const { data } = await supabase.storage.from('avatars').upload(name, photo, { upsert: true });
        updates.photo = data?.path;
      }

      // Завантажуємо дипломи
      if (diplomaFiles.length) {
        const paths: string[] = [];
        for (const file of diplomaFiles) {
          const ext = file.name.split('.').pop();
          const name = `diplomas/${userId}-${file.name}`;
          const { data } = await supabase.storage.from('diplomas').upload(name, file, { upsert: true });
          if (data?.path) paths.push(data.path);
        }
        updates.diploma_photos = paths;
      }
    }

    await supabase.from('users').update(updates).eq('id', userId);
    alert('✅ Профіль оновлено');
    router.push('/cabinet');
  };

  return (
    <main style={{ maxWidth: '600px', margin: '2rem auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Заповнення профілю</h1>
      <form onSubmit={handleSubmit} noValidate>
        <label>Ім’я*:</label>
        <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} style={inputStyle} />
        {errors.firstName && <p style={{ color:'red' }}>{errors.firstName}</p>}

        {role === 'patient' && ( 
          <> {/* Пацієнтські поля — аналогічно попередньому коду */} </>
