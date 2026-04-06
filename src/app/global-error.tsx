"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-brand-bg">
          <div className="text-center p-8">
            <p className="text-4xl mb-4">😔</p>
            <h2 className="text-2xl font-bold text-brand-text mb-4">
              Что-то пошло не так
            </h2>
            <button
              onClick={() => reset()}
              className="bg-brand-dark text-white px-6 py-3 rounded-full font-bold"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
