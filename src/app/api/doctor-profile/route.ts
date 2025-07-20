import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Допоміжна функція для завантаження файлів у Storage
async function uploadFileToStorage(userId: string, file: File, folder: string): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `${folder}/${userId}/${fileName}`;

  const { error } = await supabase.storage
    .from('doctors')
    .upload(filePath, file);

  if (error) {
    console.error('Storage upload error:', error);
    return null;
  }

  // Повертаємо публічний URL файлу
  const { data } = supabase.storage.from('doctors').getPublicUrl(filePath);
  return data.publicUrl;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const userId = formData.get('user_id') as string;
    const profilePhoto = formData.get('profile_photo') as File;
    const certificates = formData.getAll('certificates') as File[];
    // Інші текстові поля
    const lastName = formData.get('last_name') as string;
    const firstName = formData.get('first_name') as string;
    const middleName = formData.get('middle_name') as string;
    const birthDate = formData.get('birth_date') as string;
    const languages = JSON.parse(formData.get('languages') as string) as string[];
    const phone = formData.get('phone') as string;
    const timezone = formData.get('timezone') as string;
    const specialties = JSON.parse(formData.get('specialties') as string) as string[];
    const directions = formData.get('directions') as string;
    const education = formData.get('education') as string;
    const courses = formData.get('courses') as string;
    const about = formData.get('about') as string;

    if (!userId || !profilePhoto || !lastName || !firstName || !middleName || !birthDate || !languages || !phone || !timezone || !specialties || !directions || !education || !about) {
      return NextResponse.json({ error: 'Не всі обов’язкові поля заповнені' }, { status: 400 });
    }

    // Завантажуємо фото профілю
    const profilePhotoUrl = await uploadFileToStorage(userId, profilePhoto, 'profile_photos');
    if (!profilePhotoUrl) {
      return NextResponse.json({ error: 'Помилка завантаження фото профілю' }, { status: 500 });
    }

    // Завантажуємо дипломи (сертифікати)
    const certificatesUrls: string[] = [];
    for (const file of certificates) {
      const url = await uploadFileToStorage(userId, file, 'certificates');
      if (!url) {
        return NextResponse.json({ error: 'Помилка завантаження сертифікатів' }, { status: 500 });
      }
      certificatesUrls.push(url);
    }

    // Записуємо у таблицю doctors
    const { data, error } = await supabase
      .from('doctors')
      .upsert({
        user_id: userId,
        profile_photo: profilePhotoUrl,
        last_name: lastName,
        first_name: firstName,
        middle_name: middleName,
        birth_date: birthDate,
        languages,
        phone,
        timezone,
        specialties,
        directions,
        education,
        courses,
        certificates: certificatesUrls,
        about,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('DB insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Дані лікаря збережено', data });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Внутрішня помилка сервера' }, { status: 500 });
  }
}
