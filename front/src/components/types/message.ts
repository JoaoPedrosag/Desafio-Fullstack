type Message = {
  id: string;
  content: string;
  createdAt: string;
  edited: boolean;
  editedAt: string;
  user: {
    id: string;
    username: string;
  };
  storage?: {
    id: string;
    filename: string;
    mimetype: string;
    originalName: string;
    url: string;
  };
};
