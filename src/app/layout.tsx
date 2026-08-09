import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
export const metadata = { title: "مالي", description: "مساعدك المالي الشخصي" };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ar" dir="rtl" suppressHydrationWarning><body><ThemeProvider>{children}</ThemeProvider></body></html>}
