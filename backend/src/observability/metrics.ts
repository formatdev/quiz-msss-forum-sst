type CounterName =
  | 'session_started'
  | 'session_completed'
  | 'export_downloaded'
  | 'admin_initialized'
  | 'db_error'
  | 'request_count';

type HistogramName = 'request_latency_ms';

class MetricsStore {
  private counters = new Map<string, number>();
  private histograms = new Map<string, number[]>();

  increment(name: CounterName, by = 1): void {
    const value = this.counters.get(name) ?? 0;
    this.counters.set(name, value + by);
  }

  observe(name: HistogramName, value: number): void {
    const list = this.histograms.get(name) ?? [];
    list.push(value);
    this.histograms.set(name, list);
  }

  snapshot(): Record<string, unknown> {
    const histogramSummary = Array.from(this.histograms.entries()).reduce<Record<string, unknown>>(
      (acc, [key, values]) => {
        if (values.length === 0) {
          acc[key] = { count: 0, p95: 0 };
          return acc;
        }
        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
        acc[key] = { count: sorted.length, p95: sorted[index] };
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
