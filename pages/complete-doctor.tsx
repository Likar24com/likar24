import React, { useEffect, useState } from 'react';
import { supabase }      from '../lib/supabase';
import { useRouter }     from 'next/router';
import Select            from 'react-select';

export default function CompleteDoctor() {
  const [userId, setUserId]       = useState<string|null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [middleName, setMiddleName] = useState('');
  const [birthDate, setBirthDate] = useState('');

  // тепер масив
  const [specializations, setSpecializations] = useState<any[]>([]);
  const [languagesSpoken, setLanguagesSpoken] = useState<any[]>([]);
  const [photo, setPhoto]       = useState<File|null>(null);
  const [education, setEducation] = useState('');
  const [about, setAbout]         = useState('');
  const [diplomaFiles, setDiplomaFiles]           = useState<File[]>([]);
  const [diplomaPreviews, setDiplomaPreviews]     = useState<string[]>([]);
  const [errors, setErrors]       = useState<{[k:string]:string}>({});

  const router = useRouter();

  const specializationOptions = [
    'Терапевт','Кардіолог','Педіатр','Дерматолог','Невролог',
    'Офтальмолог','Хірург','Гінеколог','Стоматолог','Психотерапевт'
  ].map(v=>({value:v,label:v}));

  // інші опції залишаємо...
  const inputStyle = { width:'100%',padding:10,fontSize:'1rem',border:'1px solid #ccc',borderRadius:6,marginBottom:8 };
  const buttonStyle = { width:'100%',padding:10,fontSize:'1rem',backgroundColor:'#0070f3',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',marginTop:16 };

  useEffect(() => {
    (async()=>{
      const { data:{ user } } = await supabase.auth.getUser();
      if (!user?.id) return;
      setUserId(user.id);
    })();
  }, []);

  const handleDiplomas = (e:React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files||[]);
    setDiplomaFiles(files);
    setDiplomaPreviews(files.map(f=>URL.createObjectURL(f)));
  };

  const handleSubmit = async(e:React.FormEvent) => {
    e.preventDefault();
    const errs:{[k:string]:string} = {};
    if (!firstName)    errs.firstName    = 'Ім’я обов’язкове';
    if (!lastName)     errs.lastName     = 'Прізвище обов’язкове';
    if (!middleName)   errs.middleName   = 'По-батькові обов’язкове';
    if (!birthDate)    errs.birthDate    = 'Дата народження обов’язкова';
    if (specializations.length === 0) errs.specializations = 'Оберіть хоча б одну спеціальність';
    if (languagesSpoken.length  === 0) errs.languagesSpoken = 'Оберіть мови спілкування';
    if (!photo)        errs.photo       = 'Додайте фото профілю';
    if (!about)        errs.about       = 'Розкажіть про себе';
    if (diplomaFiles.length === 0) errs.diplomaFiles = 'Завантажте фото дипломів';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const updates: any = {
      first_name: firstName,
      last_name,
      middle_name: middleName,
      birth_date: birthDate,
      // зберігаємо масив рядків
      specialization: specializations.map(s=>s.value),
      languages_spoken: languagesSpoken.map(l=>l.value),
      education,
      about
    };

    if (photo) {
      const ext = photo.name.split('.').pop();
      const key = `avatars/${userId}.${ext}`;
      const { data } = await supabase.storage.from('avatars').upload(key, photo, { upsert:true });
      updates.photo = data?.path;
    }

    if (diplomaFiles.length) {
      const paths:string[] = [];
      for (const file of diplomaFiles) {
        const ext = file.name.split('.').pop();
        const key = `diplomas/${userId}-${file.name}`;
        const { data } = await supabase.storage.from('diplomas').upload(key, file, { upsert:true });
        data?.path && paths.push(data.path);
      }
      updates.diploma_photos = paths;
    }

    await supabase.from('users').update(updates).eq('id', userId);
    router.push('/cabinet');
  };

  return (
    <main style={{ maxWidth:600,margin:'2rem auto',fontFamily:'Arial, sans-serif' }}>
      <h1 style={{ textAlign:'center',marginBottom:16 }}>Профіль лікаря</h1>
      <form onSubmit={handleSubmit} noValidate>
        {/* інші поля... */}

        <label>Спеціальності*:</label>
        <Select
          isMulti
          options={specializationOptions}
          value={specializations}
          onChange={o=>setSpecializations(o as any[])}
          placeholder="Оберіть спеціальності"
        />
        {errors.specializations && <p style={{color:'red'}}>{errors.specializations}</p>}

        {/* інші поля... */}

        <button type="submit" style={buttonStyle}>Зберегти</button>
      </form>
    </main>
  );
}
