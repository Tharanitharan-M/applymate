import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ApplyMate - Smart Job Application Tracker with AI Resume Analysis",
    template: "%s | ApplyMate",
  },
  description: "Track job applications, optimize resumes with AI-powered ATS analysis, and land your dream job. Organize your entire job search in one intelligent platform.",
  keywords: ["job tracker", "application tracker", "resume analyzer", "ATS optimization", "job search", "career management", "AI resume", "job applications"],
  authors: [{ name: "ApplyMate" }],
  creator: "ApplyMate",
  publisher: "ApplyMate",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  applicationName: "ApplyMate",
  referrer: "origin-when-cross-origin",
  category: "productivity",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "ApplyMate - Smart Job Application Tracker",
    description: "Track applications, optimize resumes with AI, and land your dream job.",
    siteName: "ApplyMate",
  },
  twitter: {
    card: "summary_large_image",
    title: "ApplyMate - Smart Job Application Tracker",
    description: "Track applications, optimize resumes with AI, and land your dream job.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification tokens when you have them
    // google: "your-google-verification-token",
    // yandex: "your-yandex-verification-token",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        {/* <link rel="apple-touch-icon" href="/icon-192.png" /> */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
