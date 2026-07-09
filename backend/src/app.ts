import cors from "cors";
import express from "express";
import { islandersRouter } from "./routes/islanders";
import { choicesRouter, couplingRouter } from "./routes/choices";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/islanders", islandersRouter);
  app.use("/choices", choicesRouter);
  app.use("/coupling", couplingRouter);

  return app;
}
