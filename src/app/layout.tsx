import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastViewport } from "@/components/ui/toast-viewport";
import { HtmlLangSync } from "@/i18n/html-lang-sync";
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
          <RiseFallSync />
          <MockMarketTicker />
          <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.08),transparent_24%)] dark:bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.12),transparent_24%),#020617]">
            <SiteHeader />
            {/* No width constraint here — each page chooses its own container.
                Content pages wrap with `max-w-7xl`; /trade takes full width. */}
            <main className="flex flex-1 flex-col">{children}</main>
            <ToastViewport />
            <CommandPalette />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
