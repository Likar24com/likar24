import "./globals.css";
import Header from "@/components/Header";

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
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
