import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: { default: "مالي", template: "%s | مالي" },
  description: "إدارة مالية شخصية واضحة وبسيطة بالريال السعودي",
  applicationName: "مالي",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/mali-icon.svg", sizes: "any", type: "image/svg+xml" }],
  },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "مالي" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f6f4" },
    { media: "(prefers-color-scheme: dark)", color: "#09120f" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl" suppressHydrationWarning><body><ThemeProvider>{children}<PwaRegister/></ThemeProvider></body></html>;
}
