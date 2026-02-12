import type { UuidPort } from '../../application/ports/uuid.port';

const fallbackUuid = (): string =>
  Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);

export class BrowserUuidService implements UuidPort {
  generate(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    return fallbackUuid();
  }
}

export class NoopUuidService implements UuidPort {
  generate(): string {
    return fallbackUuid();
  }
}
