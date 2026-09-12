import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Tether",
  description: "Paste your tasks. Pick someone to keep you honest.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full antialiased ${inter.variable}`}>
      <body className="flex min-h-full flex-col bg-bg font-sans text-fg">
        <Header />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
