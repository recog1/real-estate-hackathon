import type { Metadata } from "next";
import { Barlow_Condensed, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const display = Barlow_Condensed({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-display",
});

const sans = IBM_Plex_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Asset Hawk — Orbital occupancy intelligence",
  description:
    "Occupancy underpins real-estate value. Asset Hawk lets investors underwrite multifamily deals from orbit — counting cars, estimating true occupancy, and challenging the seller pack before asking for documents.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full`}
    >
      <head>
        <link rel="stylesheet" href="/cesium/Widgets/widgets.css" />
      </head>
      <body className="h-full overflow-hidden bg-[#07080b] antialiased">
        {children}
      </body>
    </html>
  );
}
