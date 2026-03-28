import type { Metadata } from "next";
import type { ReactNode } from "react";

import Nav from "./Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Learnly",
  description: "Learnly is a unified learning platform for programming and spoken languages."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Nav />
        <main className="app-main">{children}</main>
      </body>
    </html>
  );
}
