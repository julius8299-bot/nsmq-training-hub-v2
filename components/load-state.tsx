"use client";

import Link from "next/link";
import type { ApiError } from "@/lib/client/api";
import { signInHref } from "@/lib/client/api";

export function LoadState({ loading, error, onRetry, label = "Loading questions…" }: { loading: boolean; error: ApiError | null; onRetry?: () => void; label?: string }) {
  if (error) {
    return (
      <div role="alert" className="panel p-6 text-sm text-red-800">
        <p className="font-bold">{error.message}</p>
        {error.status === 401
          ? <Link className="mt-2 inline-block font-bold underline" href={signInHref()}>Sign in again</Link>
          : onRetry && <button type="button" className="mt-2 font-bold underline" onClick={onRetry}>Try again</button>}
      </div>
    );
  }
  if (loading) return <div className="panel p-8 text-ink/50">{label}</div>;
  return null;
}
