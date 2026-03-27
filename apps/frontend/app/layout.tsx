import type { Metadata } from "next";
import { Inter, Epilogue } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import OfflineIndicator from "@/components/ui/OfflineIndicator";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from 'sonner';
import GlobalErrorModal from "@/components/common/GlobalErrorModal";
import SkipLinks from "@/components/common/SkipLinks";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const epilogue = Epilogue({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-epilogue",
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
      <body className={`${inter.variable} ${epilogue.variable} antialiased`}>
        <ErrorBoundary>
          <Providers>
            <SkipLinks />
            <OfflineIndicator />
            <GlobalErrorModal />
            <AuthProvider>
              <Toaster
                position="top-right"
                richColors
                closeButton
                duration={4000}
                style={{ zIndex: 9999 }}
              />
              {children}
            </AuthProvider>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}