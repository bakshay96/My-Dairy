import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import ThemeInitializer from "@/components/ui/ThemeInitializer";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

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
        <Toaster
          position="top-right"
          gutter={10}
          toastOptions={{
            duration: 3500,
            style: {
              borderRadius: "12px",
              background: "hsl(var(--card))",
              color: "hsl(var(--card-foreground))",
              border: "1px solid hsl(var(--border))",
              boxShadow: "0 10px 28px rgba(15, 23, 42, 0.12)",
            },
            success: {
              iconTheme: {
                primary: "#16a34a",
                secondary: "#ecfdf5",
              },
            },
            error: {
              iconTheme: {
                primary: "#dc2626",
                secondary: "#fef2f2",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
