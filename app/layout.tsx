import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coolify Convex Demo",
  description: "WSConsult Coolify and Convex deployment proof app.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
