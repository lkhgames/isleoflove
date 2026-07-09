import { Router } from "express";
import { prisma } from "../db/client";

export const islandersRouter = Router();

islandersRouter.get("/", async (_req, res) => {
  const islanders = await prisma.islander.findMany();
  res.json(islanders);
});

islandersRouter.post("/", async (req, res) => {
  const { name, bio } = req.body ?? {};
  if (typeof name !== "string" || typeof bio !== "string") {
    res.status(400).json({ error: "name and bio are required strings" });
    return;
  }

  const islander = await prisma.islander.create({ data: { name, bio } });
  res.status(201).json(islander);
});
