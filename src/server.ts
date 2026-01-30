import dotenv from "dotenv";
import http from "http";

import app from "./app.js";

dotenv.config({ path: ".env.local" });

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
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
