"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-cream-50">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-coffee-900 mb-4">
              Something went wrong!
            </h2>
            <button
              onClick={() => reset()}
              className="bg-coffee-600 text-white px-6 py-3 rounded-full"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
