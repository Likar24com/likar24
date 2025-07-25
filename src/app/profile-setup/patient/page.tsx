"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { genders, allergens, countries } from "@/constants/formOptions";
import { supabase } from "@/lib/supabaseClient";

export default function PatientProfileSetup() {
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    birthDate: "",
    gender: "",
    weight: "",
    country: "",
    selectedAllergens: [] as string[],
    chronicDiseases: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  async function getUserId() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      console.error("User not logged in");
      return null;
    }
    return user.id;
  }

  useEffect(() => {
    async function loadPatient() {
      const userId = await getUserId();
      if (!userId) return;

      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading patient data:", error.message);
        return;
      }

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
    }

    loadPatient();
   
  }, []);

  function validate() {
    const newErrors: { [key: string]: string } = {};
    if (!form.firstName.trim()) newErrors.firstName = "Ім’я є обов’язковим";
    if (!form.birthDate) newErrors.birthDate = "Дата народження є обов’язковою";
    if (!form.gender) newErrors.gender = "Оберіть стать";
    if (!form.weight || Number(form.weight) <= 0) newErrors.weight = "Введіть правильну вагу";
    if (!form.country) newErrors.country = "Оберіть країну проживання";
    if (form.selectedAllergens.length === 0) newErrors.selectedAllergens = "Оберіть хоча б один алерген";
    return newErrors;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    const userId = await getUserId();

    if (!userId) {
      alert("Користувач не авторизований");
      setLoading(false);
      return;
    }

    const patientData = {
      user_id: userId,
      first_name: form.firstName,
      last_name: form.lastName,
      middle_name: form.middleName,
      birth_date: form.birthDate,
      gender: form.gender,
      weight: form.weight,
      country: form.country,
      allergens: form.selectedAllergens,
      chronic_diseases: form.chronicDiseases,
    };

    try {
      const { data: existing, error: fetchError } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        alert("Помилка перевірки даних: " + fetchError.message);
        setLoading(false);
        return;
      }

      if (existing) {
        const { error: updateError } = await supabase
          .from("patients")
          .update(patientData)
          .eq("id", existing.id);

        if (updateError) {
          alert("Помилка оновлення даних: " + updateError.message);
          setLoading(false);
          return;
        }
      } else {
        const { error: insertError } = await supabase.from("patients").insert(patientData);

        if (insertError) {
          alert("Помилка збереження даних: " + insertError.message);
          setLoading(false);
          return;
        }
      }

      router.push("/cabinet/patient");
    } catch (error) {
      alert("Несподівана помилка при збереженні.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function toggleAllergen(allergen: string) {
    let newSelected = [...form.selectedAllergens];
    const isSelected = newSelected.includes(allergen);

    if (isSelected) {
      newSelected = newSelected.filter((a) => a !== allergen);
    } else {
      if (allergen === "Відсутні") {
        newSelected = ["Відсутні"];
      } else {
        newSelected = newSelected.filter((a) => a !== "Відсутні");
        newSelected.push(allergen);
      }
    }
    setForm({ ...form, selectedAllergens: newSelected });
  }

  function removeAllergen(allergen: string) {
    setForm({
      ...form,
      selectedAllergens: form.selectedAllergens.filter((a) => a !== allergen),
    });
  }

  return (
    <div className="max-w-2xl mx-auto w-full mt-6 sm:mt-12">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden p-0 mb-8">
        <div className="border-b px-4 sm:px-8 pt-6 pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold mb-0">Заповнення даних пацієнта</h1>
        </div>
        <form onSubmit={onSubmit} noValidate className="p-4 sm:p-8 space-y-6">
          {/* Імʼя */}
          <div>
            <label className="block font-medium mb-1">
              Імʼя <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className={`w-full border rounded-xl p-2 ${
                errors.firstName ? "border-red-600" : "border-gray-300"
              }`}
              required
            />
            {errors.firstName && <p className="text-red-600 text-xs mt-1">{errors.firstName}</p>}
          </div>

          {/* Прізвище */}
          <div>
            <label className="block font-medium mb-1">Прізвище</label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="w-full border rounded-xl p-2 border-gray-300"
            />
          </div>

          {/* По-Батькові */}
          <div>
            <label className="block font-medium mb-1">По-Батькові</label>
            <input
              type="text"
              value={form.middleName}
              onChange={(e) => setForm({ ...form, middleName: e.target.value })}
              className="w-full border rounded-xl p-2 border-gray-300"
            />
          </div>

          {/* Дата народження */}
          <div>
            <label className="block font-medium mb-1">
              Дата народження <span className="text-red-600">*</span>
            </label>
            <input
              type="date"
              value={form.birthDate}
              onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
              className={`w-full border rounded-xl p-2 ${
                errors.birthDate ? "border-red-600" : "border-gray-300"
              }`}
              required
            />
            {errors.birthDate && <p className="text-red-600 text-xs mt-1">{errors.birthDate}</p>}
          </div>

          {/* Стать */}
          <div>
            <label className="block font-medium mb-1">
              Стать <span className="text-red-600">*</span>
            </label>
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className={`w-full border rounded-xl p-2 ${
                errors.gender ? "border-red-600" : "border-gray-300"
              }`}
              required
            >
              <option value="">Оберіть стать</option>
              {genders.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
            {errors.gender && <p className="text-red-600 text-xs mt-1">{errors.gender}</p>}
          </div>

          {/* Вага */}
          <div>
            <label className="block font-medium mb-1">
              Вага (кг) <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
              className={`w-full border rounded-xl p-2 ${
                errors.weight ? "border-red-600" : "border-gray-300"
              }`}
              required
            />
            {errors.weight && <p className="text-red-600 text-xs mt-1">{errors.weight}</p>}
          </div>

          {/* Країна проживання */}
          <div>
            <label className="block font-medium mb-1">
              Країна проживання <span className="text-red-600">*</span>
            </label>
            <select
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className={`w-full border rounded-xl p-2 ${
                errors.country ? "border-red-600" : "border-gray-300"
              }`}
              required
            >
              <option value="">Оберіть країну</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.country && <p className="text-red-600 text-xs mt-1">{errors.country}</p>}
          </div>

          {/* Алергени */}
          <div className="font-medium mb-1">
            Алергени <span className="text-red-600">*</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {form.selectedAllergens.map((a) => (
              <div
                key={a}
                className="flex items-center bg-blue-200 text-blue-800 rounded-full px-3 py-1 cursor-pointer select-none"
                onClick={() => removeAllergen(a)}
                title="Клікніть, щоб видалити"
              >
                {a}
                <span className="ml-2 font-bold">&times;</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {allergens.map((a) => {
              const checked = form.selectedAllergens.includes(a);
              return (
                <label
                  key={a}
                  className={`cursor-pointer rounded-full px-4 py-1 border select-none text-base ${
                    checked
                      ? "bg-blue-100 border-blue-400 text-blue-900"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={checked}
                    onChange={() => toggleAllergen(a)}
                  />
                  {a}
                </label>
              );
            })}
          </div>
          {errors.selectedAllergens && (
            <p className="text-red-600 text-xs mb-2">{errors.selectedAllergens}</p>
          )}

          {/* Хронічні хвороби */}
          <div>
            <label className="block font-medium mb-1">Хронічні хвороби</label>
            <textarea
              rows={3}
              value={form.chronicDiseases}
              onChange={(e) => setForm({ ...form, chronicDiseases: e.target.value })}
              className="w-full border rounded-xl p-2 border-gray-300 resize-y"
              placeholder="Опишіть хронічні захворювання"
            />
          </div>

          {/* Кнопка */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition"
          >
            {loading ? "Збереження..." : "Зберегти / Далі"}
          </button>
        </form>
      </div>
    </div>
  );
}
