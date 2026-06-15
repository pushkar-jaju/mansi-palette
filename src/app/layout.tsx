import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { getSession } from "@/lib/auth";
import "./globals.css";

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
      className="h-full antialiased"
      style={{
        "--font-sans": 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        "--font-dm-mono": 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        "--font-instrument-serif": 'Georgia, Cambria, "Times New Roman", Times, serif',
      } as React.CSSProperties}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers initialUser={user}>{children}</Providers>
      </body>
    </html>
  );
}
