import { Router } from "express";
import { db } from "@workspace/db";
import { memories } from "@workspace/db";
import { eq, asc, and } from "drizzle-orm";
import { DeleteMemoryParams } from "@workspace/api-zod";
import { requireUser } from "../middlewares/requireUser";

const router = Router();

router.get("/memories", requireUser, async (req, res) => {
  try {
    const allMemories = await db
      .select()
      .from(memories)
      .where(eq(memories.userId, req.userId))
      .orderBy(asc(memories.createdAt));
    res.json(allMemories);
  } catch (err) {
    req.log.error({ err }, "Failed to list memories");
    res.status(500).json({ error: "Failed to list memories" });
  }
});

router.delete("/memories/:id", requireUser, async (req, res) => {
  const parsed = DeleteMemoryParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [mem] = await db
      .select()
      .from(memories)
      .where(and(eq(memories.id, parsed.data.id), eq(memories.userId, req.userId)));
    if (!mem) {
      res.status(404).json({ error: "Memory not found" });
      return;
    }
    await db.delete(memories).where(eq(memories.id, parsed.data.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete memory");
    res.status(500).json({ error: "Failed to delete memory" });
  }
});

export default router;
