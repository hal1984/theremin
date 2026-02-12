import type { ObjectUrlPort } from '../../application/ports/object-url.port';

export class BrowserObjectUrlService implements ObjectUrlPort {
  create(blob: Blob): string {
    return URL.createObjectURL(blob);
  }

  revoke(url: string): void {
    URL.revokeObjectURL(url);
  }
}

export class NoopObjectUrlService implements ObjectUrlPort {
  create(): string {
    return '';
  }

  revoke(): void {
    void 0;
  }
}
