"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Збережемо токени в стані
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  // Витягуємо токени з хеша URL
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    if (!hash) {
      setError("Token не знайдено. Переконайтеся, що ви перейшли за правильним посиланням.");
      return;
    }

    const hashParams = new URLSearchParams(hash.substring(1));
    const at = hashParams.get("access_token");
    const rt = hashParams.get("refresh_token");

    if (!at) {
      setError("Token не знайдено в URL.");
      return;
    }

    setAccessToken(at);
    setRefreshToken(rt);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError(null);
    setMessage(null);

    if (password.length < 6) {
      setError("Пароль має містити мінімум 6 символів.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Паролі не співпадають.");
      return;
    }

    if (!accessToken || !refreshToken) {
      setError("Токени відсутні або недійсні. Спробуйте повторити процес скидання пароля.");
      return;
    }

    setLoading(true);

    // 1. Встановлюємо сесію з токенами
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError) {
      setError("Помилка авторизації: " + sessionError.message);
      setLoading(false);
      return;
    }

    // 2. Оновлюємо пароль вже в контексті сесії
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError("Помилка зміни пароля: " + updateError.message);
      setLoading(false);
      return;
    }

    setMessage("Пароль успішно змінено! Перенаправляємо...");

    setTimeout(() => {
      router.push("/login");
    }, 2500);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Скидання пароля</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {message && <p className="text-green-600 mb-4">{message}</p>}

      <form onSubmit={handleSubmit} className="w-full bg-white p-6 rounded-lg shadow space-y-4">
        <label htmlFor="password" className="block font-medium mb-1">
          Новий пароль
        </label>
        <input
          id="password"
          type="password"
          placeholder="Введіть новий пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg"
          required
        />

        <label htmlFor="confirmPassword" className="block font-medium mb-1">
          Підтвердження пароля
        </label>
        <input
          id="confirmPassword"
          type="password"
          placeholder="Підтвердіть пароль"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? "Змінюємо..." : "Змінити пароль"}
        </button>
      </form>
    </div>
  );
}
