import Link from "next/link";

/** Consistent top nav rendered once from the root layout, shared by every page. */
export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center gap-2 px-6 py-4">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-brand-fg shadow-[0_0_20px_-6px_var(--color-brand)]">
            T
          </span>
          <span className="text-lg font-semibold tracking-tight text-fg transition-colors group-hover:text-brand">
            Tether
          </span>
        </Link>
      </div>
    </header>
  );
}
