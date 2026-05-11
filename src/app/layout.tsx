import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Forsinkede tog",
    description: "Historiske togforsinkelser mellom norske stasjoner via Entur BigQuery",
};

const RootLayout = ({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) => (
    <html lang="nb" suppressHydrationWarning>
        <body className={`${inter.className} antialiased`}>
            <Script src="/theme-init.js" strategy="beforeInteractive" />
            {children}
        </body>
    </html>
);

export default RootLayout;
