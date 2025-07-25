"use client";

import React, { useEffect, useState } from "react";
import NextAppointmentDoctor from "@/components/doctor/NextAppointmentDoctor";
import DoctorCabinetTabs from "@/components/doctor/DoctorCabinetTabs";
import { supabase } from "@/lib/supabaseClient";

type Appointment = {
  id: string;
  dateTime: string;
  patientName: string;
  type: "Відео" | "Аудіо" | "Чат";
  status: string;
};

export default function DoctorCabinetPage() {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [unconfirmedCount, setUnconfirmedCount] = useState<number>(0);

  useEffect(() => {
    async function fetchNextAppointment() {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data } = await supabase
        .from("appointments")
        .select("id, date_time, patient_name, type, status")
        .eq("doctor_id", user.id)
        .gte("date_time", new Date().toISOString())
        .order("date_time", { ascending: true })
        .limit(1)
        .single();

      if (data) {
        setAppointment({
          id: data.id,
          dateTime: new Date(data.date_time).toLocaleString(),
          patientName: data.patient_name,
          type: data.type,
          status: data.status,
        });
      }
    }

    async function fetchUnconfirmedCount() {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { count } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("doctor_id", user.id)
        .eq("status", "Не підтверджено");

      setUnconfirmedCount(count || 0);
    }

    fetchNextAppointment();
    fetchUnconfirmedCount();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="flex justify-center py-4 sm:py-8 px-2 sm:px-4">
        <div className="w-full max-w-4xl flex flex-col gap-4 sm:gap-6">
          <NextAppointmentDoctor
            appointment={appointment}
            unconfirmedCount={unconfirmedCount}
          />
          <DoctorCabinetTabs />
        </div>
      </main>
    </div>
  );
}
