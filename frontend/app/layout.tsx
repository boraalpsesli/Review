import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { auth } from "@/auth";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InsightFlow - Restaurant Analytics",
  description: "AI-powered analysis for your restaurant reviews",
  icons: {
    icon: "/logo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={`${jakartaSans.variable} antialiased`}>
        <AuthProvider session={session}>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
