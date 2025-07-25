"use client";

import React, { useState } from "react";
import DoctorProfileInfo from "./DoctorProfileInfo";

// Тимчасові заглушки для вкладок
function DoctorAppointments() {
  return (
    <div className="text-gray-500 p-8 w-full max-w-2xl mx-auto">
      Тут буде таблиця “Мої консультації”
    </div>
  );
}
function DoctorFinance() {
  return (
    <div className="text-gray-500 p-8 w-full max-w-2xl mx-auto">
      Тут буде блок “Мої фінанси”
    </div>
  );
}
function DoctorServices() {
  return (
    <div className="text-gray-500 p-8 w-full max-w-2xl mx-auto">
      Тут буде додавання/редагування послуг
    </div>
  );
}
function DoctorSchedule() {
  return (
    <div className="text-gray-500 p-8 w-full max-w-2xl mx-auto">
      Тут буде робочий календар
    </div>
  );
}

const TABS = [
  { key: "profile", label: "Мої дані", content: <DoctorProfileInfo /> },
  { key: "appointments", label: "Мої консультації", content: <DoctorAppointments /> },
  { key: "finance", label: "Мої фінанси", content: <DoctorFinance /> },
  { key: "services", label: "Мої послуги", content: <DoctorServices /> },
  { key: "schedule", label: "Мій робочий графік", content: <DoctorSchedule /> },
];

export default function DoctorCabinetTabs() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-stretch w-full">
      {/* Меню: горизонтально на мобілці, вертикально на десктопі */}
      <nav
        className="w-full sm:w-56 bg-gray-50 border-b sm:border-b-0 sm:border-r flex flex-row sm:flex-col py-2 sm:py-6 sticky top-0 sm:top-8 rounded-2xl shadow-lg h-fit sm:min-h-[300px] z-10 overflow-x-auto sm:overflow-visible"
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
            onClick={() => setActiveTab(tab.key)}
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
