import type { Metadata } from "next";
import "./globals.css";
import { ConditionalWrapper } from "@/components/ConditionalWrapper";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "Belan",
  description: "Restaurant voice AI management dashboard",
  icons: {
    icon: [
      { url: "/BelanLogo.png", sizes: "32x32", type: "image/png" },
      { url: "/BelanLogo.png", sizes: "64x64", type: "image/png" },
      { url: "/BelanLogo.png", sizes: "192x192", type: "image/png" },
    ],
    apple: { url: "/BelanLogo.png", sizes: "180x180", type: "image/png" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <ConditionalWrapper>{children}</ConditionalWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
