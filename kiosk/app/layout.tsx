import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import ThemeToggle from "../components/ThemeToggle";
import ManagerButton from "../components/ManagerButton";
import CashierButton from "../components/CashierButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kiosk - Place an Order",
  description: "Boba tea kiosk ordering system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <ThemeToggle />
          <ManagerButton />
          <CashierButton />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
