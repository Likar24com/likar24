"use client";

import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { genders, allergens, countries } from "@/constants/formOptions";
import debounce from "lodash.debounce";

type PatientForm = {
  firstName: string;
  lastName: string;
  middleName: string;
  birthDate: string;
  gender: string;
  weight: string;
  country: string;
  selectedAllergens: string[];
  chronicDiseases: string;
};

export default function PatientInfoPanel() {
  const [form, setForm] = useState<PatientForm>({
    firstName: "",
    lastName: "",
    middleName: "",
    birthDate: "",
    gender: "",
    weight: "",
    country: "",
    selectedAllergens: [],
    chronicDiseases: "",
  });

  const [loading, setLoading] = useState(true);

  // Email
  const [currentEmail, setCurrentEmail] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [emailStatus, setEmailStatus] = useState<"" | "sent" | "same" | "error">("");
  const [emailMsg, setEmailMsg] = useState("");

  // Password
  const [passwordStatus, setPasswordStatus] = useState<"" | "success" | "error">("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const passwordFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentEmail(user.email ?? "");
      setEmailInput(user.email ?? "");

      const { data } = await supabase
        .from("patients")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setForm({
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          middleName: data.middle_name || "",
          birthDate: data.birth_date || "",
          gender: data.gender || "",
          weight: data.weight || "",
          country: data.country || "",
          selectedAllergens: data.allergens || [],
          chronicDiseases: data.chronic_diseases || "",
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  const saveData = debounce(async (updatedForm: PatientForm) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (
      !updatedForm.firstName ||
      !updatedForm.birthDate ||
      !updatedForm.gender ||
      !updatedForm.weight ||
      !updatedForm.country ||
      updatedForm.selectedAllergens.length === 0
    ) {
      return;
    }

    await supabase
      .from("patients")
      .update({
        first_name: updatedForm.firstName,
        last_name: updatedForm.lastName,
        middle_name: updatedForm.middleName,
        birth_date: updatedForm.birthDate,
        gender: updatedForm.gender,
        weight: updatedForm.weight,
        country: updatedForm.country,
        allergens: updatedForm.selectedAllergens,
        chronic_diseases: updatedForm.chronicDiseases,
      })
      .eq("user_id", user.id);
  }, 700);

  useEffect(() => {
    if (!loading) saveData(form);
    // eslint-disable-next-line
  }, [form, loading]);

  function handleChange(field: keyof PatientForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleAllergen(allergen: string) {
    let selected = [...form.selectedAllergens];
    const isSelected = selected.includes(allergen);

    if (isSelected) {
      selected = selected.filter((a) => a !== allergen);
    } else {
      if (allergen === "Відсутні") {
        selected = ["Відсутні"];
      } else {
        selected = selected.filter((a) => a !== "Відсутні");
        selected.push(allergen);
      }
    }
    setForm({ ...form, selectedAllergens: selected });
  }

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
    const { error } = await supabase.auth.updateUser({ email: emailInput });
    if (error) {
      setEmailStatus("error");
      setEmailMsg("Помилка зміни email: " + error.message);
    } else {
      setEmailStatus("sent");
      setEmailMsg("Лист підтвердження надіслано на новий email.");
    }
    setTimeout(() => setEmailStatus(""), 5000);
  }

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
  }

  const required = {
    firstName: !form.firstName,
    birthDate: !form.birthDate,
    gender: !form.gender,
    weight: !form.weight,
    country: !form.country,
    selectedAllergens: form.selectedAllergens.length === 0,
  };

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="bg-white shadow-lg rounded-2xl p-0 mb-8 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 px-4 sm:px-6 py-5 border-b">
          <h2 className="text-2xl sm:text-3xl font-bold">Мої дані</h2>
          <span className="text-gray-500 text-sm sm:text-base">
            Всі зміни зберігаються автоматично
          </span>
        </div>
        <div className="p-3 sm:p-6 space-y-6">
          {loading ? (
            <p className="text-center text-gray-400 my-12">Завантаження...</p>
          ) : (
            <>
              {/* Імʼя */}
              <div>
                <label className="block font-medium mb-1">
                  Імʼя <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={`w-full border rounded-xl p-2 ${required.firstName ? "border-red-400" : ""}`}
                  value={form.firstName}
                  onChange={e => handleChange("firstName", e.target.value)}
                />
                {required.firstName && (
                  <p className="text-red-400 text-xs mt-1">Дані не будуть збережені — поле не заповнене!</p>
                )}
              </div>
              {/* Прізвище */}
              <div>
                <label className="block font-medium mb-1">Прізвище</label>
                <input
                  type="text"
                  className="w-full border rounded-xl p-2"
                  value={form.lastName}
                  onChange={e => handleChange("lastName", e.target.value)}
                />
              </div>
              {/* По-батькові */}
              <div>
                <label className="block font-medium mb-1">По-батькові</label>
                <input
                  type="text"
                  className="w-full border rounded-xl p-2"
                  value={form.middleName}
                  onChange={e => handleChange("middleName", e.target.value)}
                />
              </div>
              {/* Дата народження */}
              <div>
                <label className="block font-medium mb-1">
                  Дата народження <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className={`w-full border rounded-xl p-2 ${required.birthDate ? "border-red-400" : ""}`}
                  value={form.birthDate}
                  onChange={e => handleChange("birthDate", e.target.value)}
                />
                {required.birthDate && (
                  <p className="text-red-400 text-xs mt-1">Дані не будуть збережені — поле не заповнене!</p>
                )}
              </div>
              {/* Стать */}
              <div>
                <label className="block font-medium mb-1">Стать <span className="text-red-500">*</span></label>
                <select
                  className={`w-full border rounded-xl p-2 ${required.gender ? "border-red-400" : ""}`}
                  value={form.gender}
                  onChange={e => handleChange("gender", e.target.value)}
                >
                  <option value="">Оберіть стать</option>
                  {genders.map(g => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
                {required.gender && (
                  <p className="text-red-400 text-xs mt-1">Дані не будуть збережені — поле не заповнене!</p>
                )}
              </div>
              {/* Вага */}
              <div>
                <label className="block font-medium mb-1">Вага (кг) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  className={`w-full border rounded-xl p-2 ${required.weight ? "border-red-400" : ""}`}
                  value={form.weight}
                  onChange={e => handleChange("weight", e.target.value)}
                />
                {required.weight && (
                  <p className="text-red-400 text-xs mt-1">Дані не будуть збережені — поле не заповнене!</p>
                )}
              </div>
              {/* Країна */}
              <div>
                <label className="block font-medium mb-1">Країна <span className="text-red-500">*</span></label>
                <select
                  className={`w-full border rounded-xl p-2 ${required.country ? "border-red-400" : ""}`}
                  value={form.country}
                  onChange={e => handleChange("country", e.target.value)}
                >
                  <option value="">Оберіть країну</option>
                  {countries.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {required.country && (
                  <p className="text-red-400 text-xs mt-1">Дані не будуть збережені — поле не заповнене!</p>
                )}
              </div>
              {/* Алергени */}
              <div>
                <label className="block font-medium mb-1">Алергени <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {allergens.map(a => {
                    const selected = form.selectedAllergens.includes(a);
                    return (
                      <label
                        key={a}
                        className={`cursor-pointer rounded-full px-4 py-1 border select-none transition text-base
                          ${selected
                            ? "bg-blue-100 border-blue-400 text-blue-900"
                            : "border-gray-300 bg-white"}
                        `}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={selected}
                          onChange={() => toggleAllergen(a)}
                        />
                        {a}
                      </label>
                    );
                  })}
                </div>
                {required.selectedAllergens && (
                  <p className="text-red-400 text-xs mt-1">Дані не будуть збережені — поле не заповнене!</p>
                )}
              </div>
              {/* Хронічні хвороби */}
              <div>
                <label className="block font-medium mb-1">Хронічні хвороби</label>
                <textarea
                  rows={3}
                  className="w-full border rounded-xl p-2 resize-y"
                  value={form.chronicDiseases}
                  onChange={e => handleChange("chronicDiseases", e.target.value)}
                  placeholder="Хронічні захворювання"
                />
              </div>
              {/* Зміна Email */}
              <div className="mt-10 border-t pt-6">
                <h3 className="text-lg font-semibold mb-2">Зміна Email</h3>
                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    className="w-full border rounded-xl p-2"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
                  >
                    Змінити Email
                  </button>
                  {emailStatus && <p className={`text-sm ${emailStatus === "error" ? "text-red-600" : "text-green-600"}`}>{emailMsg}</p>}
                </form>
              </div>
              {/* Зміна паролю */}
              <div className="mt-10 border-t pt-6">
                <h3 className="text-lg font-semibold mb-2">Зміна паролю</h3>
                <form ref={passwordFormRef} onSubmit={handlePasswordSubmit} className="space-y-3">
                  <input
                    type="password"
                    name="newPassword"
                    required
                    placeholder="Новий пароль"
                    className="w-full border rounded-xl p-2"
                  />
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    placeholder="Повторіть пароль"
                    className="w-full border rounded-xl p-2"
                  />
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition"
                  >
                    Змінити пароль
                  </button>
                  {passwordStatus && <p className={`text-sm ${passwordStatus === "error" ? "text-red-600" : "text-green-600"}`}>{passwordMsg}</p>}
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
