import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  return {
    metadataBase: new URL(origin),
    title: "Ruddy's — Hamburguesas",
    description: "Armá tu hamburguesa capa por capa o elegí una de las favoritas de Ruddy's.",
    icons: { icon: "/brand/logo-mark.png", shortcut: "/brand/logo-mark.png", apple: "/brand/logo-mark.png" },
    openGraph: {
      title: "Ruddy's — Tu burger, a tu manera",
      description: "Ingredientes reales, precio en vivo y una burger hecha por vos.",
      type: "website",
      images: [{ url: `${origin}/og.png`, width: 1680, height: 945, alt: "Ruddy's — Tu burger, a tu manera" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Ruddy's — Tu burger, a tu manera",
      description: "Ingredientes reales, precio en vivo y una burger hecha por vos.",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
