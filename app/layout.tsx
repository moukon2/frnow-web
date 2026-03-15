import "./globals.css";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-black text-white">

        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">

            <Link
              href="/"
              className="text-base font-semibold tracking-tight text-white"
            >
              FRNow
            </Link>

            <SiteNav />

          </div>
        </header>

        <main>{children}</main>

      </body>
    </html>
  );
}