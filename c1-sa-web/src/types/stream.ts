// types/stream.dto.ts

export interface StreamStartRequest {
  systemName: string; // [cite: 22]
}

export interface StreamResponse {
  liveStreamUrl: string; // URL luồng trực tiếp
  aiUrl: string;         // URL luồng xử lý AI
  message: string;
}