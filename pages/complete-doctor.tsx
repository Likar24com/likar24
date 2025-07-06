import { useEffect, useState } from 'react';
import { supabase }      from '../lib/supabase';
import { useRouter }     from 'next/router';
import Select            from 'react-select';

export default function CompleteDoctor() {
  const [userId, setUserId]   = useState<string|null>(null);
  const [firstName, setFirstName]     = useState('');
  const [lastName, setLastName]       = useState('');
  const [middleName, setMiddleName]   = useState('');
  const [birthDate, setBirthDate]     = useState('');
  const [specialization, setSpecialization] = useState('');
  const [languagesSpoken, setLanguagesSpoken] = useState<any[]>([]);
  const [photo, setPhoto] = useState<File|null>(null);
  const [education, setEducation] = useState('');
  const [about, setAbout]         = useState('');
  const [diplomaFiles, setDiplomaFiles] = useState<File[]>([]);
  const [diplomaPreviews, setDiplomaPreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<{[k:string]:string}>({});

  const router = useRouter();

  const specializationOptions = [
    'Терапевт','Кардіолог','Педіатр','Дерматолог','Невролог',
    'Офтальмолог','Хірург','Гінеколог','Стоматолог','Психотерапевт'
  ].map(v=>({value:v,label:v}));

  const languageOptions = [
    'Українська','English','Русский','Polski','Deutsch',
    'Français','Español','Italiano','中文','العربية','Türkçe','Português','தமிழ்','हिन्दी'
  ].map(v=>({value:v,label:v}));

  const inputStyle = { width:'100%',padding:10,fontSize:'1rem',border:'1px solid #ccc',borderRadius:6,marginBottom:8 };
  const buttonStyle = { width:'100%',padding:10,fontSize:'1rem',backgroundColor:'#0070f3',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',marginTop:16 };

  useEffect(() => {
    (async()=> {
      const { data:{ user } } = await supabase.auth.getUser();
      if (!user?.id) return;
      setUserId(user.id);
    })();
  }, []);

  // Прев’ю дипломів
  const handleDiplomas = (e:React.ChangeEvent<HTMLInputElement>)=>{
    const files = Array.from(e.target.files||[]);
    setDiplomaFiles(files);
    setDiplomaPreviews(files.map(f=>URL.createObjectURL(f)));
  };

  const handleSubmit = async(e:React.FormEvent)=>{
    e.preventDefault();
    const errs:{[k:string]:string} = {};
    if (!firstName) errs.firstName='Ім’я обов’язкове';
    if (!lastName)  errs.lastName='Прізвище обов’язкове';
    if (!middleName) errs.middleName='По-батькові обов’язкове';
    if (!birthDate) errs.birthDate='Дата народження обов’язкова';
    if (!specialization) errs.specialization='Спеціалізація обов’язкова';
    if (!languagesSpoken.length) errs.languagesSpoken='Оберіть мови';
    if (!photo) errs.photo='Додайте фото профілю';
    if (!about) errs.about='Розкажіть про себе';
    if (!diplomaFiles.length) errs.diplomaFiles='Завантажте дипломи';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const updates:any = {
      first_name: firstName,
      last_name,
      middle_name: middleName,
      birth_date: birthDate,
      specialization,
      languages_spoken: languagesSpoken.map(l=>l.value),
      education,
      about
    };

    // фото профілю
    if (photo) {
      const ext = photo.name.split('.').pop();
      const key = `avatars/${userId}.${ext}`;
      const { data } = await supabase.storage.from('avatars').upload(key, photo, { upsert:true });
      updates.photo = data?.path;
    }

    // дипломи
    const paths:string[] = [];
    for (const file of diplomaFiles) {
      const ext = file.name.split('.').pop();
      const key = `diplomas/${userId}-${file.name}`;
      const { data } = await supabase.storage.from('diplomas').upload(key, file, { upsert:true });
      data?.path && paths.push(data.path);
    }
    updates.diploma_photos = paths;

    await supabase.from('users').update(updates).eq('id', userId);
    router.push('/cabinet');
  };

  return (
    <main style={{ maxWidth:600,margin:'2rem auto',fontFamily:'Arial, sans-serif' }}>
      <h1 style={{ textAlign:'center',marginBottom:16 }}>Профіль лікаря</h1>
      <form onSubmit={handleSubmit} noValidate>
        <label>Прізвище*:</label>
        <input type="text" value={lastName} onChange={e=>setLastName(e.target.value)} style={inputStyle}/>
        {errors.lastName && <p style={{color:'red'}}>{errors.lastName}</p>}

        <label>Ім’я*:</label>
        <input type="text" value={firstName} onChange={e=>setFirstName(e.target.value)} style={inputStyle}/>
        {errors.firstName && <p style={{color:'red'}}>{errors.firstName}</p>}

        <label>По-батькові*:</label>
        <input type="text" value={middleName} onChange={e=>setMiddleName(e.target.value)} style={inputStyle}/>
        {errors.middleName && <p style={{color:'red'}}>{errors.middleName}</p>}

        <label>Дата народження*:</label>
        <input type="date" value={birthDate} onChange={e=>setBirthDate(e.target.value)} style={inputStyle}/>
        {errors.birthDate && <p style={{color:'red'}}>{errors.birthDate}</p>}

        <label>Спеціалізація*:</label>
        <Select options={specializationOptions}
                value={specializationOptions.find(o=>o.value===specialization)}
                onChange={o=>setSpecialization(o?.value||'')}
                placeholder="Оберіть"/>
        {errors.specialization && <p style={{color:'red'}}>{errors.specialization}</p>}

        <label>Мови спілкування*:</label>
        <Select isMulti options={languageOptions}
                value={languagesSpoken}
                onChange={o=>setLanguagesSpoken(o as any[])}
                placeholder="Оберіть"/>
        {errors.languagesSpoken && <p style={{color:'red'}}>{errors.languagesSpoken}</p>}

        <label>Фото профілю*:</label>
        <input type="file" accept="image/*" onChange={e=>setPhoto(e.target.files?.[0]||null)} style={inputStyle}/>
        {errors.photo && <p style={{color:'red'}}>{errors.photo}</p>}

        <label>Освіта:</label>
        <input type="text" value={education} onChange={e=>setEducation(e.target.value)} placeholder="Університет, рік" style={inputStyle}/>

        <label>Про себе*:</label>
        <textarea value={about} onChange={e=>setAbout(e.target.value)} rows={4} style={{...inputStyle,resize:'vertical'}}/>
        {errors.about && <p style={{color:'red'}}>{errors.about}</p>}

        <label>Фото дипломів*:</label>
        <input type="file" multiple accept="image/*" onChange={handleDiplomas} style={inputStyle}/>
        {errors.diplomaFiles && <p style={{color:'red'}}>{errors.diplomaFiles}</p>}

        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
          {diplomaPreviews.map((src,i)=>(
            <div key={i} style={{ position:'relative' }}>
              <img src={src} style={{ width:150,borderRadius:4 }}/>
              <div style={{
                position:'absolute',top:'50%',left:'50%',
                transform:'translate(-50%,-50%) rotate(-30deg)',
                color:'rgba(255,255,255,0.5)',fontSize:24,fontWeight:'bold',pointerEvents:'none'
              }}>Likar24</div>
            </div>
          ))}
        </div>

        <button type="submit" style={buttonStyle}>Зберегти</button>
      </form>
    </main>
  );
}
