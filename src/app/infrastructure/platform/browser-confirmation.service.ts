import type { ConfirmationPort } from '../../application/ports/confirmation.port';

export class BrowserConfirmationService implements ConfirmationPort {
  confirm(message: string): boolean {
    return window.confirm(message);
  }
}

export class NoopConfirmationService implements ConfirmationPort {
  confirm(): boolean {
    return true;
  }
}
