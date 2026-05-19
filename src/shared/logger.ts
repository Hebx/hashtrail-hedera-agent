export type Logger = {
  info: (event: string, fields?: Record<string, unknown>) => void;
  error: (event: string, fields?: Record<string, unknown>) => void;
};

function write(level: 'info' | 'error', event: string, fields?: Record<string, unknown>): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...fields,
  });
  const stream = level === 'error' ? process.stderr : process.stdout;
  stream.write(`${line}\n`);
}

export const logger: Logger = {
  info: (event, fields) => write('info', event, fields),
  error: (event, fields) => write('error', event, fields),
};
