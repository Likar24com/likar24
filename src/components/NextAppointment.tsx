import React from "react";
import { Button } from "@/components/ui/button";
import { CalendarClock, User, Stethoscope, Info } from "lucide-react";
import Link from "next/link";

type Appointment = {
  dateTime: string;
  doctorName: string;
  specialty: string;
  status: string;
};

type Props = {
  appointment: Appointment | null;
};

export default function NextAppointment({ appointment }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">Мій найближчий запис</h2>

      {appointment ? (
        <div className="space-y-3">
          <p className="flex items-center gap-2">
            <CalendarClock className="text-blue-500" />{" "}
            <strong>Дата та час:</strong> {appointment.dateTime}
          </p>
          <p className="flex items-center gap-2">
            <User className="text-green-500" />{" "}
            <strong>Лікар:</strong> {appointment.doctorName}
          </p>
          <p className="flex items-center gap-2">
            <Stethoscope className="text-purple-500" />{" "}
            <strong>Спеціальність:</strong> {appointment.specialty}
          </p>
          <p className="flex items-center gap-2">
            <Info className="text-orange-500" />{" "}
            <strong>Статус:</strong> {appointment.status}
          </p>

          <Link href="/appointment/details">
            <Button className="mt-4">Перегляд</Button>
          </Link>
        </div>
      ) : (
        <p className="text-gray-600">У вас немає запланованих записів.</p>
      )}

      <Link href="/doctors/search">
        <Button className="mt-6 bg-green-600 hover:bg-green-700">
          Пошук лікаря
        </Button>
      </Link>
    </div>
  );
}
