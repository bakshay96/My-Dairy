import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import ThemeInitializer from "@/components/ui/ThemeInitializer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Milkify Admin Dashboard",
  description: "Modern dairy collection and billing platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeInitializer />
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
