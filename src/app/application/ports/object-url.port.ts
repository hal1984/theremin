export interface ObjectUrlPort {
  create: (blob: Blob) => string;
  revoke: (url: string) => void;
}
