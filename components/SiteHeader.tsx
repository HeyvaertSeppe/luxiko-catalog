import Link from "next/link";

export function SiteHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center" aria-label="LUXIKO catalog home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-dark.png" alt="LUXIKO · Betaalbaar licht & geluid" className="h-9 w-auto sm:h-11" />
        </Link>
        <div className="flex items-center gap-3">{children}</div>
      </div>
    </header>
  );
}
