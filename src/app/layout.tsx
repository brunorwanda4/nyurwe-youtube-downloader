import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nyurwe — YouTube Downloader",
  description: "A private desktop downloader for videos you own or have permission to save.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
