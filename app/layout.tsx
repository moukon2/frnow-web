import "./globals.css";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "FRNow",
  description: "Funding Rate × Open Interest alerts",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-black text-white">

        <Navbar />

        <main className="min-h-screen">
          {children}
        </main>

        <Footer />

      </body>
    </html>
  );
}