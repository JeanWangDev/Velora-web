import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastViewport } from "@/components/ui/toast-viewport";
import { HtmlLangSync } from "@/i18n/html-lang-sync";
import { LocaleSync } from "@/i18n/locale-sync";
import { CommandPalette } from "@/components/command-palette";
import { MockMarketTicker } from "@/components/exchange/mock-market-ticker";
import { RiseFallSync } from "@/components/exchange/rise-fall-sync";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Velora · Trade with Clarity",
  description:
    "Velora — a next-generation crypto exchange with a focus-first trading terminal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning is required because next-themes mutates the
    // class on <html> on the client; without it React warns about a mismatch.
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider>
          <HtmlLangSync />
          <LocaleSync />
          <RiseFallSync />
          <MockMarketTicker />
          <div className="min-h-screen bg-background">
            <SiteHeader />
            <main className="flex flex-1 flex-col">{children}</main>
            <ToastViewport />
            <CommandPalette />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
