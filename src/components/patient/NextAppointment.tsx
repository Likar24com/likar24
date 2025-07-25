import React from "react";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

type Appointment = {
  dateTime: string;
  doctorName: string;
  specialty: string;
  status: string;
  id?: string;
};

type Props = {
  appointment: Appointment | null;
};

export default function NextAppointment({ appointment }: Props) {
  const handleView = () => {
    if (appointment?.id) {
      window.location.href = `/patient/appointment/${appointment.id}`;
    } else {
      window.location.href = `/appointment/details`;
    }
  };

  return (
    <div className="relative bg-white rounded-2xl shadow p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
      {/* Основна інформація */}
      <div className="flex-1">
        <h2 className="text-lg sm:text-xl font-semibold mb-2">Мій найближчий запис</h2>
        {appointment ? (
          <div className="space-y-2">
            <div>
              <span className="font-medium">Дата та час:</span> {appointment.dateTime}
            </div>
            <div>
              <span className="font-medium">Лікар:</span> {appointment.doctorName}
            </div>
            <div>
              <span className="font-medium">Спеціальність:</span> {appointment.specialty}
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
          <div className="text-gray-500 italic">У вас немає запланованих записів.</div>
        )}
      </div>

      {/* Кнопка "Пошук лікаря" */}
      <div className="flex flex-col items-stretch md:items-end gap-2 mt-2 md:mt-0 md:ml-6 w-full md:w-auto">
        <Link href="/doctors/search" className="w-full md:w-auto">
          <button
            className="flex items-center justify-center gap-2 px-4 py-2 w-full md:w-auto rounded-xl font-semibold transition shadow bg-green-100 text-green-800 border border-green-400"
          >
            <AlertCircle size={20} className="text-green-600" />
            Пошук лікаря
          </button>
        </Link>
      </div>
    </div>
  );
}
