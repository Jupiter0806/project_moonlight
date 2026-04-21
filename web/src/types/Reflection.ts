import { Trace } from "./Trace";

export interface Reflection {
  id: string;
  createdAt: number;
  entities: {
    traces: Trace[];
  };
  summary: string;
  user: string;
}
