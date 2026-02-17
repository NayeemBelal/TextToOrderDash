import type { Metadata } from "next";
import "./globals.css";
import { FloatingChatbot } from "@/components";

export const metadata: Metadata = {
  title: "TextToOrder Dashboard",
  description: "Restaurant command center for AI-powered SMS ordering",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <FloatingChatbot restaurantName="Burger Palace" />
      </body>
    </html>
  );
}
