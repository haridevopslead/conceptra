"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    // The app launched dark-only, so dark stays the default for every visitor
    // — enableSystem is off on purpose so an existing user's light-OS
    // preference can't silently flip their first visit to a theme they've
    // never seen. Users who want light switch explicitly via the toggle,
    // and next-themes persists that choice in localStorage from then on.
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <SessionProvider>{children}</SessionProvider>
    </ThemeProvider>
  );
}
