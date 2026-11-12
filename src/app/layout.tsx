import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
      className={`${inter.variable} ${inter.className} h-full min-h-dvh`}
    >
      <head>
        <link rel="stylesheet" href="/cesium/Widgets/widgets.css" />
        <link rel="stylesheet" href="/maplibre-gl.css" />
      </head>
      <body className="h-dvh min-h-dvh overflow-hidden bg-[#07080b] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
