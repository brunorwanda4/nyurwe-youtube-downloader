import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YtGrab — Keep the videos worth keeping",
  description: "A private desktop downloader for saving video, audio, and playlists.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
