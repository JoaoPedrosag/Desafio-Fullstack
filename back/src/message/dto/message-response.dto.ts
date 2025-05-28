export class MessageResponseDto {
  id: string;
  content: string;
  createdAt: Date;

  user: {
    id: string;
    username: string;
  };

  storage?: {
    url: string;
    mimetype: string;
    originalName: string;
  } | null;
}
