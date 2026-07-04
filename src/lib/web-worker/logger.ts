export class Logger {
  public static warn(message: string) {
    console.warn(`[web-worker]: ${message}`);
  }

  public static error(message: string) {
    console.error(`[web-worker]: ${message}`);
  }
}
