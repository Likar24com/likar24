import { useEffect, useState } from 'react';
import { supabase }      from '../lib/supabase';
import { useRouter }     from 'next/router';
import Select            from 'react-select';

export default function CompletePatient() {
  const [userId, setUserId] = useState<string|null>(null);
  const [firstName, setFirstName]     = useState('');
  const [lastName, setLastName]       = useState('');
  const [middleName, setMiddleName]   = useState('');
  const [birthDate, setBirthDate]     = useState('');
  const [weight, setWeight]           = useState('');
  const [country, setCountry]         = useState('');
  const [allergies, setAllergies]     = useState<any[]>([]);
  const [chronicDiseases, setChronic] = useState('');
  const [errors, setErrors]           = useState<{[k:string]:string}>({});

  const router = useRouter();

  const countryOptions = [
    'Україна','Польща','Німеччина','Франція','Італія','Іспанія','США','Канада'
  ].map(v => ({ value: v, label: v }));

  const allergyOptions = [
    'Пилок','Медикаменти','Глютен','Горіхи','Молочні продукти','Морепродукти'
  ].map(v => ({ value: v, label: v }));

  const inputStyle = { width:'100%', padding:10, fontSize:'1rem', border:'1px solid #ccc', borderRadius:6, marginBottom:8 };
  const buttonStyle = { width:'100%', padding:10, fontSize:'1rem', backgroundColor:'#0070f3', color:'#fff', border:'none', borderRadius:6, cursor:'pointer' };

  useEffect(() => {
    (async() => {
      const { data:{ user } } = await supabase.auth.getUser();
      if (!user?.id) return;
      setUserId(user.id);
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!firstName) errs.firstName = 'Ім’я обов’язкове';
    if (!birthDate) errs.birthDate = 'Дата народження обов’язкова';
    if (!weight) errs.weight = 'Вага обов’язкова';
    if (!country) errs.country = 'Оберіть країну';
    if (!allergies.length) errs.allergies = 'Оберіть хоча б один алерген';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const updates: any = {
      first_name: firstName,
      last_name,
      middle_name: middleName,
      birth_date: birthDate,
      weight: parseFloat(weight),
      country,
      allergies: allergies.map(a => a.value),
      chronic_diseases: chronicDiseases,
    };
    await supabase.from('users').update(updates).eq('id', userId);
    router.push('/cabinet');
  };

  return (
    <main style={{ maxWidth:600, margin:'2rem auto', fontFamily:'Arial, sans-serif' }}>
      <h1 style={{ textAlign:'center', marginBottom:16 }}>Профіль пацієнта</h1>
      <form onSubmit={handleSubmit} noValidate>
        <label>Ім’я*:</label>
        <input type="text" value={firstName} onChange={e=>setFirstName(e.target.value)} style={inputStyle}/>
        {errors.firstName && <p style={{color:'red'}}>{errors.firstName}</p>}

        <label>Прізвище:</label>
        <input type="text" value={lastName} onChange={e=>setLastName(e.target.value)} style={inputStyle}/>

        <label>По-батькові:</label>
        <input type="text" value={middleName} onChange={e=>setMiddleName(e.target.value)} style={inputStyle}/>

        <label>Дата народження*:</label>
        <input type="date" value={birthDate} onChange={e=>setBirthDate(e.target.value)} style={inputStyle}/>
        {errors.birthDate && <p style={{color:'red'}}>{errors.birthDate}</p>}

        <label>Вага (кг)*:</label>
        <input type="number" value={weight} onChange={e=>setWeight(e.target.value)} style={inputStyle}/>
        {errors.weight && <p style={{color:'red'}}>{errors.weight}</p>}

        <label>Країна*:</label>
        <Select options={countryOptions}
                value={countryOptions.find(o=>o.value===country)}
                onChange={o=>setCountry(o?.value||'')}
                placeholder="Оберіть країну"/>
        {errors.country && <p style={{color:'red'}}>{errors.country}</p>}

        <label>Алергени*:</label>
        <Select isMulti options={allergyOptions}
                value={allergies}
                onChange={o=>setAllergies(o as any[])}
                placeholder="Оберіть алергени"/>
        {errors.allergies && <p style={{color:'red'}}>{errors.allergies}</p>}

        <label>Хронічні хвороби:</label>
        <textarea value={chronicDiseases} onChange={e=>setChronicDiseases(e.target.value)}
                  rows={4} style={{ ...inputStyle, resize:'vertical' }}/>
        <button type="submit" style={buttonStyle}>Зберегти</button>
      </form>
    </main>
  );
}
