"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils"; // якщо ще не маєш – додам нижче
import PatientInfoPanel from "./PatientInfoPanel"; // буде наступним кроком
import PatientAppointmentsPanel from "./PatientAppointmentsPanel"; // буде після

export default function PatientCabinetTabs() {
  const [activeTab, setActiveTab] = useState<"info" | "appointments">("info");

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Бокове меню */}
      <div className="md:w-1/4 w-full">
        <div className="bg-white rounded-xl shadow p-4 flex md:flex-col justify-between gap-4">
          <button
            className={cn(
              "px-4 py-2 rounded-xl text-left transition",
              activeTab === "info"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            )}
            onClick={() => setActiveTab("info")}
          >
            Мої дані
          </button>
          <button
            className={cn(
              "px-4 py-2 rounded-xl text-left transition",
              activeTab === "appointments"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            )}
            onClick={() => setActiveTab("appointments")}
          >
            Мої записи
          </button>
        </div>
      </div>

      {/* Контент вкладки */}
      <div className="flex-1 bg-white rounded-xl shadow p-4">
        {activeTab === "info" ? (
          <PatientInfoPanel />
        ) : (
          <PatientAppointmentsPanel />
        )}
      </div>
    </div>
  );
}
