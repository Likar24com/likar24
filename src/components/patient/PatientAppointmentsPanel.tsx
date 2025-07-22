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
    <div className="max-w-2xl mx-auto py-6">
      {/* Верхній рядок */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold">Мої записи на консультацію</h2>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 border">
        {/* Таби */}
        <div className="flex gap-2 mb-4">
          <button
            className={`px-4 py-2 rounded-t-lg font-semibold border-b-2 ${
              tab === "future" ? "border-blue-600 text-blue-700 bg-blue-50" : "border-transparent text-gray-600"
            }`}
            onClick={() => setTab("future")}
          >
            Майбутні
          </button>
          <button
            className={`px-4 py-2 rounded-t-lg font-semibold border-b-2 ${
              tab === "past" ? "border-blue-600 text-blue-700 bg-blue-50" : "border-transparent text-gray-600"
            }`}
            onClick={() => setTab("past")}
          >
            Минули
          </button>
        </div>
        {/* Таблиця */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-500 text-sm">
                <th className="py-2 font-semibold">Дата</th>
                <th className="py-2 font-semibold">Лікар</th>
                <th className="py-2 font-semibold">Спеціальність</th>
                <th className="py-2 font-semibold">Статус</th>
                <th className="py-2 font-semibold"></th>
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
                      <button className="text-blue-600 hover:underline font-semibold">Перегляд</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
