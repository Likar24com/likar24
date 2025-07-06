import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/doctors?search=${encodeURIComponent(search)}`);
  };

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

  return (
    <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Link href="/auth">
          <button style={buttonPrimary}>Увійти / Зареєструватися</button>
        </Link>
      </header>

      <h1 style={{ textAlign: 'center', fontSize: '2rem', margin: '2rem 0' }}>🔍 Знайди свого лікаря</h1>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem' }}>
        <input
          type="text"
          placeholder="Пошук за ПІБ або спеціальністю"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: '0.75rem',
            border: '1px solid #ccc',
            borderRadius: '6px',
            fontSize: '1rem',
          }}
        />
        <button type="submit" style={buttonPrimary}>Знайти</button>
      </form>

      <section style={{ marginTop: '2.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Популярні спеціальності:</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {specializations.map((spec) => (
            <button
              key={spec}
              onClick={() => router.push(`/doctors?search=${encodeURIComponent(spec)}`)}
              style={buttonSecondary}
            >
              {spec}
            </button>
          ))}
        </div>
      </section>

      <section style={{ marginTop: '3rem' }}>
        <h2>🩺 Як записатися до лікаря?</h2>
        <ol style={{ marginLeft: '1.5rem', marginTop: '1rem' }}>
          <li>Зареєструйтеся або увійдіть у систему</li>
          <li>Оберіть спеціаліста або знайдіть за ПІБ</li>
          <li>Перейдіть на сторінку лікаря та оберіть час</li>
          <li>Очікуйте підтвердження від лікаря</li>
        </ol>
      </section>
    </main>
  );
}

const buttonPrimary = {
  padding: '0.75rem 1.5rem',
  backgroundColor: '#0070f3',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 500,
  fontSize: '1rem',
};

const buttonSecondary = {
  padding: '0.5rem 1rem',
  backgroundColor: '#e5e5e5',
  border: '1px solid #ccc',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.95rem',
};
