type CounterName =
  | 'session_started'
  | 'session_completed'
  | 'export_downloaded'
  | 'admin_initialized'
  | 'db_error'
  | 'request_count';

type HistogramName = 'request_latency_ms';

const HISTOGRAM_SAMPLE_LIMIT = 5_000;

type HistogramBucket = {
  values: number[];
  nextIndex: number;
  observedCount: number;
};

class MetricsStore {
  private counters = new Map<string, number>();
  private histograms = new Map<string, HistogramBucket>();

  increment(name: CounterName, by = 1): void {
    const value = this.counters.get(name) ?? 0;
    this.counters.set(name, value + by);
  }

  observe(name: HistogramName, value: number): void {
    const bucket = this.histograms.get(name) ?? {
      values: [],
      nextIndex: 0,
      observedCount: 0
    };

    if (bucket.values.length < HISTOGRAM_SAMPLE_LIMIT) {
      bucket.values.push(value);
    } else {
      bucket.values[bucket.nextIndex] = value;
      bucket.nextIndex = (bucket.nextIndex + 1) % HISTOGRAM_SAMPLE_LIMIT;
    }

    bucket.observedCount += 1;
    this.histograms.set(name, bucket);
  }

  snapshot(): Record<string, unknown> {
    const histogramSummary = Array.from(this.histograms.entries()).reduce<Record<string, unknown>>(
      (acc, [key, bucket]) => {
        if (bucket.values.length === 0) {
          acc[key] = { count: 0, observedCount: bucket.observedCount, p95: 0 };
          return acc;
        }
        const sorted = [...bucket.values].sort((a, b) => a - b);
        const index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
        acc[key] = {
          count: sorted.length,
          observedCount: bucket.observedCount,
          p95: sorted[index]
        };
        return acc;
      },
      {}
    );

    return {
      counters: Object.fromEntries(this.counters.entries()),
      histograms: histogramSummary
    };
  }
}

export const metrics = new MetricsStore();
