"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      let access_token = urlParams.get("token");
      let refresh_token = null;

      if (!access_token) {
        const hash = window.location.hash;
        if (hash) {
          const hashParams = new URLSearchParams(hash.substring(1));
          access_token = hashParams.get("access_token") || hashParams.get("token");
          refresh_token = hashParams.get("refresh_token");
        }
      }

      setToken(access_token);
      setRefreshToken(refresh_token);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!password) {
      setError("Введіть новий пароль.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Паролі не співпадають.");
      return;
    }
    if (!token || !refreshToken) {
      setError("Відсутній токен підтвердження або токен оновлення.");
      return;
    }

    setLoading(true);

    // Встановлюємо сесію з токенами
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: refreshToken,
    });

    if (sessionError) {
      setError("Помилка сесії: " + sessionError.message);
      setLoading(false);
      return;
    }

    // Оновлюємо пароль (токени вже встановлені)
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError("Помилка оновлення пароля: " + updateError.message);
      setLoading(false);
      return;
    }

    setMessage("Пароль успішно змінено! Перенаправляємо...");

    setTimeout(() => {
      router.push("/login");
    }, 3000);

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Скидання пароля</h1>
      <form onSubmit={handleSubmit} className="w-full bg-white p-6 rounded-lg shadow space-y-4">
        {error && <p className="text-red-600">{error}</p>}
        {message && <p className="text-green-600">{message}</p>}

        <label htmlFor="password" className="block font-medium">
          Новий пароль
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg"
          required
        />

        <label htmlFor="confirmPassword" className="block font-medium">
          Підтвердження пароля
        </label>
        <input
          id="confirmPassword"
          type="password"
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
          {loading ? "Зміна..." : "Змінити пароль"}
        </button>
      </form>
    </div>
  );
}
