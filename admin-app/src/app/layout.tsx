import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Grocery-Go Admin - Customer Order Management",
  description: "Professional admin panel for managing customer orders, products, and users. Built with Next.js and Supabase.",
  keywords: ["Grocery-Go", "Admin Panel", "Order Management", "Next.js", "TypeScript", "Tailwind CSS", "Supabase"],
  authors: [{ name: "Grocery-Go Team" }],
  icons: {
    icon: "/icon-192x192.png",
    apple: "/icon-192x192.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Grocery-Go Admin",
  },
  openGraph: {
    title: "Grocery-Go Admin Panel",
    description: "Professional customer order management system",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Grocery-Go Admin Panel",
    description: "Professional customer order management system",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
