"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Отримуємо токен з URL (query або hash)
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let tokenFromUrl: string | null = null;
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      tokenFromUrl = urlParams.get("token");
      if (!tokenFromUrl) {
        const hash = window.location.hash;
        if (hash) {
          const hashParams = new URLSearchParams(hash.substring(1));
          tokenFromUrl = hashParams.get("access_token") || hashParams.get("token");
        }
      }
    }
    setToken(tokenFromUrl);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!password || !confirmPassword) {
      setError("Заповніть всі поля");
      return;
    }
    if (password !== confirmPassword) {
      setError("Паролі не співпадають");
      return;
    }

    if (!token) {
      setError("Немає токена скидання пароля");
      return;
    }

    setLoading(true);

    // Заміна пароля через supabase, без передачі accessToken (Supabase автоматично розпізнає сесію за токеном у URL)
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError("Помилка авторизації: " + error.message);
      setLoading(false);
      return;
    }

    setMessage("Пароль успішно змінено! Ви можете увійти з новим паролем.");
    setLoading(false);

    // Можна автоматично перекинути на логін через 3 секунди
    setTimeout(() => {
      router.push("/login");
    }, 3000);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Скидання пароля</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {message && <p className="text-green-600 mb-4">{message}</p>}
      <form onSubmit={handleSubmit} className="w-full bg-white p-6 rounded-lg shadow space-y-4">
        <label className="block font-medium mb-1">Новий пароль</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg"
          required
        />
        <label className="block font-medium mb-1">Підтвердження пароля</label>
        <input
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
          {loading ? "Змінюємо..." : "Змінити пароль"}
        </button>
      </form>
    </div>
  );
}
