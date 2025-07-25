"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  // тут підключаєш свою авторизацію (чи контекст), зараз просто стейт для тесту
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();

  function handleLogout() {
    setIsAuthenticated(false);
    alert("Ви вийшли з акаунту");
  }

  // Перевіряємо, чи зараз сторінка логіну/реєстрації
  const isLoginPage =
    pathname === "/login" ||
    pathname === "/login/" ||
    pathname.startsWith("/login/") || // якщо /login/success то теж true
    pathname === "/register" ||
    pathname === "/register/";

  return (
    <header className="w-full bg-white shadow-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between px-4 py-3 gap-3 sm:gap-0">
        <Link
          href="/"
          className="text-2xl font-bold text-blue-700 tracking-tight hover:text-blue-900 transition"
        >
          Likar24
        </Link>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
          {!isAuthenticated ? (
            isLoginPage ? (
              <Link
                href="/"
                className="px-5 py-2 bg-blue-600 text-white rounded-xl font-semibold text-center hover:bg-blue-700 transition w-full sm:w-auto"
              >
                На головну
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-5 py-2 bg-blue-600 text-white rounded-xl font-semibold text-center hover:bg-blue-700 transition w-full sm:w-auto"
              >
                ЛОГІН/РЕЄСТРАЦІЯ
              </Link>
            )
          ) : (
            <>
              <Link
                href="/cabinet"
                className="px-5 py-2 bg-green-600 text-white rounded-xl font-semibold text-center hover:bg-green-700 transition w-full sm:w-auto"
              >
                МІЙ КАБІНЕТ
              </Link>
              <button
                className="px-5 py-2 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition w-full sm:w-auto"
                onClick={handleLogout}
              >
                ВИХІД
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
