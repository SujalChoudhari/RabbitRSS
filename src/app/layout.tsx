import type { Metadata } from "next";
import { DM_Serif_Display, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400", // Include necessary weights
});

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif-display",
  subsets: ["latin"],
  weight: "400", // Include necessary weights
});

export const metadata: Metadata = {
  title: "Rabbit RSS - Your Personalized Feed Reader",
  description:
    "Stay updated with Rabbit RSS, your modern and minimalistic RSS feed reader. Organize, browse, and read your favorite blogs and articles effortlessly.",
  keywords: [
    "RSS",
    "feed reader",
    "blogs",
    "news aggregator",
    "modern RSS reader",
    "minimalistic reader",
    "Rabbit RSS",
  ],
  applicationName: "Rabbit RSS",
  authors: [{ name: "Sujal Choudhari", url: "https://sujal.xyz" }],
  themeColor: "#ffffff",
  creator: "Sujal Choudhari",
  publisher: "Sujal Choudhari",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Rabbit RSS - Your Personalized Feed Reader",
    description:
      "Experience modern RSS reading with Rabbit RSS. Discover blogs, organize feeds, and stay informed with ease.",
    url: "https://rss.sujal.xyz",
    siteName: "Rabbit RSS",
    images: [
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@SujalChoudhari",
    title: "Rabbit RSS - Your Personalized Feed Reader",
    description:
      "Rabbit RSS: Discover and organize blogs and news in a sleek, modern feed reader.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${instrumentSerif.variable} ${dmSerifDisplay.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
