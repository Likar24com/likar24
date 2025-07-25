"use client";

import React, { useState } from "react";
import PatientInfoPanel from "./PatientInfoPanel";
import PatientAppointmentsPanel from "./PatientAppointmentsPanel";

const TABS = [
  { key: "info", label: "Мої дані", content: <PatientInfoPanel /> },
  { key: "appointments", label: "Мої записи", content: <PatientAppointmentsPanel /> },
];

export default function PatientCabinetTabs() {
  const [activeTab, setActiveTab] = useState<"info" | "appointments">("info");

  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-stretch w-full">
      {/* Бокове меню: вертикальне на десктопі, горизонтальне на мобілці */}
      <nav
        className="w-full sm:w-56 bg-gray-50 border-b sm:border-b-0 sm:border-r flex flex-row sm:flex-col py-2 sm:py-6 sticky top-0 sm:top-8 rounded-2xl shadow-lg h-fit sm:min-h-[180px] z-10 overflow-x-auto sm:overflow-visible"
        style={{ alignSelf: "flex-start" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={
              `px-4 sm:px-6 py-3 text-left text-base sm:text-lg font-medium transition-colors 
              rounded-none sm:rounded-l-none sm:rounded-r-full
              ${
                activeTab === tab.key
                  ? "bg-blue-100 text-blue-700 shadow"
                  : "hover:bg-gray-100 text-gray-700"
              }`
            }
            onClick={() => setActiveTab(tab.key as "info" | "appointments")}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Контент вкладки */}
      <div className="flex-1 min-w-0 max-w-2xl">
        {TABS.find((t) => t.key === activeTab)?.content}
      </div>
    </div>
  );
}
