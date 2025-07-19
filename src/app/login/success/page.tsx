"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function EmailConfirmedPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Перевіряємо підтвердження...");
  const [loading, setLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [confirmed, setConfirmed] = useState(false); // новий стан — підтверджено
  const resendTimeout = useRef<NodeJS.Timeout | null>(null);

  async function getUserRole() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) return null;

    return session.user.user_metadata?.role || null;
  }

  async function resendConfirmationEmail() {
    if (!canResend) return;

    setLoading(true);
    setMessage("Надсилаємо лист повторно...");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const email = session?.user.email;
    if (!email) {
      setMessage("Не вдалось визначити email для повторної відправки.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({ email });

    if (error) {
      if (error.message.includes("For security purposes")) {
        setMessage(
          "Для безпеки ви можете запитувати повторний лист не частіше ніж раз на хвилину. Якщо лист не прийшов — перевірте папку Спам або зачекайте 10-15 хвилин."
        );
      } else {
        setMessage("Помилка надсилання листа: " + error.message);
      }
    } else {
      setMessage(
        "Лист для підтвердження надіслано повторно. Якщо лист не прийшов — перевірте папку Спам або зачекайте 10-15 хвилин."
      );
      setCanResend(false);
      if (resendTimeout.current) clearTimeout(resendTimeout.current);
      resendTimeout.current = setTimeout(() => {
        setCanResend(true);
        setMessage("Ви можете надіслати лист ще раз.");
      }, 60000);
    }
    setLoading(false);
  }

  useEffect(() => {
    let token: string | null = null;

    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      token = urlParams.get("token");

      if (!token) {
        const hash = window.location.hash;
        if (hash) {
          const hashParams = new URLSearchParams(hash.substring(1));
          token = hashParams.get("access_token") || hashParams.get("token");
        }
      }
    }

    if (!token) {
      setMessage("Перевіряємо підтвердження...");
      return;
    }

    setMessage("Email підтверджено! Зачекайте, виконуємо перенаправлення...");
    setConfirmed(true); // підтвердження — показуємо кнопку не будемо

    (async () => {
      const role = await getUserRole();

      setTimeout(() => {
        if (role === "doctor") {
          router.push("/profile-setup/doctor");
        } else {
          router.push("/profile-setup/patient");
        }
      }, 3000);
    })();

    setCanResend(false);
    resendTimeout.current = setTimeout(() => {
      setCanResend(true);
      setMessage("Ви можете надіслати лист ще раз.");
    }, 60000);

    return () => {
      if (resendTimeout.current) clearTimeout(resendTimeout.current);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-100 to-blue-50">
      <div className="bg-white p-10 rounded-xl shadow-lg max-w-md w-full text-center">
        <svg
          className="mx-auto mb-6 w-16 h-16 text-green-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>

        <h1 className="text-3xl font-bold mb-4 text-green-700">Підтвердження Email</h1>
        <p className="text-lg mb-6 whitespace-pre-line">{message}</p>

        {!confirmed && (
          <>
            <p className="mb-6 text-gray-700">
              Якщо лист не прийшов протягом 10-15 хвилин, перевірте папку Спам та натисніть кнопку нижче.
            </p>

            <button
              onClick={resendConfirmationEmail}
              disabled={loading || !canResend}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
            >
              {loading ? "Надсилаємо..." : "Надіслати лист ще раз"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
