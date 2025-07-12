// components/ConsultsPatientStub.tsx
import React from 'react'

/**
 * Заглушка для сторінки "Мої записи на консультацію"
 * Виводьте цю компоненту у /cabinet-patient/consults.tsx поки немає реалізації основного функціоналу.
 */
export default function ConsultsPatientStub() {
  return (
    <div style={{ padding: 40, textAlign: 'center', color: '#888', fontSize: 20 }}>
      <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 18 }}>
        Мої записи на консультацію
      </div>
      <div>
        Функціонал перегляду, зміни або скасування записів на консультацію буде доступний найближчим часом.
      </div>
      <div style={{ marginTop: 32, fontSize: 18, color: '#aaa' }}>
        Поки що зверніться до лікаря напряму, якщо потрібно щось змінити чи скасувати.
      </div>
    </div>
  )
}
