"use client";

import React, { useState } from "react";

// Типізація для запису (поки мокові)
type Appointment = {
  id: string;
  date: string;
  doctor: string;
  specialty: string;
  status: "scheduled" | "done" | "cancelled";
};

const mockFuture: Appointment[] = [];
const mockPast: Appointment[] = [];

export default function PatientAppointmentsPanel() {
  const [tab, setTab] = useState<"future" | "past">("future");
  const appointments = tab === "future" ? mockFuture : mockPast;

  return (
    <div className="max-w-2xl mx-auto w-full">
      {/* Outer Card */}
      <div className="bg-white shadow-lg rounded-2xl p-0 mb-8 overflow-hidden">
        {/* Header Card */}
        <div className="flex items-center px-6 py-5 border-b">
          <h2 className="text-3xl font-bold">Мої записи на консультацію</h2>
        </div>
        {/* Inner Card */}
        <div className="bg-white rounded-2xl shadow p-3 sm:p-6 space-y-4">
          {/* Таби */}
          <div className="flex gap-2 mb-1 sm:mb-3">
            <button
              className={`flex-1 px-2 sm:px-4 py-2 rounded-t-lg font-semibold border-b-2
                ${tab === "future"
                  ? "border-blue-600 text-blue-700 bg-blue-50"
                  : "border-transparent text-gray-600 hover:bg-gray-100"}
              `}
              onClick={() => setTab("future")}
            >
              Майбутні
            </button>
            <button
              className={`flex-1 px-2 sm:px-4 py-2 rounded-t-lg font-semibold border-b-2
                ${tab === "past"
                  ? "border-blue-600 text-blue-700 bg-blue-50"
                  : "border-transparent text-gray-600 hover:bg-gray-100"}
              `}
              onClick={() => setTab("past")}
            >
              Минули
            </button>
          </div>
          {/* Таблиця */}
          <div
            className="overflow-x-auto"
            style={{
              scrollbarWidth: "none",       // Firefox
              msOverflowStyle: "none"       // IE/Edge
            }}
          >
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="text-gray-500 text-xs sm:text-sm">
                  <th className="py-2 font-semibold min-w-[110px]">Дата</th>
                  <th className="py-2 font-semibold min-w-[120px]">Лікар</th>
                  <th className="py-2 font-semibold min-w-[130px]">Спеціальність</th>
                  <th className="py-2 font-semibold min-w-[100px]">Статус</th>
                  <th className="py-2 font-semibold min-w-[70px]"></th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400 text-base">
                      {tab === "future"
                        ? "У вас ще немає майбутніх записів."
                        : "У вас ще не було консультацій."}
                    </td>
                  </tr>
                ) : (
                  appointments.map((a) => (
                    <tr key={a.id} className="border-t hover:bg-gray-50 transition">
                      <td className="py-3">
                        {new Date(a.date).toLocaleString("uk-UA", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3">{a.doctor}</td>
                      <td className="py-3">{a.specialty}</td>
                      <td className="py-3">
                        {a.status === "scheduled" && <span className="text-blue-600">Заплановано</span>}
                        {a.status === "done" && <span className="text-green-600">Завершено</span>}
                        {a.status === "cancelled" && <span className="text-red-500">Відмінено</span>}
                      </td>
                      <td className="py-3 text-right">
                        <button className="text-blue-600 hover:underline font-semibold text-sm sm:text-base">
                          Перегляд
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {/* Сховати webkit-scrollbar (Chrome, Safari, Edge) */}
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
          </div>
        </div>
      </div>
    </div>
  );
}
