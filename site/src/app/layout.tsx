import Script from "next/script";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { site } from "@/content/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: `${site.owner.name} — ${site.owner.title}`,
    template: `%s — ${site.owner.name}`,
  },
  description: site.owner.tagline,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen bg-facility-bg font-sans text-facility-text antialiased">
        {children}
        <Script
  src="https://static.cloudflareinsights.com/beacon.min.js"
  strategy="afterInteractive"
  data-cf-beacon='{"token":"175ab60419af42ed96999bd5dc5ad190"}'
/>
      </body>
    </html>
  );
}
