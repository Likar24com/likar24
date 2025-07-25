"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();

  // Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Register
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerRole, setRegisterRole] = useState<"patient" | "doctor">("patient");
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerLoading, setRegisterLoading] = useState(false);

  function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validatePassword(password: string) {
    return /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/.test(password);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);

    if (!validateEmail(loginEmail)) {
      setLoginError("Введіть коректний email.");
      return;
    }
    if (!validatePassword(loginPassword)) {
      setLoginError("Пароль повинен містити мінімум 6 символів, одну велику літеру і одну цифру.");
      return;
    }

    setLoginLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      setLoginError(error.message);
      setLoginLoading(false);
      return;
    }

    router.replace("/profile");
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegisterError(null);

    if (!validateEmail(registerEmail)) {
      setRegisterError("Введіть коректний email.");
      return;
    }
    if (!validatePassword(registerPassword)) {
      setRegisterError("Пароль повинен містити мінімум 6 символів, одну велику літеру і одну цифру.");
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      setRegisterError("Паролі не співпадають.");
      return;
    }
    if (registerRole !== "patient" && registerRole !== "doctor") {
      setRegisterError("Оберіть роль користувача.");
      return;
    }

    setRegisterLoading(true);

    localStorage.setItem("registerEmail", registerEmail);
    localStorage.setItem("registerPassword", registerPassword);

    const emailRedirectTo = typeof window !== "undefined" ? `${window.location.origin}/login/success` : "";

    const { error } = await supabase.auth.signUp({
      email: registerEmail,
      password: registerPassword,
      options: {
        data: { role: registerRole },
        emailRedirectTo,
      },
    });

    if (error) {
      setRegisterError(error.message);
      setRegisterLoading(false);
      return;
    }

    router.push("/login/success");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6 md:gap-12 w-full max-w-4xl">
        {/* LOGIN */}
        <form
          onSubmit={handleLogin}
          className="flex-1 bg-white p-6 rounded-2xl shadow-lg w-full max-w-md mx-auto mb-8 md:mb-0 flex flex-col"
          noValidate
        >
          <h2 className="text-xl font-semibold mb-4">Вхід</h2>
          {loginError && <p className="text-red-600 mb-2">{loginError}</p>}
          <input
            type="email"
            placeholder="Email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          />
          <p className="text-sm text-gray-500 mb-1">Введіть ваш email для входу</p>
          <input
            type="password"
            placeholder="Пароль"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          />
          <div className="mb-4 text-right">
            <a
              href="/forgot-password"
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              Забули пароль?
            </a>
          </div>
          <button
            type="submit"
            disabled={loginLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-50 transition"
          >
            {loginLoading ? "Завантаження..." : "Увійти"}
          </button>
          {/* Слоган під кнопкою */}
          <div className="mt-6 flex flex-col items-center">
            <svg width="32" height="32" fill="none" className="mb-2 text-green-500" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="2"/>
              <path d="M11 16l3 3l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-sm text-gray-400 text-center leading-tight">
              Отримуйте консультації з будь-якого<br className="hidden sm:inline" /> куточка світу
            </p>
          </div>
        </form>

        {/* REGISTRATION */}
        <form
          onSubmit={handleRegister}
          className="flex-1 bg-white p-6 rounded-2xl shadow-lg w-full max-w-md mx-auto flex flex-col"
          noValidate
        >
          <h2 className="text-xl font-semibold mb-4">Реєстрація</h2>
          {registerError && <p className="text-red-600 mb-2">{registerError}</p>}
          <input
            type="email"
            placeholder="Email"
            value={registerEmail}
            onChange={(e) => setRegisterEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          />
          <p className="text-sm text-gray-500 mb-1">Введіть ваш email для реєстрації</p>
          <input
            type="password"
            placeholder="Пароль"
            value={registerPassword}
            onChange={(e) => setRegisterPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          />
          <p className="text-sm text-gray-500 mb-1">
            Пароль повинен містити мінімум 6 символів, одну велику літеру і одну цифру.
          </p>
          <input
            type="password"
            placeholder="Повторіть пароль"
            value={registerConfirmPassword}
            onChange={(e) => setRegisterConfirmPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          />
          <p className="text-sm text-gray-500 mb-4">Повторіть пароль для підтвердження</p>

          {/* Кнопки вибору ролі */}
          <div className="flex gap-3 mb-4">
            {["patient", "doctor"].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setRegisterRole(role as "patient" | "doctor")}
                className={`flex-1 py-2 rounded-lg font-semibold transition
                  ${
                    registerRole === role
                      ? "bg-blue-700 text-white shadow-md"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }
                `}
              >
                {role === "patient" ? "Пацієнт" : "Лікар"}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={registerLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg disabled:opacity-50 transition"
          >
            {registerLoading ? "Завантаження..." : "Зареєструватися"}
          </button>
        </form>
      </div>
    </div>
  );
}
