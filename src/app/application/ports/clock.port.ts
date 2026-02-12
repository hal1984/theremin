export interface ClockPort {
  now: () => Date;
  formatShortDateTime: (date: Date, locale: string) => string;
}
