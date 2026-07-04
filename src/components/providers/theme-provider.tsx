"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Wraps next-themes with our defaults:
 * - attribute="class"  → toggles `class="dark"` on <html>
 * - defaultTheme="dark"  → match the existing visual design
 * - enableSystem  → follow OS preference when user hasn't chosen
 * - disableTransitionOnChange  → avoid flicker on toggle
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
