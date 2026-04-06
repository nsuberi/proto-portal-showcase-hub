import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-regolith flex items-center justify-center text-center">
      <div>
        <p className="text-8xl font-bold text-sediment mb-4">404</p>
        <h1 className="text-2xl font-bold text-deep-space mb-2">Lost in Space</h1>
        <p className="text-dust text-sm mb-1">You've drifted off course.</p>
        <p className="text-dust/60 text-xs mb-6">The coordinates don't match any known location.</p>
        <Link
          to="/"
          className="inline-block px-4 py-2 bg-instrument-blue text-shelter-white rounded-md text-sm font-medium hover:bg-instrument-blue/90 transition-colors"
        >
          Return to basecamp
        </Link>
      </div>
    </div>
  );
}
