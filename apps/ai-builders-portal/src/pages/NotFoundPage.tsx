import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface text-center">
      <div>
        <p className="font-headline text-8xl font-bold text-surface-container-highest mb-4">404</p>
        <h1 className="font-headline text-2xl font-bold text-on-surface mb-2">Lost in Space</h1>
        <p className="font-body text-sm text-on-surface-variant mb-1">You've drifted off course.</p>
        <p className="font-body text-xs text-on-primary-container mb-6">The coordinates don't match any known location.</p>
        <Link
          to="/"
          className="inline-block rounded-lg bg-gradient-to-br from-primary to-on-primary-container px-5 py-2 font-label text-sm font-bold uppercase tracking-widest text-on-primary-fixed transition-all hover:brightness-110 active:scale-95"
        >
          Return to basecamp
        </Link>
      </div>
    </div>
  );
}
