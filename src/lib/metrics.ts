export type MetricPayload = {
  name: string;
  duration: number;
  meta?: Record<string, string | number | boolean | undefined>;
};

// Simple client-side metrics helper: logs to console and can be extended to sendBeacon later.
export async function measureAsync<T>(
  name: string,
  run: () => Promise<T>,
  meta?: MetricPayload["meta"]
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await run();
  const duration = performance.now() - start;
  reportMetric({ name, duration, meta });
  return { result, duration };
}

export function reportMetric(metric: MetricPayload) {
  if (typeof window === "undefined") return;
  // For now just log; can be swapped with sendBeacon to an endpoint.
  console.debug("[metric]", metric.name, `${Math.round(metric.duration)}ms`, metric.meta || {});
}
