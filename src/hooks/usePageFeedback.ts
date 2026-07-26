"use client";

import { useCallback, useState } from "react";

export function usePageFeedback() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const clearFeedback = useCallback(() => {
    setError(null);
    setMessage(null);
  }, []);

  return {
    error,
    message,
    setError,
    setMessage,
    clearFeedback,
  };
}
