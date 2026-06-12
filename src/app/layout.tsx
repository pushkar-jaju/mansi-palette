import type { Metadata } from "next";
import { Inter, DM_Mono, Instrument_Serif } from "next/font/google";
import { Providers } from "@/components/providers";
import { getSession } from "@/lib/auth";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const dmMono = DM_Mono({
  weight: ["400"],
  variable: "--font-dm-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  weight: ["400"],
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Mansi's Palette | Premium Fine Art & Custom Commissions",
  description: "Explore exquisite hand-painted fine art, landscapes, florals, and abstracts by Mansi. Request custom painting commissions and buy premium original canvases.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSession();

  return (
    <html
      lang="en"
      className={`${inter.variable} ${dmMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers initialUser={user}>{children}</Providers>
      </body>
    </html>
  );
}
