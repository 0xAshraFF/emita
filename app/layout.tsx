import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Emita",
  description: "Standard AI generates text. Emita emits lifelines.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Emita",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Panicked hands pinch by accident; a zoomed protocol is a lost protocol.
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0b",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
