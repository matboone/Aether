import type { Metadata } from "next";
import { Bodoni_Moda, Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

/**
 * Welcome “Aether” wordmark: Bodoni Moda Italic (Google Fonts). Optional override:
 * licensed Editorial New at public/fonts/Editorial-New-Italic.woff2 (see public/fonts/README.txt).
 */
const aetherWordmark = Bodoni_Moda({
  subsets: ["latin"],
  weight: "500",
  style: "italic",
  variable: "--font-aether-wordmark",
  display: "swap",
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: "Aether — Medical Bill Resolution",
  description:
    "Your sanctuary for navigating medical bills with clarity and confidence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable} ${aetherWordmark.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
