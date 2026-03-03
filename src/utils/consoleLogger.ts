export type LogPayload = Record<string, unknown>;

type ConsoleLike = Pick<Console, 'info' | 'warn' | 'error'>;

function write(
  consoleLike: ConsoleLike,
  level: keyof ConsoleLike,
  prefix: string,
  event: string,
  payload?: LogPayload,
) {
  const message = `${prefix} ${event}`;
  if (payload !== undefined) {
    consoleLike[level](message, payload);
    return;
  }
  consoleLike[level](message);
}

export function createConsoleLogger(prefix: string, consoleLike: ConsoleLike = console) {
  return {
    info(event: string, payload?: LogPayload) {
      write(consoleLike, 'info', prefix, event, payload);
    },
    warn(event: string, payload?: LogPayload) {
      write(consoleLike, 'warn', prefix, event, payload);
    },
    error(event: string, payload?: LogPayload) {
      write(consoleLike, 'error', prefix, event, payload);
    },
  };
}

