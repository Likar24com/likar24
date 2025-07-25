"use client";

import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  LANGUAGES,
  SPECIALTIES,
  TIMEZONES,
  PATIENT_CATEGORIES,
} from "@/constants/formOptions";
import debounce from "lodash.debounce";
import Image from "next/image";
import ImageCropper from "@/components/ImageCropper";

// --- Галерея для перегляду дипломів ---
function DiplomaGallery({
  images,
  openIdx,
  onClose,
}: {
  images: string[];
  openIdx: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(openIdx);
  if (images.length === 0) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <button
        className="absolute top-6 right-6 bg-white rounded-full shadow p-2"
        onClick={onClose}
        aria-label="Закрити"
      >✕</button>
      <button
        className="absolute left-8 text-white text-4xl"
        onClick={() => setIdx(i => (i > 0 ? i - 1 : i))}
        disabled={idx === 0}
        aria-label="Назад"
      >&#8592;</button>
      <div className="relative w-[90vw] max-w-[400px] h-[60vw] max-h-[500px] bg-white rounded-2xl shadow-lg flex items-center justify-center">
        <Image
          src={images[idx]}
          alt={`Диплом ${idx + 1}`}
          fill
          style={{ objectFit: "contain" }}
          className="rounded-2xl"
        />
      </div>
      <button
        className="absolute right-8 text-white text-4xl"
        onClick={() => setIdx(i => (i < images.length - 1 ? i + 1 : i))}
        disabled={idx === images.length - 1}
        aria-label="Вперед"
      >&#8594;</button>
    </div>
  );
}

// ------------------- //
type DoctorForm = {
  lastName: string;
  firstName: string;
  middleName: string;
  birthDate: string;
  phone: string;
  timezone: string;
  direction: string;
  about: string;
  languages: string[];
  specialties: string[];
  education: string[];
  courses: string[];
};

