export interface Trace {
  id: string;
  created_at: number;
  q: string;
  a: string;
  user: string;
  reflection: string;
  type: "qna" | "translation";
}
