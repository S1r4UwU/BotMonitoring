enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

class Logger {
  private level: LogLevel = (process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO);
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private log(level: LogLevel, message: string, data?: unknown) {
    if (level < this.level) return;

    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const context = this.context;

    if (process.env.NODE_ENV === 'development') {
      console.log(JSON.stringify({
        timestamp,
        level: levelName,
        context,
        message,
        data,
      }));
    } else {
      // Journaliser un résumé minimal en production
      console.log(`[${timestamp}] ${levelName} ${context}: ${message}`);
      this.sendToLoggingService().catch(() => {});
    }
  }

  info(message: string, data?: unknown) { this.log(LogLevel.INFO, message, data); }
  warn(message: string, data?: unknown) { this.log(LogLevel.WARN, message, data); }
  error(message: string, data?: unknown) { this.log(LogLevel.ERROR, message, data); }
  debug(message: string, data?: unknown) { this.log(LogLevel.DEBUG, message, data); }

  private async sendToLoggingService() {
    return Promise.resolve();
  }
}

export const logger = new Logger('SocialGuard');
export { LogLevel, Logger };


