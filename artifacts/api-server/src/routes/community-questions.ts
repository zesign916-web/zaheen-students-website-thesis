import { Router } from "express";
import { db } from "@workspace/db";
import { communityQuestions } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireUser } from "../middlewares/requireUser";
import { genAI } from "../lib/openai";

const router = Router();

router.get("/questions", requireUser, async (req, res) => {
  const section = req.query.section as string | undefined;
  if (!section) {
    res.status(400).json({ error: "section query param is required" });
    return;
  }
  try {
    const rows = await db
      .select()
      .from(communityQuestions)
      .where(eq(communityQuestions.section, section))
      .orderBy(desc(communityQuestions.createdAt));
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to list questions");
    res.status(500).json({ error: "Failed to list questions" });
  }
});

router.post("/questions", requireUser, async (req, res) => {
  const { text, section, userName } = req.body as {
    text?: string;
    section?: string;
    userName?: string;
  };
  if (!text?.trim() || !section) {
    res.status(400).json({ error: "text and section are required" });
    return;
  }
  try {
    const [created] = await db
      .insert(communityQuestions)
      .values({
        text: text.trim(),
        section,
        userId: req.userId,
        userName: userName?.trim() || null,
        aiAnswer: null,
      })
      .returning();

    res.status(201).json(created);

    const sectionLabel =
      section === "school"
        ? "School Education"
        : section === "colleges"
          ? "College / Intermediate"
          : section === "university"
            ? "University Admissions"
            : "Government Jobs";

    const prompt = `You are a knowledgeable education and career guide for Pakistani students. Write a detailed, comprehensive article answering this question: "${text.trim()}" (Category: ${sectionLabel})

Structure your response clearly covering:
1. A direct answer to the question
2. Detailed explanation with all important information
3. Step-by-step guidance if applicable
4. Key requirements, eligibility, or criteria
5. Practical tips for success
6. Reference to official sources relevant to Pakistan (e.g. ppsc.gop.pk, fpsc.gov.pk, hec.gov.pk, nust.edu.pk, lums.edu.pk, bise.edu.pk, fbise.edu.pk)

Keep the tone warm, clear, and encouraging. Use numbered points for lists. Do not use any markdown symbols like # * ** or _`;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const answer = result.response.text();
      await db
        .update(communityQuestions)
        .set({ aiAnswer: answer })
        .where(eq(communityQuestions.id, created.id));
    } catch {
      /* non-critical — answer stays null, overlay will regenerate */
    }
  } catch (err) {
    req.log.error({ err }, "Failed to create question");
    res.status(500).json({ error: "Failed to create question" });
  }
});

export default router;
