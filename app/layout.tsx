import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.scss";
import { SmoothScroll } from "@/components/MotionRuntime";
import { ScrollProgress } from "@/components/ScrollProgress";
import { MotionPreferenceProvider } from "@/components/MotionPreference";
import { GuidedTourProvider } from "@/components/GuidedTour";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-brand", display: "swap" });

export const metadata: Metadata = {
  title: "Vansh Sharma — Software Engineer & Full Stack Developer",
  description: "Vansh Sharma builds useful digital products across full-stack engineering, AI-powered applications, and thoughtful interactive experiences.",
  applicationName: "Vansh Sharma Portfolio",
  openGraph: {
    title: "Vansh Sharma — Software Engineer & Full Stack Developer",
    description: "Building useful digital products where engineering meets experience.",
    type: "website",
  },
  twitter: { card: "summary", title: "Vansh Sharma — Software Engineer", description: "Building useful digital products where engineering meets experience." },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#080807", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} ${cormorant.variable}`}><body><MotionPreferenceProvider><GuidedTourProvider><SmoothScroll /><ScrollProgress />{children}</GuidedTourProvider></MotionPreferenceProvider></body></html>;
}
