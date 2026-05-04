import type { Metadata } from "next";
import "./globals.css";
import { ConditionalWrapper } from "@/components/ConditionalWrapper";

export const metadata: Metadata = {
  title: "Belan AI — Dashboard",
  description: "Restaurant voice AI management dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ConditionalWrapper>{children}</ConditionalWrapper>
      </body>
    </html>
  );
}
