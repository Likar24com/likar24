"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ConfirmedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Підтвердження email...");

  useEffect(() => {
    async function confirmEmail() {
      const accessToken = searchParams.get("access_token");
      const refreshToken = searchParams.get("refresh_token");

      if (!accessToken || !refreshToken) {
        setMessage("Некоректне або вічччдсутнє посилання для підтвердження.");
        return;
      }

      // Передаємо обидва токени у setSession
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        setMessage("Помилка підтвердження: " + error.message);
        return;
      }

      setMessage("Email підтверджено! Завантажуємо дані...");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage("Не вдалося завантfdfажити дані користувача.");
        return;
      }

      const role = user.user_metadata.role;

      if (role === "doctor") {
        router.replace("/profile-setup/doctor");
      } else {
        router.replace("/profile-setup/patient");
      }
    }

    confirmEmail();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-blue-50 text-center max-w-md mx-auto rounded-lg shadow">
      <p className="text-lg font-semibold">{message}</p>
    </div>
  );
}
