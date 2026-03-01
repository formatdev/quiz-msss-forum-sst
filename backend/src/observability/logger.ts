type LogLevel = 'info' | 'warn' | 'error';

type LogPayload = Record<string, unknown>;

function write(level: LogLevel, message: string, payload: LogPayload = {}): void {
  const line = {
    ts: new Date().toISOString(),
    level,
    message,
    ...payload
  };
  process.stdout.write(`${JSON.stringify(line)}\n`);
}

export const logger = {
  info(message: string, payload?: LogPayload): void {
    write('info', message, payload);
  },
  warn(message: string, payload?: LogPayload): void {
    write('warn', message, payload);
  },
  error(message: string, payload?: LogPayload): void {
    write('error', message, payload);
  }
};
