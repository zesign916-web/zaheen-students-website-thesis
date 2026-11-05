import { Router } from "express";
import { db, reviews } from "@workspace/db";
import { eq, desc, avg, count } from "drizzle-orm";
import { requireUser } from "../middlewares/requireUser";

const router = Router();

router.get("/reviews", requireUser, async (req, res) => {
  const questionKey = req.query.question as string | undefined;
  try {
    if (questionKey && questionKey.trim()) {
      const forQuestion = await db
        .select()
        .from(reviews)
        .where(eq(reviews.messageContent, questionKey.trim()))
        .orderBy(desc(reviews.createdAt));
      res.json(forQuestion);
      return;
    }
    const all = await db
      .select()
      .from(reviews)
      .where(eq(reviews.userId, req.userId))
      .orderBy(desc(reviews.createdAt));
    res.json(all);
  } catch (err) {
    req.log.error({ err }, "Failed to list reviews");
    res.status(500).json({ error: "Failed to list reviews" });
  }
});

router.get("/reviews/aggregates", requireUser, async (req, res) => {
  try {
    const stats = await db
      .select({
        messageContent: reviews.messageContent,
        avgRating: avg(reviews.rating),
        reviewCount: count(),
      })
      .from(reviews)
      .groupBy(reviews.messageContent);
    res.json(stats);
  } catch (err) {
    req.log.error({ err }, "Failed to get review aggregates");
    res.status(500).json({ error: "Failed to get review aggregates" });
  }
});

router.post("/reviews", requireUser, async (req, res) => {
  const { messageContent, selectedLine, rating, note } = req.body ?? {};
  if (typeof messageContent !== "string" || !messageContent.trim()) {
    res.status(400).json({ error: "messageContent is required" });
    return;
  }
  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    res.status(400).json({ error: "rating must be 1–5" });
    return;
  }
  try {
    const [created] = await db
      .insert(reviews)
      .values({
        userId: req.userId,
        messageContent: messageContent.trim(),
        selectedLine: typeof selectedLine === "string" && selectedLine.trim() ? selectedLine.trim() : null,
        rating: ratingNum,
        note: typeof note === "string" && note.trim() ? note.trim() : null,
      })
      .returning();
    res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, "Failed to create review");
    res.status(500).json({ error: "Failed to create review" });
  }
});

router.delete("/reviews/:id", requireUser, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid review id" });
    return;
  }
  try {
    const [deleted] = await db
      .delete(reviews)
      .where(eq(reviews.id, id))
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "Review not found" });
      return;
    }
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete review");
    res.status(500).json({ error: "Failed to delete review" });
  }
});

export default router;
