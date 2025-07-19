import React from "react";
import Link from "next/link";

export default function Header() {
  // тимчасова змінна: авторизований користувач чи ні
  // далі це буде братись з авторизації
  const isAuthenticated = false;

  return (
    <header className="w-full flex items-center justify-between px-6 py-4 bg-white shadow-md">
      <Link href="/" className="text-2xl font-bold text-blue-700">
        Likar24
      </Link>
      <div>
        {!isAuthenticated ? (
          <Link
            href="/login"
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
          >
            ЛОГІН/РЕЄСТРАЦІЯ
          </Link>
        ) : (
          <div className="flex gap-3">
            <Link
              href="/cabinet"
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
            >
              КАБІНЕТ
            </Link>
            <button
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition"
              // тут буде функція logout
              onClick={() => alert("Вихід (заглушка)")}
            >
              ВИХІД
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
