"use client";

import React, { useEffect, useState } from "react";
import NextAppointment from "@/components/NextAppointment";
import PatientCabinetTabs from "@/components/patient/PatientCabinetTabs";
import { supabase } from "@/lib/supabaseClient";

type Appointment = {
  dateTime: string;
  doctorName: string;
  specialty: string;
  status: string;
};

export default function PatientCabinetPage() {
  const [appointment, setAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    async function fetchNextAppointment() {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data } = await supabase
        .from("appointments")
        .select("date_time, doctor_name, specialty, status")
        .eq("patient_id", user.id)
        .gte("date_time", new Date().toISOString())
        .order("date_time", { ascending: true })
        .limit(1)
        .single();

      if (data) {
        setAppointment({
          dateTime: new Date(data.date_time).toLocaleString(),
          doctorName: data.doctor_name,
          specialty: data.specialty,
          status: data.status,
        });
      }
    }

    fetchNextAppointment();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        <NextAppointment appointment={appointment} />
        <PatientCabinetTabs />
      </main>
    </div>
  );
}
