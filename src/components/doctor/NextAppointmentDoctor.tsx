"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

type Appointment = {
  id: string;
  dateTime: string;
  patientName: string;
  type: "Відео" | "Аудіо" | "Чат";
  status: string;
};

interface Props {
  appointment: Appointment | null;
  unconfirmedCount: number;
}

export default function NextAppointmentDoctor({ appointment, unconfirmedCount }: Props) {
  // Відкрити сторінку консультації
  const handleView = () => {
    if (appointment) {
      window.location.href = `/doctor/appointment/${appointment.id}`;
    }
  };

  // Відкрити сторінку непідтверджених
  const handleUnconfirmed = () => {
    window.location.href = `/doctor/appointments?status=unconfirmed`;
  };

  return (
    <div className="relative bg-white rounded-2xl shadow p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
      {/* Основна інформація */}
      <div className="flex-1">
        <h2 className="text-lg sm:text-xl font-semibold mb-2">Моя найближча консультація</h2>
        {appointment ? (
          <div className="space-y-2">
            <div>
              <span className="font-medium">Дата та час:</span> {appointment.dateTime}
            </div>
            <div>
              <span className="font-medium">Пацієнт:</span> {appointment.patientName}
            </div>
            <div>
              <span className="font-medium">Тип:</span> {appointment.type}
            </div>
            <div>
              <span className="font-medium">Статус:</span>{" "}
              <span
                className={
                  appointment.status === "Підтверджено"
                    ? "text-green-600"
                    : appointment.status === "Не підтверджено"
                    ? "text-yellow-600"
                    : "text-gray-600"
                }
              >
                {appointment.status}
              </span>
            </div>
            <button
              onClick={handleView}
              className="w-full sm:w-auto mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition font-medium"
            >
              ПЕРЕГЛЯД
            </button>
          </div>
        ) : (
          <div className="text-gray-500 italic">Немає найближчих консультацій</div>
        )}
      </div>

      {/* Кнопка Непідтверджені консультації */}
      <div className="flex flex-col items-stretch md:items-end gap-2 mt-2 md:mt-0 md:ml-6 w-full md:w-auto">
        <button
          onClick={handleUnconfirmed}
          className={`flex items-center justify-center gap-2 px-4 py-2 w-full md:w-auto rounded-xl font-semibold transition shadow
            ${
              unconfirmedCount > 0
                ? "bg-yellow-100 text-yellow-800 border border-yellow-400 animate-pulse"
                : "bg-gray-100 text-gray-500 border border-gray-200"
            }
          `}
        >
          <AlertCircle size={20} />
          Непідтверджені консультації
          {unconfirmedCount > 0 && (
            <span className="ml-2 inline-block bg-yellow-600 text-white px-2 py-0.5 rounded-full text-sm">
              {unconfirmedCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
