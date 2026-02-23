import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import OfflineIndicator from "@/components/ui/OfflineIndicator";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from 'react-hot-toast';
import GlobalErrorModal from "@/components/common/GlobalErrorModal";
import SkipLinks from "@/components/common/SkipLinks";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Align Designs Platform",
  description: "Project and file management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <ErrorBoundary>
          <SkipLinks />
          <OfflineIndicator />
          <GlobalErrorModal />
          <AuthProvider>
            <Toaster position="top-right" />
            {children}
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
