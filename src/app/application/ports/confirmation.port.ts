export interface ConfirmationPort {
  confirm: (message: string) => boolean;
}
