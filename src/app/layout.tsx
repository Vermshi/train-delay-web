import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Forsinkede tog",
  description:
    "Historiske togforsinkelser mellom norske stasjoner via Entur BigQuery",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nb" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const t=localStorage.getItem('theme');if(t!=='light')document.documentElement.classList.add('dark')}catch{}`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
