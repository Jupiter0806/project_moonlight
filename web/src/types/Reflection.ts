import { Trace } from "./Trace";

export interface Reflection {
  id: string;
  created_at: number;
  entities: {
    traces: Trace[];
  };
  description: string;
  user: string;
}
