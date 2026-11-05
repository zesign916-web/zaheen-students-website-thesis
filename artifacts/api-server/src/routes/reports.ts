import { Router } from "express";
import { db, reports } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireUser } from "../middlewares/requireUser";

const router = Router();

router.post("/reports", requireUser, async (req, res) => {
  const { reviewId, messageContent, additionalNote } = req.body ?? {};
  if (typeof messageContent !== "string" || !messageContent.trim()) {
    res.status(400).json({ error: "messageContent is required" });
    return;
  }
  try {
    const [created] = await db
      .insert(reports)
      .values({
        userId: req.userId,
        reviewId: typeof reviewId === "number" ? reviewId : null,
        messageContent: messageContent.trim(),
        additionalNote: typeof additionalNote === "string" && additionalNote.trim() ? additionalNote.trim() : null,
        status: "pending",
      })
      .returning();
    res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, "Failed to create report");
    res.status(500).json({ error: "Failed to create report" });
  }
});

router.get("/reports", requireUser, async (req, res) => {
  try {
    const all = await db
      .select()
      .from(reports)
      .where(eq(reports.userId, req.userId))
      .orderBy(desc(reports.createdAt));
    res.json(all);
  } catch (err) {
    req.log.error({ err }, "Failed to list reports");
    res.status(500).json({ error: "Failed to list reports" });
  }
});

export default router;
