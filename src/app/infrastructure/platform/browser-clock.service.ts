import type { ClockPort } from '../../application/ports/clock.port';

export class BrowserClockService implements ClockPort {
  now(): Date {
    return new Date();
  }

  formatShortDateTime(date: Date, locale: string): string {
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    }).format(date);
  }
}
