import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import YouTubeBackground from "./uIComponents/YouTubeBackground";
import VantaBackground from "./uIComponents/VantaBackground";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI agents - 44.01",
  description: "Comprehensive dashboard for AI agents for internal use",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full `} 
      >
        {/* <YouTubeBackground /> */}
        <VantaBackground />
        {children}
      </body>
    </html>
  );
}

