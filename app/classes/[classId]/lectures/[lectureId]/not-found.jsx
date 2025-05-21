import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Lecture Not Found
        </h2>
        <p className="text-gray-600 mb-4">
          The lecture you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <p>We couldn&apos;t find what you&apos;re looking for.</p>
        <Link
          href="/classes"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Return to Classes
        </Link>
      </div>
    </div>
  );
}
