'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <Card className="bg-primary-300 border-primary-500 rounded-2xl shadow-md p-8 max-w-md">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h2 className="font-display text-2xl font-semibold text-secondary-700">
              Something went wrong
            </h2>
            <p className="text-secondary-500 text-sm">
              {error.message || "An unexpected error occurred"}
            </p>
          </div>
          <Button
            onClick={reset}
            className="bg-sage-400 hover:bg-sage-500 text-white rounded-xl px-6 py-3"
          >
            Try again
          </Button>
        </div>
      </Card>
    </div>
  );
}