export default function DoctorProfileInfo() {
  const [form, setForm] = useState<DoctorForm>({
    lastName: "",
    firstName: "",
    middleName: "",
    birthDate: "",
    phone: "",
    timezone: "",
    direction: "",
    about: "",
    languages: [],
    specialties: [],
    education: [""],
    courses: [""],
  });

  const [loading, setLoading] = useState(true);

  // Фото профілю (аватар)
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

  // Дипломи
  const [diplomasUrls, setDiplomasUrls] = useState<string[]>([]);
  const [diplomaPreviews, setDiplomaPreviews] = useState<string[]>([]);
  const diplomaInputRef = useRef<HTMLInputElement>(null);

  // Галерея дипломів
  const [openGalleryIdx, setOpenGalleryIdx] = useState<number | null>(null);

  // Cropper
  const [showCropper, setShowCropper] = useState(false);
  const [cropperImage, setCropperImage] = useState<string | null>(null);

  // Email/password
  const [currentEmail, setCurrentEmail] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [emailStatus, setEmailStatus] = useState<"" | "sent" | "same" | "error">("");
  const [emailMsg, setEmailMsg] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<"" | "success" | "error">("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const passwordFormRef = useRef<HTMLFormElement>(null);

  // INIT
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentEmail(user.email ?? "");
      setEmailInput(user.email ?? "");

      const { data } = await supabase
        .from("doctors")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setForm({
          lastName: data.last_name || "",
          firstName: data.first_name || "",
          middleName: data.middle_name || "",
          birthDate: data.birth_date || "",
          phone: data.phone || "",
          timezone: data.timezone || "",
          direction: data.direction || "",
          about: data.about || "",
          languages: data.languages || [],
          specialties: data.specialties || [],
          education: data.education && data.education.length > 0 ? data.education : [""],
          courses: data.courses && data.courses.length > 0 ? data.courses : [""],
        });
        setProfilePhotoUrl(data.profile_photo || null);
        setProfilePhotoPreview(
          data.profile_photo
            ? supabase.storage.from("avatars").getPublicUrl(data.profile_photo).data?.publicUrl ?? ""
            : null
        );
        setDiplomasUrls(data.diplomas_urls || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Оновлюємо прев'ю дипломів коли змінюється diplomasUrls
  useEffect(() => {
    setDiplomaPreviews(
      diplomasUrls.map((url) =>
        supabase.storage.from("diplomas").getPublicUrl(url).data?.publicUrl ?? ""
      )
    );
  }, [diplomasUrls]);

  // ------- Аватар -------
  async function handleProfilePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setCropperImage(URL.createObjectURL(file));
    setShowCropper(true);

    if (profileInputRef.current) profileInputRef.current.value = "";
  }
  async function handleCropperDone(blob: Blob | null) {
    setShowCropper(false);
    setCropperImage(null);
    if (!blob) return;

    const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
    setProfilePhotoPreview(URL.createObjectURL(blob));
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (profilePhotoUrl) {
      await supabase.storage.from("avatars").remove([profilePhotoUrl]);
    }
    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(`doctor_${user.id}_avatar_${Date.now()}.jpg`, file, {
        cacheControl: "3600",
        upsert: true,
      });
    if (data?.path && !error) {
      setProfilePhotoUrl(data.path);
      await supabase
        .from("doctors")
        .update({ profile_photo: data.path })
        .eq("user_id", user.id);
    }
  }
  function handleCropperCancel() {
    setShowCropper(false);
    setCropperImage(null);
  }

  // ------- Дипломи -------
  async function handleDiplomaFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const isDuplicate = diplomasUrls.some(url => url.split('_').slice(3).join('_') === file.name);
      if (isDuplicate) continue;

      const { data, error } = await supabase.storage
        .from("diplomas")
        .upload(`doctor_${user.id}_diploma_${Date.now()}_${file.name}`, file, {
          cacheControl: "3600",
          upsert: true,
        });
      if (data?.path && !error) {
        uploaded.push(data.path);
      }
    }
    if (uploaded.length === 0) {
      if (diplomaInputRef.current) diplomaInputRef.current.value = "";
      return;
    }
    const newDiplomas = [...diplomasUrls, ...uploaded];
    setDiplomasUrls(newDiplomas);
    await supabase
      .from("doctors")
      .update({ diplomas_urls: newDiplomas })
      .eq("user_id", user.id);

    if (diplomaInputRef.current) diplomaInputRef.current.value = "";
  }

  async function removeDiploma(idx: number) {
    if (diplomasUrls.length <= 1) return; // Не даємо видалити останній диплом!
    const url = diplomasUrls[idx];
    if (url) {
      await supabase.storage.from("diplomas").remove([url]);
      const newDiplomas = diplomasUrls.filter((_, i) => i !== idx);
      setDiplomasUrls(newDiplomas);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("doctors")
        .update({ diplomas_urls: newDiplomas })
        .eq("user_id", user.id);

      if (diplomaInputRef.current) diplomaInputRef.current.value = "";
    }
  }

  // ------- Автосейв --------
  const saveData = debounce(async (updatedForm: DoctorForm) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const filteredEducation = updatedForm.education.filter(e => e.trim() !== "");
    const filteredCourses = updatedForm.courses.filter(e => e.trim() !== "");

    if (
      !updatedForm.lastName ||
      !updatedForm.firstName ||
      !updatedForm.middleName ||
      !updatedForm.birthDate ||
      !updatedForm.phone ||
      !updatedForm.timezone ||
      !updatedForm.direction ||
      updatedForm.languages.length === 0 ||
      updatedForm.specialties.length === 0 ||
      !updatedForm.about ||
      filteredEducation.length === 0
    ) {
      return;
    }

    await supabase
      .from("doctors")
      .update({
        last_name: updatedForm.lastName,
        first_name: updatedForm.firstName,
        middle_name: updatedForm.middleName,
        birth_date: updatedForm.birthDate,
        phone: updatedForm.phone,
        timezone: updatedForm.timezone,
        direction: updatedForm.direction,
        about: updatedForm.about,
        languages: updatedForm.languages,
        specialties: updatedForm.specialties,
        education: filteredEducation,
        courses: filteredCourses,
      })
      .eq("user_id", user.id);
  }, 700);

  useEffect(() => {
    if (!loading) saveData(form);
    // eslint-disable-next-line
  }, [form, loading]);

  // ------- Освіта/Курси --------
  function handleEducationChange(idx: number, value: string) {
    setForm((prev) => {
      const newEdu = prev.education.map((v, i) => (i === idx ? value : v));
      return { ...prev, education: newEdu.filter((e, i, arr) => e.trim() !== "" || arr.length === 1) };
    });
  }
  function addEducation() {
    setForm((prev) => ({ ...prev, education: [...prev.education, ""] }));
  }
  function removeEducation(idx: number) {
    setForm((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== idx),
    }));
  }
  function handleCourseChange(idx: number, value: string) {
    setForm((prev) => {
      const newCourses = prev.courses.map((v, i) => (i === idx ? value : v));
      return { ...prev, courses: newCourses.filter((e, i, arr) => e.trim() !== "" || arr.length === 1) };
    });
  }
  function addCourse() {
    setForm((prev) => ({ ...prev, courses: [...prev.courses, ""] }));
  }
  function removeCourse(idx: number) {
    setForm((prev) => ({
      ...prev,
      courses: prev.courses.filter((_, i) => i !== idx),
    }));
  }

  function handleChange(field: keyof DoctorForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }
  function toggleArr(arrName: "languages" | "specialties", value: string) {
    setForm((prev) => {
      const arr = prev[arrName];
      if (arr.includes(value))
        return { ...prev, [arrName]: arr.filter((v) => v !== value) };
      else return { ...prev, [arrName]: [...arr, value] };
    });
  }

  // ------- Email -------
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailStatus("");
    setEmailMsg("");

    if (emailInput === currentEmail) {
      setEmailStatus("same");
      setEmailMsg("Цей email вже актуальний.");
      setTimeout(() => setEmailStatus(""), 5000);
      return;
    }
    const { error } = await supabase.auth.updateUser({
      email: emailInput,
    });
    if (error) {
      setEmailStatus("error");
      setEmailMsg("Помилка зміни email: " + error.message);
      setTimeout(() => setEmailStatus(""), 5000);
    } else {
      setEmailStatus("sent");
      setEmailMsg("Лист підтвердження надіслано на новий email.");
      setTimeout(() => setEmailStatus(""), 5000);
    }
  }

  // ------- Password -------
  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordStatus("");
    setPasswordMsg("");
    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!newPassword || newPassword.length < 6) {
      setPasswordStatus("error");
      setPasswordMsg("Пароль має бути не менше 6 символів.");
      setTimeout(() => setPasswordStatus(""), 5000);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus("error");
      setPasswordMsg("Паролі не співпадають.");
      setTimeout(() => setPasswordStatus(""), 5000);
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        if (
          error.message.includes("New password should be different from the old password")
        ) {
          setPasswordStatus("error");
          setPasswordMsg("Новий пароль повинен відрізнятися від старого.");
        } else {
          setPasswordStatus("error");
          setPasswordMsg("Помилка зміни паролю: " + error.message);
        }
        setTimeout(() => setPasswordStatus(""), 5000);
      } else {
        setPasswordStatus("success");
        setPasswordMsg("Пароль змінено.");
        setTimeout(() => setPasswordStatus(""), 5000);
        passwordFormRef.current?.reset();
      }
    } catch {
      setPasswordStatus("error");
      setPasswordMsg("Невідома помилка при зміні паролю.");
      setTimeout(() => setPasswordStatus(""), 5000);
    }
  }

  const required = {
    lastName: !form.lastName,
    firstName: !form.firstName,
    middleName: !form.middleName,
    birthDate: !form.birthDate,
    phone: !form.phone,
    timezone: !form.timezone,
    direction: !form.direction,
    languages: form.languages.length === 0,
    specialties: form.specialties.length === 0,
    profilePhoto: !profilePhotoUrl && !profilePhotoPreview,
    about: !form.about,
    education: form.education.filter(e => e.trim()).length === 0,
    diplomas: diplomasUrls.length === 0,
  };

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="bg-white shadow-lg rounded-2xl p-0 mb-8 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 px-4 sm:px-6 py-5 border-b">
          <h2 className="text-2xl sm:text-3xl font-bold">Мої дані</h2>
          <span className="text-gray-500 text-sm sm:text-base">
            Всі зміни зберігаються автоматично
          </span>
        </div>
        {/* Форма */}
        <div className="bg-white rounded-2xl shadow p-4 sm:p-6 space-y-6">
          {loading ? (
            <div className="text-center text-gray-400 my-12">Завантаження...</div>
          ) : (
            <>
              {/* --- Аватар + ПІБ --- */}
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-center mb-6">
                <div className="flex flex-col items-center w-full sm:w-auto">
                  <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-2xl border-2 border-green-500 overflow-hidden shadow-lg">
                    {profilePhotoPreview ? (
                      <Image
                        src={profilePhotoPreview}
                        alt="Прев'ю фото профілю"
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-3xl">
                        ?
                      </div>
                    )}
                    {showCropper && cropperImage && (
                      <ImageCropper
                        image={cropperImage}
                        onCropComplete={handleCropperDone}
                        onCancel={handleCropperCancel}
                      />
                    )}
                  </div>
                  <label
                    className="mt-4 w-fit bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl px-5 py-2 cursor-pointer transition"
                    style={{ minWidth: "120px", textAlign: "center" }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      ref={profileInputRef}
                      onChange={handleProfilePhotoChange}
                      className="hidden"
                    />
                    Змінити фото
                  </label>
                  {required.profilePhoto && (
                    <p className="text-red-400 text-xs mt-2">
                      Дані не будуть збережені — поле не заповнене!
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-1 w-full">
                  <div>
                    <label className="block font-medium mb-1">Прізвище <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className={`w-full border rounded p-2 ${required.lastName ? "border-red-400" : ""}`}
                      value={form.lastName}
                      onChange={e => handleChange("lastName", e.target.value)}
                      required
                    />
                    {required.lastName && (
                      <p className="text-red-400 text-xs mt-1">
                        Дані не будуть збережені — поле не заповнене!
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Імʼя <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className={`w-full border rounded p-2 ${required.firstName ? "border-red-400" : ""}`}
                      value={form.firstName}
                      onChange={e => handleChange("firstName", e.target.value)}
                      required
                    />
                    {required.firstName && (
                      <p className="text-red-400 text-xs mt-1">
                        Дані не будуть збережені — поле не заповнене!
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block font-medium mb-1">По-батькові <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className={`w-full border rounded p-2 ${required.middleName ? "border-red-400" : ""}`}
                      value={form.middleName}
                      onChange={e => handleChange("middleName", e.target.value)}
                      required
                    />
                    {required.middleName && (
                      <p className="text-red-400 text-xs mt-1">
                        Дані не будуть збережені — поле не заповнене!
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {/* --- Решта даних --- */}
              <div className="mb-2">
                <label className="block font-medium mb-1">Дата народження <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  className={`w-full border rounded p-2 ${required.birthDate ? "border-red-400" : ""}`}
                  value={form.birthDate}
                  onChange={e => handleChange("birthDate", e.target.value)}
                  required
                />
                {required.birthDate && (
                  <p className="text-red-400 text-xs mt-1">
                    Дані не будуть збережені — поле не заповнене!
                  </p>
                )}
              </div>
              <div className="mb-2">
                <label className="block font-medium mb-1">Номер телефону <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  className={`w-full border rounded p-2 ${required.phone ? "border-red-400" : ""}`}
                  value={form.phone}
                  onChange={e => handleChange("phone", e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                />
                {required.phone && (
                  <p className="text-red-400 text-xs mt-1">
                    Дані не будуть збережені — поле не заповнене!
                  </p>
                )}
              </div>
              {/* Мова спілкування */}
              <div>
                <label className="block font-medium mb-1">Мова спілкування <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(lang => (
                    <label
                      key={lang.value}
                      className={`cursor-pointer rounded-full px-4 py-1 border select-none ${
                        form.languages.includes(lang.value)
                          ? "bg-green-100 border-green-400 text-green-900"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={form.languages.includes(lang.value)}
                        onChange={() => toggleArr("languages", lang.value)}
                      />
                      {lang.label}
                    </label>
                  ))}
                </div>
                {required.languages && (
                  <p className="text-red-400 text-xs mt-1">
                    Дані не будуть збережені — поле не заповнене!
                  </p>
                )}
              </div>
              {/* Часовий пояс */}
              <div>
                <label className="block font-medium mb-1">Часовий пояс <span className="text-red-500">*</span></label>
                <select
                  className={`w-full border rounded p-2 ${required.timezone ? "border-red-400" : ""}`}
                  value={form.timezone}
                  onChange={e => handleChange("timezone", e.target.value)}
                  required
                >
                  <option value="">Оберіть часовий пояс</option>
                  {TIMEZONES.map(tz => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
                {required.timezone && (
                  <p className="text-red-400 text-xs mt-1">
                    Дані не будуть збережені — поле не заповнене!
                  </p>
                )}
              </div>
              {/* Спеціалізації */}
              <div>
                <label className="block font-medium mb-1">Спеціалізація <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES.map(spec => (
                    <label
                      key={spec.value}
                      className={`cursor-pointer rounded-full px-4 py-1 border select-none ${
                        form.specialties.includes(spec.value)
                          ? "bg-yellow-100 border-yellow-400 text-yellow-900"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={form.specialties.includes(spec.value)}
                        onChange={() => toggleArr("specialties", spec.value)}
                      />
                      {spec.label}
                    </label>
                  ))}
                </div>
                {required.specialties && (
                  <p className="text-red-400 text-xs mt-1">
                    Дані не будуть збережені — поле не заповнене!
                  </p>
                )}
              </div>
              {/* Категорія пацієнтів */}
              <div>
                <label className="block font-medium mb-1">Направлення <span className="text-red-500">*</span></label>
                <select
                  className={`w-full border rounded p-2 ${required.direction ? "border-red-400" : ""}`}
                  value={form.direction}
                  onChange={e => handleChange("direction", e.target.value)}
                  required
                >
                  <option value="">Оберіть категорію</option>
                  {PATIENT_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                {required.direction && (
                  <p className="text-red-400 text-xs mt-1">
                    Дані не будуть збережені — поле не заповнене!
                  </p>
                )}
              </div>
              {/* Освіта */}
              <div>
                <label className="block font-medium mb-2">Освіта <span className="text-red-500">*</span></label>
                {form.education.map((edu, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={edu}
                      onChange={e => handleEducationChange(idx, e.target.value)}
                      className="w-full border rounded p-2 border-gray-300"
                      required
                      placeholder={`Освіта ${idx + 1}`}
                    />
                    {form.education.length > 1 && (
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
                {required.education && (
                  <p className="text-red-400 text-xs mt-1">
                    Дані не будуть збережені — поле не заповнене!
                  </p>
                )}
              </div>
              {/* Курси */}
              <div>
                <label className="block font-medium mb-2">Курси</label>
                {form.courses.map((course, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={course}
                      onChange={e => handleCourseChange(idx, e.target.value)}
                      className="w-full border rounded p-2 border-gray-300"
                      placeholder={`Курс ${idx + 1}`}
                    />
                    {form.courses.length > 1 && (
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
              {/* Про себе */}
              <div>
                <label className="block font-medium mb-1">Про себе <span className="text-red-500">*</span></label>
                <textarea
                  rows={3}
                  className={`w-full border rounded p-2 resize-y ${required.about ? "border-red-400" : ""}`}
                  value={form.about}
                  onChange={e => handleChange("about", e.target.value)}
                  placeholder="Розкажіть коротко про себе"
                  required
                />
                {required.about && (
                  <p className="text-red-400 text-xs mt-1">
                    Дані не будуть збережені — поле не заповнене!
                  </p>
                )}
              </div>
              {/* --- Дипломи --- */}
              <div>
                <label className="block font-medium mb-2">Дипломи / Сертифікати / Ліцензії <span className="text-red-500">*</span></label>
                <label
                  className="w-fit bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl px-6 py-2 cursor-pointer transition mb-2"
                  style={{ minWidth: "160px", textAlign: "center", display: "inline-block" }}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    ref={diplomaInputRef}
                    onChange={handleDiplomaFilesChange}
                    className="hidden"
                  />
                  Додати дипломи
                </label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {diplomaPreviews.map((preview, index) => (
                    <div
                      key={index}
                      className="relative w-24 h-24 sm:w-28 sm:h-28 border rounded-2xl overflow-hidden cursor-pointer group"
                      onClick={() => setOpenGalleryIdx(index)}
                    >
                      <Image src={preview} alt={`Диплом ${index + 1}`} fill style={{ objectFit: "cover" }} />
                      {diplomasUrls.length > 1 && (
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); removeDiploma(index); }}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-80 group-hover:opacity-100"
                          aria-label="Видалити файл"
                        >×</button>
                      )}
                    </div>
                  ))}
                </div>
                {required.diplomas && (
                  <p className="text-red-400 text-xs mt-1">
                    Дані не будуть збережені — поле не заповнене!
                  </p>
                )}
                {/* Галерея для перегляду дипломів */}
                {openGalleryIdx !== null && (
                  <DiplomaGallery
                    images={diplomaPreviews}
                    openIdx={openGalleryIdx}
                    onClose={() => setOpenGalleryIdx(null)}
                  />
                )}
              </div>
              {/* --- Email --- */}
              <div className="mt-10 border-t pt-6">
                <h3 className="text-lg font-semibold mb-2">Зміна Email</h3>
                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    className="w-full border rounded p-2"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
                  >
                    Змінити Email
                  </button>
                  {emailStatus === "sent" && (
                    <p className="text-green-600">{emailMsg}</p>
                  )}
                  {emailStatus === "same" && (
                    <p className="text-green-700">{emailMsg}</p>
                  )}
                  {emailStatus === "error" && (
                    <p className="text-red-600">{emailMsg}</p>
                  )}
                </form>
              </div>
              {/* --- Пароль --- */}
              <div className="mt-10 border-t pt-6">
                <h3 className="text-lg font-semibold mb-2">Зміна паролю</h3>
                <form ref={passwordFormRef} onSubmit={handlePasswordSubmit} className="space-y-3">
                  <input
                    type="password"
                    name="newPassword"
                    required
                    placeholder="Новий пароль"
                    className="w-full border rounded p-2"
                    autoComplete="new-password"
                  />
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    placeholder="Повторіть пароль"
                    className="w-full border rounded p-2"
                    autoComplete="new-password"
                  />
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition"
                  >
                    Змінити пароль
                  </button>
                  {passwordStatus === "success" && (
                    <p className="text-green-600">{passwordMsg}</p>
                  )}
                  {passwordStatus === "error" && (
                    <p className="text-red-600">{passwordMsg}</p>
                  )}
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
