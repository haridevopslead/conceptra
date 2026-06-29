import type { Metadata } from "next";
import Providers from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Conceptra — Ace Your DevOps Interview",
  description: "AI-powered coaching built by a Lead DevOps Engineer. Practice real interview scenarios, get instant feedback, and land your dream role.",
  metadataBase: new URL("https://conceptra.in"),
  openGraph: {
    title: "Conceptra — Ace Your DevOps Interview",
    description: "AI-powered coaching built by a Lead DevOps Engineer. Practice real interview scenarios, get instant feedback, and land your dream role.",
    url: "https://conceptra.in",
    siteName: "Conceptra",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Conceptra — Ace Your DevOps Interview",
    description: "AI-powered coaching built by a Lead DevOps Engineer. Practice real interview scenarios, get instant feedback, and land your dream role.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&family=Hanken+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
