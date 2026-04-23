export interface PageCursor {
  createdAt: number;
  id: string;
}

export interface ListParams {
  uid: string;
  direction: "top" | "bottom";
  cursor?: string;
  limit: number;
}
