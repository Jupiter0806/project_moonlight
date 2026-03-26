import { serve } from "@hono/node-server";
import { createApp } from "./app.js";

// Load env vars in development (production uses injected env vars via Cloud Run)
if (process.env.NODE_ENV !== "production") {
  const { default: dotenv } = await import("dotenv");
  dotenv.config();
}

const port = parseInt(process.env.PORT ?? "3001", 10);
const app = createApp();

console.log(`Server starting on port ${port}`);

serve({ fetch: app.fetch, port });
