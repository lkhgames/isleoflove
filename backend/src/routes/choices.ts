import { Router } from "express";
import { applyChoice, coupleUp } from "../domain/relationships";

export const choicesRouter = Router();

choicesRouter.post("/:choiceId/apply", async (req, res) => {
  const { playerId } = req.body ?? {};
  if (typeof playerId !== "string") {
    res.status(400).json({ error: "playerId is required" });
    return;
  }

  const relationship = await applyChoice(playerId, req.params.choiceId);
  res.json(relationship);
});

export const couplingRouter = Router();

couplingRouter.post("/", async (req, res) => {
  const { playerId, islanderId } = req.body ?? {};
  if (typeof playerId !== "string" || typeof islanderId !== "string") {
    res.status(400).json({ error: "playerId and islanderId are required" });
    return;
  }

  try {
    const relationship = await coupleUp(playerId, islanderId);
    res.json(relationship);
  } catch (err) {
    res.status(422).json({ error: (err as Error).message });
  }
});
