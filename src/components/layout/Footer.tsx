import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-black/40">
      <div className="mx-auto max-w-7xl px-6 py-10 text-sm text-white/60">

        <div className="flex flex-col gap-6 md:flex-row md:justify-between">

          <div>
            <div className="font-semibold text-white">FRNow</div>
            <div className="mt-2 text-white/50">
              Funding Rate × Open Interest alerts
            </div>
          </div>

          <div className="flex gap-6">

            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>

            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>

            <Link href="/contact" className="hover:text-white">
              Contact
            </Link>

          </div>

        </div>

        <div className="mt-6 text-white/40">
          © {new Date().getFullYear()} FRNow
        </div>

      </div>
    </footer>
  );
}