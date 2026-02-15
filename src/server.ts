import http from "http";

import app from "./app.js";
import { env } from "./config/env.schema.ts";

const server = http.createServer(app);

server.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});

const shutdown = (signal: string) => {
  console.log(`\n${signal} received. Closing server...`);

  server.close(() => {
    console.log("Server closed");
    process.exitCode = 0;
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
