import { Trace } from "./Trace";

export interface Reflection {
  id: string;
  createdAt: number;
  traceIds: string[];
  summary: string;
  uid: string;
}
