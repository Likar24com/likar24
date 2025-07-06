import React, { useEffect, useState } from 'react';
import { supabase }    from '../lib/supabase';
import { useRouter }   from 'next/router';
import Select          from 'react-select';

export default function CompleteDoctor() {
  const [userId, setUserId] = useState<string | null>(null);

  // Дані форми
  const [firstName, setFirstName]             = useState('');
  const [lastName, setLastName]               = useState('');
  const [middleName, setMiddleName]           = useState('');
  const [birthDate, setBirthDate]             = useState('');
  const [specializations, setSpecializations] = useState<any[]>([]);
  const [languagesSpoken, setLanguagesSpoken] = useState<any[]>([]);
  const [photo, setPhoto]                     = useState<File | null>(null);
  const [education, setEducation]             = useState('');
  const [about, setAbout]                     = useState('');
  const [diplomaFiles, setDiplomaFiles]       = useState<File[]>([]);

  // Публічні URL після upload
  const [photoPreview, setPhotoPreview]       = useState<string>('');
  const [diplomaUrls, setDiplomaUrls]         = useState<string[]>([]);

  const [errors, setErrors]                   = useState<Record<string,string>>({});
  const router = useRouter();

  // Опції для селектів
  const specializationOptions = [
    'Терапевт','Кардіолог','Педіатр','Дерматолог','Невролог',
    'Офтальмолог','Хірург','Гінеколог','Стоматолог','Психотерапевт'
  ].map(v => ({ value: v, label: v }));

  const languageOptions = [
    'Українська','English','Русский','Polski','Deutsch',
    'Français','Español','Italiano','中文','العربية','Türkçe','Português','தமிழ்','हिन्दी'
  ].map(v => ({ value: v, label: v }));

  const inputStyle = {
    width: '100%', padding: 10, fontSize: '1rem',
    border: '1px solid #ccc', borderRadius: 6, marginBottom: 8,
  };
  const buttonStyle = {
    width: '100%', padding: 12, fontSize: '1rem',
    backgroundColor: '#0070f3', color: '#fff',
    border: 'none', borderRadius: 6, cursor: 'pointer', marginTop: 16,
  };

  // Отримуємо поточного user
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) setUserId(user.id);
    })();
  }, []);

  // Обробляємо вибір дипломів
  const handleDiplomas = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDiplomaFiles(Array.from(e.target.files || []));
    setDiplomaUrls([]);  // очистимо попередні
  };

  // Подача форми
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1) Валідація
    const errs: Record<string,string> = {};
    if (!lastName)     errs.lastName     = 'Прізвище обов’язкове';
    if (!firstName)    errs.firstName    = 'Ім’я обов’язкове';
    if (!middleName)   errs.middleName   = 'По-батькові обов’язкове';
    if (!birthDate)    errs.birthDate    = 'Дата народження обов’язкова';
    if (!specializations.length)
                       errs.specializations = 'Оберіть щонайменше одну спеціальність';
    if (!languagesSpoken.length)
                       errs.languagesSpoken = 'Оберіть щонайменше одну мову';
    if (!photo)        errs.photo        = 'Додайте фото профілю';
    if (!about)        errs.about        = 'Поле «Про себе» обов’язкове';
    if (!diplomaFiles.length)
                       errs.diplomaFiles = 'Завантажте хоча б один диплом';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    // 2) Готуємо payload
    const updates: any = {
      last_name: lastName,
      first_name: firstName,
      middle_name: middleName,
      birth_date: birthDate,
      specialization: specializations.map(s => s.value),
      languages_spoken: languagesSpoken.map(l => l.value),
      education,
      about,
    };

    // 3) Upload аватарки
    if (photo && userId) {
      const ext = photo.name.split('.').pop();
      const key = `avatars/${userId}.${ext}`;
      const { data: aData, error: aErr } = await supabase
        .storage
        .from('avatars')
        .upload(key, photo, { upsert: true });
      if (aErr) {
        setErrors(prev => ({ ...prev, photo: aErr.message }));
        return;
      }
      updates.photo = aData.path;
      const { data: { publicUrl } } = supabase
        .storage.from('avatars')
        .getPublicUrl(aData.path);
      setPhotoPreview(publicUrl);
    }

    // 4) Upload дипломів (з санітизацією імен)
    if (diplomaFiles.length && userId) {
      const paths: string[] = [];
      for (const file of diplomaFiles) {
        const ext = file.name.split('.').pop();
        // Санітизуємо baseName
        const base = file.name
          .toLowerCase()
          .replace(/[^a-z0-9\-_.]/g, '-')  // латиниця, цифри, '-', '_', '.'
          .replace(/-+/g, '-')             // дублікати '-'
          .replace(/^\-|\-$/g, '');        // обрізаємо крайні '-'
        const key = `diplomas/${userId}-${base}.${ext}`;
        const { data: dData, error: dErr } = await supabase
          .storage.from('diplomas')
          .upload(key, file, { upsert: true });
        if (dErr) {
          setErrors(prev => ({ ...prev, diplomaFiles: dErr.message }));
          return;
        }
        paths.push(dData.path);
      }
      updates.diploma_photos = paths;
      // Отримуємо publicUrl для кожного
      const urls = paths.map(p =>
        supabase.storage.from('diplomas').getPublicUrl(p).data.publicUrl
      );
      setDiplomaUrls(urls);
    }

    // 5) Оновлюємо запис у users
    const { error: uErr } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);
    if (uErr) {
      alert('Не вдалося оновити профіль: ' + uErr.message);
      return;
    }

    // 6) Переходимо в кабінет
    router.push('/cabinet');
  };

  return (
    <main style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '1rem' }}>Профіль лікаря</h1>
      <form onSubmit={handleSubmit} noValidate>
        <label>Прізвище*:</label>
        <input value={lastName}
               onChange={e => setLastName(e.target.value)}
               style={inputStyle}/>
        {errors.lastName && <p style={{ color: 'red' }}>{errors.lastName}</p>}

        <label>Ім’я*:</label>
        <input value={firstName}
               onChange={e => setFirstName(e.target.value)}
               style={inputStyle}/>
        {errors.firstName && <p style={{ color: 'red' }}>{errors.firstName}</p>}

        <label>По-батькові*:</label>
        <input value={middleName}
               onChange={e => setMiddleName(e.target.value)}
               style={inputStyle}/>
        {errors.middleName && <p style={{ color: 'red' }}>{errors.middleName}</p>}

        <label>Дата народження*:</label>
        <input type="date" value={birthDate}
               onChange={e => setBirthDate(e.target.value)}
               style={inputStyle}/>
        {errors.birthDate && <p style={{ color: 'red' }}>{errors.birthDate}</p>}

        <label>Спеціальності*:</label>
        <Select isMulti options={specializationOptions}
                value={specializations}
                onChange={o => setSpecializations(o as any[])}
                placeholder="Оберіть спеціальності"/>
        {errors.specializations && <p style={{ color: 'red' }}>{errors.specializations}</p>}

        <label>Мови спілкування*:</label>
        <Select isMulti options={languageOptions}
                value={languagesSpoken}
                onChange={o => setLanguagesSpoken(o as any[])}
                placeholder="Оберіть мови"/>
        {errors.languagesSpoken && <p style={{ color: 'red' }}>{errors.languagesSpoken}</p>}

        <label>Фото профілю*:</label>
        <input type="file"
               accept="image/*"
               onChange={e => setPhoto(e.target.files?.[0] || null)}
               style={inputStyle}/>
        {errors.photo && <p style={{ color: 'red' }}>{errors.photo}</p>}

        {photoPreview && (
          <div style={{ margin: '1rem 0' }}>
            <img src={photoPreview} style={{ width: 150, borderRadius: 4 }}/>
          </div>
        )}

        <label>Освіта:</label>
        <input value={education}
               onChange={e => setEducation(e.target.value)}
               placeholder="Університет, рік"
               style={inputStyle}/>

        <label>Про себе*:</label>
        <textarea value={about}
                  onChange={e => setAbout(e.target.value)}
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical' }}/>
        {errors.about && <p style={{ color: 'red' }}>{errors.about}</p>}

        <label>Фото дипломів*:</label>
        <input type="file"
               multiple
               accept="image/*"
               onChange={handleDiplomas}
               style={inputStyle}/>
        {errors.diplomaFiles && <p style={{ color: 'red' }}>{errors.diplomaFiles}</p>}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '1rem 0' }}>
          {diplomaUrls.map((u, i) => (
            <img key={i} src={u} style={{ width: 150, borderRadius: 4 }}/>
          ))}
        </div>

        <button type="submit" style={buttonStyle}>Зберегти</button>
      </form>
    </main>
  );
}
