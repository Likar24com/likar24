"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import {
  LANGUAGES,
  SPECIALTIES,
  TIMEZONES,
  PATIENT_CATEGORIES,
} from "@/constants/formOptions";
import { supabase } from "@/lib/supabaseClient";
import ImageCropper from "@/components/ImageCropper";
import { useRouter } from "next/navigation";

export default function DoctorProfilePage() {
  // Основні state
  const [form, setForm] = useState({
    lastName: "",
    firstName: "",
    middleName: "",
    birthDate: "",
    phone: "",
    timezone: "",
    direction: "",
    about: "",
  });
  const [languages, setLanguages] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [education, setEducation] = useState<string[]>([""]);
  const [courses, setCourses] = useState<string[]>([""]);

  // Файли
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [diplomaFiles, setDiplomaFiles] = useState<File[]>([]);
  const [diplomaPreviews, setDiplomaPreviews] = useState<string[]>([]);

  // refs для очищення file inputs
  const profileInputRef = useRef<HTMLInputElement>(null);
  const diplomaInputRef = useRef<HTMLInputElement>(null);

  // Cropper
  const [showCropper, setShowCropper] = useState(false);
  const [cropperImage, setCropperImage] = useState<string | null>(null);

  // UX
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // --- Мови, спец, динаміка ---
  function toggleLang(val: string) {
    setLanguages((prev) =>
      prev.includes(val) ? prev.filter((l) => l !== val) : [...prev, val]
    );
  }
  function removeLang(val: string) {
    setLanguages((prev) => prev.filter((l) => l !== val));
  }
  function toggleSpec(val: string) {
    setSpecialties((prev) =>
      prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val]
    );
  }
  function removeSpec(val: string) {
    setSpecialties((prev) => prev.filter((s) => s !== val));
  }
  // освіта
  function handleEducationChange(idx: number, value: string) {
    setEducation((prev) => prev.map((v, i) => (i === idx ? value : v)));
  }
  function addEducation() {
    setEducation((prev) => [...prev, ""]);
  }
  function removeEducation(idx: number) {
    setEducation((prev) => prev.filter((_, i) => i !== idx));
  }
  // курси
  function handleCourseChange(idx: number, value: string) {
    setCourses((prev) => prev.map((v, i) => (i === idx ? value : v)));
  }
  function addCourse() {
    setCourses((prev) => [...prev, ""]);
  }
  function removeCourse(idx: number) {
    setCourses((prev) => prev.filter((_, i) => i !== idx));
  }

  // --- Файли: аватар + дипломи ---
  function handleProfilePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropperImage(URL.createObjectURL(file));
    setShowCropper(true);
  }
  function removeProfilePhoto() {
    setProfilePhoto(null);
    setProfilePhotoPreview(null);
    if (profileInputRef.current) profileInputRef.current.value = "";
  }
  function handleCropperDone(blob: Blob | null) {
    if (blob) {
      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
      setProfilePhoto(file);
      setProfilePhotoPreview(URL.createObjectURL(blob));
    }
    setShowCropper(false);
    setCropperImage(null);
  }
  function handleCropperCancel() {
    setShowCropper(false);
    setCropperImage(null);
    removeProfilePhoto();
  }

  function handleDiplomaFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files);
    setDiplomaFiles((prev) => [...prev, ...newFiles]);
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setDiplomaPreviews((prev) => [...prev, ...newPreviews]);
  }
  function removeDiploma(idx: number) {
    setDiplomaFiles((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length === 0 && diplomaInputRef.current) {
        diplomaInputRef.current.value = "";
      }
      return next;
    });
    setDiplomaPreviews((prev) => prev.filter((_, i) => i !== idx));
  }

  // --- Валідація ---
  function validate() {
    const errs: { [key: string]: string } = {};
    if (!profilePhoto) errs.profilePhoto = "Додайте фото профілю";
    if (!form.lastName.trim()) errs.lastName = "Прізвище обовʼязкове";
    if (!form.firstName.trim()) errs.firstName = "Імʼя обовʼязкове";
    if (!form.middleName.trim()) errs.middleName = "По-батькові обовʼязкове";
    if (!form.birthDate) errs.birthDate = "Дата народження обовʼязкова";
    if (languages.length === 0) errs.languages = "Оберіть хоча б одну мову";
    if (!form.phone.trim() || !/^\d+$/.test(form.phone)) errs.phone = "Введіть номер телефону цифрами";
    if (!form.timezone) errs.timezone = "Оберіть часовий пояс";
    if (specialties.length === 0) errs.specialties = "Оберіть хоча б одну спеціальність";
    if (!form.direction) errs.direction = "Оберіть категорію пацієнтів";
    if (education.filter((e) => e.trim()).length === 0) errs.education = "Вкажіть хоча б одну освіту";
    if (diplomaFiles.length === 0) errs.diplomas = "Завантажте диплом";
    if (!form.about.trim()) errs.about = "Розкажіть про себе";
    return errs;
  }

  // --- Сабміт ---
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);

    // 1. Завантаження аватара
    let profilePhotoUrl = "";
    if (profilePhoto) {
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(`doctor_${Date.now()}_${profilePhoto.name}`, profilePhoto, {
          cacheControl: "3600",
          upsert: true,
        });
      if (error) {
        setErrors({ base: "Помилка завантаження аватара" });
        setLoading(false);
        return;
      }
      profilePhotoUrl = data?.path || "";
    }

    // 2. Завантаження дипломів
    const diplomasUrls: string[] = [];
    for (const file of diplomaFiles) {
      const { data, error } = await supabase.storage
        .from("diplomas")
        .upload(`doctor_${Date.now()}_${file.name}`, file, {
          cacheControl: "3600",
          upsert: true,
        });
      if (error) {
        setErrors({ base: "Помилка завантаження дипломів" });
        setLoading(false);
        return;
      }
      if (data?.path) diplomasUrls.push(data.path);
    }

    // 3. Зберегти анкету
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;
      if (!userId) throw new Error("Користувач не авторизований");

      const { error } = await supabase.from("doctors").upsert({
        user_id: userId,
        last_name: form.lastName,
        first_name: form.firstName,
        middle_name: form.middleName,
        birth_date: form.birthDate,
        phone: form.phone,
        timezone: form.timezone,
        direction: form.direction,
        about: form.about,
        languages,
        specialties,
        education,
        courses,
        profile_photo: profilePhotoUrl,
        diplomas_urls: diplomasUrls,
      });

      if (error) throw error;

      router.push("/cabinet/doctor");
    } 
     catch (error: unknown) {
  setErrors({ base: error instanceof Error ? error.message : "Помилка при збереженні." });
    } finally {
      setLoading(false);
    }
  }

  // --- Рендер ---
  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-lg my-6 sm:my-12">
      <h1 className="text-2xl font-semibold mb-6">Заповнення даних лікаря</h1>
      <form onSubmit={onSubmit} noValidate>
        {/* Фото профіля */}
        <div className="mb-6">
          <label className="block font-medium mb-1">
            Фото профіля <span className="text-red-600">*</span>
          </label>
          <input
            type="file"
            accept="image/*"
            ref={profileInputRef}
            onChange={handleProfilePhotoChange}
          />
          {profilePhotoPreview && (
            <div className="mt-2 w-32 h-32 relative border rounded-xl overflow-hidden shadow">
              <Image
                src={profilePhotoPreview}
                alt="Прев'ю фото профілю"
                fill
                style={{ objectFit: "cover" }}
              />
              <button
                type="button"
                onClick={removeProfilePhoto}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm z-10"
                aria-label="Видалити файл"
              >×</button>
            </div>
          )}
          {errors.profilePhoto && <p className="text-red-600 text-sm">{errors.profilePhoto}</p>}
        </div>
        {showCropper && cropperImage && (
          <ImageCropper
            image={cropperImage}
            onCropComplete={handleCropperDone}
            onCancel={handleCropperCancel}
          />
        )}

        {/* Прізвище */}
        <div className="mb-4">
          <label className="block font-medium mb-1">
            Прізвище <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={form.lastName}
            onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
            className={`w-full border rounded p-2 ${errors.lastName ? "border-red-600" : "border-gray-300"}`}
            required
          />
          {errors.lastName && <p className="text-red-600 text-sm">{errors.lastName}</p>}
        </div>
        {/* Імʼя */}
        <div className="mb-4">
          <label className="block font-medium mb-1">
            Імʼя <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={form.firstName}
            onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
            className={`w-full border rounded p-2 ${errors.firstName ? "border-red-600" : "border-gray-300"}`}
            required
          />
          {errors.firstName && <p className="text-red-600 text-sm">{errors.firstName}</p>}
        </div>
        {/* По-батькові */}
        <div className="mb-4">
          <label className="block font-medium mb-1">
            По-батькові <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={form.middleName}
            onChange={e => setForm(f => ({ ...f, middleName: e.target.value }))}
            className={`w-full border rounded p-2 ${errors.middleName ? "border-red-600" : "border-gray-300"}`}
            required
          />
          {errors.middleName && <p className="text-red-600 text-sm">{errors.middleName}</p>}
        </div>
        {/* Дата народження */}
        <div className="mb-4">
          <label className="block font-medium mb-1">
            Дата народження <span className="text-red-600">*</span>
          </label>
          <input
            type="date"
            value={form.birthDate}
            onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))}
            className={`w-full border rounded p-2 ${errors.birthDate ? "border-red-600" : "border-gray-300"}`}
            required
          />
          {errors.birthDate && <p className="text-red-600 text-sm">{errors.birthDate}</p>}
        </div>
        {/* Мова спілкування */}
        <div className="mb-2 font-medium">Мова спілкування <span className="text-red-600">*</span></div>
        <div className="mb-2 flex flex-wrap gap-2">
          {languages.map(l => {
            const label = LANGUAGES.find(item => item.value === l)?.label || l;
            return (
              <div
                key={l}
                className="flex items-center bg-green-200 text-green-800 rounded-full px-3 py-1 cursor-pointer select-none"
                onClick={() => removeLang(l)}
                title="Клікніть, щоб видалити"
              >
                {label}
                <span className="ml-2 font-bold">&times;</span>
              </div>
            );
          })}
        </div>
        <div className="mb-6 flex flex-wrap gap-3">
          {LANGUAGES.map(lang => (
            <label
              key={lang.value}
              className={`cursor-pointer rounded-full px-4 py-1 border select-none ${languages.includes(lang.value) ? "bg-green-200 border-green-500" : "border-gray-300"}`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={languages.includes(lang.value)}
                onChange={() => toggleLang(lang.value)}
              />
              {lang.label}
            </label>
          ))}
        </div>
        {errors.languages && <p className="text-red-600 text-sm">{errors.languages}</p>}

        {/* Номер телефону */}
        <div className="mb-4">
          <label className="block font-medium mb-1">
            Номер телефону <span className="text-red-600">*</span>
          </label>
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            value={form.phone}
            onChange={e => {
              // лише цифри
              const val = e.target.value.replace(/\D/g, "");
              setForm(f => ({ ...f, phone: val }));
            }}
            className={`w-full border rounded p-2 ${errors.phone ? "border-red-600" : "border-gray-300"}`}
            required
          />
          {errors.phone && <p className="text-red-600 text-sm">{errors.phone}</p>}
        </div>
        {/* Часовий пояс */}
        <div className="mb-4">
          <label className="block font-medium mb-1">
            Часовий пояс <span className="text-red-600">*</span>
          </label>
          <select
            value={form.timezone}
            onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
            className={`w-full border rounded p-2 ${errors.timezone ? "border-red-600" : "border-gray-300"}`}
            required
          >
            <option value="">Оберіть часовий пояс</option>
            {TIMEZONES.map(tz => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
          {errors.timezone && <p className="text-red-600 text-sm">{errors.timezone}</p>}
        </div>
        {/* Спеціалізація */}
        <div className="mb-2 font-medium">Спеціалізація <span className="text-red-600">*</span></div>
        <div className="mb-2 flex flex-wrap gap-2">
          {specialties.map(s => {
            const label = SPECIALTIES.find(item => item.value === s)?.label || s;
            return (
              <div
                key={s}
                className="flex items-center bg-yellow-200 text-yellow-800 rounded-full px-3 py-1 cursor-pointer select-none"
                onClick={() => removeSpec(s)}
                title="Клікніть, щоб видалити"
              >
                {label}
                <span className="ml-2 font-bold">&times;</span>
              </div>
            );
          })}
        </div>
        <div className="mb-6 flex flex-wrap gap-3">
          {SPECIALTIES.map(spec => (
            <label
              key={spec.value}
              className={`cursor-pointer rounded-full px-4 py-1 border select-none ${specialties.includes(spec.value) ? "bg-yellow-200 border-yellow-500" : "border-gray-300"}`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={specialties.includes(spec.value)}
                onChange={() => toggleSpec(spec.value)}
              />
              {spec.label}
            </label>
          ))}
        </div>
        {errors.specialties && <p className="text-red-600 text-sm">{errors.specialties}</p>}

        {/* Направлення */}
        <div className="mb-6">
          <label className="block font-medium mb-1">
            Направлення <span className="text-red-600">*</span>
          </label>
          <select
            value={form.direction}
            onChange={e => setForm(f => ({ ...f, direction: e.target.value }))}
            className={`w-full border rounded p-2 ${errors.direction ? "border-red-600" : "border-gray-300"}`}
            required
          >
            <option value="">Оберіть категорію</option>
            {PATIENT_CATEGORIES.map(pc => (
              <option key={pc.value} value={pc.value}>{pc.label}</option>
            ))}
          </select>
          {errors.direction && <p className="text-red-600 text-sm">{errors.direction}</p>}
        </div>

        {/* Освіта */}
        <div className="mb-6">
          <label className="block font-medium mb-2">
            Освіта <span className="text-red-600">*</span>
          </label>
          {education.map((edu, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <input
                type="text"
                value={edu}
                onChange={(e) => handleEducationChange(idx, e.target.value)}
                className="w-full border rounded p-2 border-gray-300"
                required
                placeholder={`Освіта ${idx + 1}`}
              />
              {education.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEducation(idx)}
                  className="bg-red-500 text-white px-2 rounded"
                  title="Видалити"
                >×</button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addEducation}
            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 mt-1"
          >Додати освіту</button>
          {errors.education && <p className="text-red-600 text-sm mt-1">{errors.education}</p>}
        </div>

        {/* Курси */}
        <div className="mb-6">
          <label className="block font-medium mb-2">Курси</label>
          {courses.map((course, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <input
                type="text"
                value={course}
                onChange={(e) => handleCourseChange(idx, e.target.value)}
                className="w-full border rounded p-2 border-gray-300"
                placeholder={`Курс ${idx + 1}`}
              />
              {courses.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCourse(idx)}
                  className="bg-red-500 text-white px-2 rounded"
                  title="Видалити"
                >×</button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addCourse}
            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 mt-1"
          >Додати курс</button>
        </div>

        {/* Дипломи/сертифікати */}
        <div className="mb-6">
          <label className="block font-medium mb-2">
            Дипломи / Сертифікати / Ліцензії <span className="text-red-600">*</span>
          </label>
          <input
            type="file"
            multiple
            accept="image/*,application/pdf"
            ref={diplomaInputRef}
            onChange={handleDiplomaFilesChange}
          />
          {diplomaFiles.length > 0 && (
            <span className="ml-2 text-gray-500">Число файлів: {diplomaFiles.length}</span>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {diplomaPreviews.map((preview, index) => (
              <div key={index} className="relative w-28 h-28 border rounded overflow-hidden">
                <Image src={preview} alt={`Диплом ${index + 1}`} fill style={{ objectFit: "cover" }} />
                <button
                  type="button"
                  onClick={() => removeDiploma(index)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                  aria-label="Видалити файл"
                >×</button>
              </div>
            ))}
          </div>
          {errors.diplomas && <p className="text-red-600 text-sm">{errors.diplomas}</p>}
        </div>

        {/* Про себе */}
        <div className="mb-6">
          <label className="block font-medium mb-1">
            Про себе <span className="text-red-600">*</span>
          </label>
          <textarea
            value={form.about}
            onChange={e => setForm(f => ({ ...f, about: e.target.value }))}
            rows={4}
            className={`w-full border rounded p-2 ${errors.about ? "border-red-600" : "border-gray-300"}`}
            required
            placeholder="Розкажіть коротко про себе"
          />
          {errors.about && <p className="text-red-600 text-sm">{errors.about}</p>}
        </div>

        {/* Кнопка */}
        {errors.base && <p className="text-red-600 mb-4">{errors.base}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition"
        >
          {loading ? "Збереження..." : "Зберегти / Далі"}
        </button>
      </form>
    </div>
  );
}
