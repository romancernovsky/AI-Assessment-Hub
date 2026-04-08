import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import AuthProvider from "@/providers/AuthProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";

/* Novartis brand font: Volta Modern Display (self-hosted .woff)
   Loaded via @font-face in globals.css
   Fallback chain: Arial, Helvetica, sans-serif */

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AIHub Assessment",
  description: "AI competency assessment platform measuring realistic judgment and applied skills.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jetbrainsMono.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>
            <div className="nvs-gradient-stripe" />
            <Navbar />
            <main className="pt-24 pb-12 max-w-[1400px] mx-auto px-6 min-h-screen">
              {children}
            </main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
