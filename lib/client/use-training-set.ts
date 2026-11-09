"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/client/api";
import type { PublicQuestion } from "@/lib/types";

/** Loads a random set of distinct questions; reload() fetches a new set, avoiding the one just played. */
export function useTrainingSet(params: Record<string, string | undefined> | null) {
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [loading, setLoading] = useState(Boolean(params));
  const [error, setError] = useState<ApiError | null>(null);
  const [version, setVersion] = useState(0);
  const key = params ? JSON.stringify(params) : null;

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    setLoading(true); setError(null);
    const query = new URLSearchParams(Object.entries(JSON.parse(key) as Record<string, string | undefined>).filter((entry): entry is [string, string] => Boolean(entry[1])));
    api<{ questions: PublicQuestion[] }>("/api/training/questions?" + query)
      .then((data) => { if (!cancelled) setQuestions(data.questions); })
      .catch((caught) => { if (!cancelled) { setError(caught as ApiError); setQuestions([]); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [key, version]);

  const reload = useCallback(() => setVersion((value) => value + 1), []);
  return { questions, loading, error, reload, version };
}
