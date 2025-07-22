import "./globals.css";
import Header from "@/components/Header";
import { Toaster } from "sonner";

export const metadata = {
  title: "Likar24",
  description: "Онлайн медичні консультації",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk">
      <body className="bg-gray-50 text-gray-900">
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
