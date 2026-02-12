export interface RecordingItem {
  id: string;
  title: string;
  durationSeconds: number;
  createdAtLabel: string;
  createdAtMs: number;
  audioUrl: string;
  mimeType: string;
}
