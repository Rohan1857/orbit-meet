import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "OrbitMeet — Video Conferencing",
  description: "Clean, reliable Zoom-style video conferencing web application.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-app text-text-primary antialiased flex flex-col">
        {children}
      </body>
    </html>
  );
}
