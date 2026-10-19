import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "XAU/USD Intelligence Terminal | Real-Time Gold Analytics",
  description:
    "Institutional grade XAU/USD intelligence terminal, live radar scanners, quantitative price action models, and algorithmic order book flow.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-terminal-black text-gray-200 antialiased font-mono flex flex-col">
        <Header session={session} />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
