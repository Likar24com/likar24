"use client";

export const dynamic = "force-dynamic"; // <--- Додай це!

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Стан токена
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Спробувати отримати токен з query параметрів
    let token = searchParams.get("access_token");

    if (!token && typeof window !== "undefined") {
      // Якщо немає в query, спробувати взяти з hash (#)
      const hash = window.location.hash;
      if (hash) {
        // Припускаємо, що токен і тип в hash виглядають як:
        // #access_token=...&type=recovery&...
        const params = new URLSearchParams(hash.substring(1)); // видаляємо #
        token = params.get("access_token");
      }
    }

    setAccessToken(token || null);

    if (!token) {
      setError("Некоректне або відсутнє посилання для скидання пароля.");
    }
  }, [searchParams]);

  function validatePassword(pw: string) {
    return /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/.test(pw);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!password || !confirmPassword) {
      setError("Будь ласка, заповніть обидва поля.");
      return;
    }

    if (!validatePassword(password)) {
      setError(
        "Пароль повинен містити мінімум 6 символів, одну велику літеру і одну цифру."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Паролі не співпадають.");
      return;
    }

    if (!accessToken) {
      setError("Некоректне або відсутнє посилання для скидання пароля.");
      return;
    }

    setLoading(true);

    // Не передаємо accessToken, Supabase візьме його з URL
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Пароль успішно змінено! Тепер можете увійти.");
      setTimeout(() => router.push("/login"), 3000);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Скинути пароль</h1>
      <form
        onSubmit={handleSubmit}
        className="w-full bg-white p-6 rounded-lg shadow space-y-4"
      >
        <input
          type="password"
          placeholder="Новий пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg"
          required
        />
        <input
          type="password"
          placeholder="Повторіть новий пароль"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg"
          required
        />
        {error && <p className="text-red-600">{error}</p>}
        {message && <p className="text-green-600">{message}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-50 transition"
        >
          {loading ? "Змінюємо пароль..." : "Змінити пароль"}
        </button>
      </form>
    </div>
  );
}
