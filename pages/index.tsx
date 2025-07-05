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
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Link href="/auth">
          <button>Увійти / Зареєструватися</button>
        </Link>
      </header>

      <h1 style={{ textAlign: 'center', marginTop: '2rem' }}>Знайди свого лікаря</h1>

      <form onSubmit={handleSearch} style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        <input
          type="text"
          placeholder="Пошук за ПІБ або спеціальністю"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: '0.5rem' }}
        />
        <button type="submit">Знайти</button>
      </form>

      <section style={{ marginTop: '2rem' }}>
        <h3>Популярні спеціальності:</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {specializations.map((spec) => (
            <button
              key={spec}
              onClick={() => router.push(`/doctors?search=${encodeURIComponent(spec)}`)}
            >
              {spec}
            </button>
          ))}
        </div>
      </section>

      <section style={{ marginTop: '3rem' }}>
        <h2>Як записатися до лікаря?</h2>
        <ol>
          <li>Зареєструйтеся або увійдіть у систему</li>
          <li>Оберіть спеціаліста або знайдіть за ПІБ</li>
          <li>Перейдіть на сторінку лікаря та оберіть час</li>
          <li>Очікуйте підтвердження від лікаря</li>
        </ol>
      </section>
    </main>
  );
}
