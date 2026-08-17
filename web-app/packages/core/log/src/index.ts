export type LogContext = Record<string, unknown>

export interface Logger {
  debug(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, error?: unknown, context?: LogContext): void
}

const format = (namespace: string, message: string, context?: LogContext) =>
  context ? [`[${namespace}] ${message}`, context] : [`[${namespace}] ${message}`]

export function createLogger(namespace: string): Logger {
  return {
    debug: (message, context) => console.debug(...format(namespace, message, context)),
    info: (message, context) => console.info(...format(namespace, message, context)),
    warn: (message, context) => console.warn(...format(namespace, message, context)),
    error: (message, error, context) =>
      console.error(...format(namespace, message, { ...context, error })),
  }
}

export const logger = createLogger('app')
