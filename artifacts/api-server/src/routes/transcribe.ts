import { Router } from "express";
import { genAI } from "../lib/openai";
import { requireUser } from "../middlewares/requireUser";

const router = Router();

router.post("/transcribe", requireUser, async (req, res) => {
  try {
    const { audio, mimeType } = req.body as { audio?: string; mimeType?: string };

    if (!audio) {
      res.status(400).json({ error: "Missing audio data" });
      return;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType || "audio/webm",
          data: audio,
        },
      },
      "Transcribe this audio recording accurately. Output ONLY the spoken words as plain text — no labels, no punctuation additions beyond what was naturally spoken, no explanation.",
    ]);

    const text = result.response.text().trim();
    res.json({ text });
  } catch (err: any) {
    req.log.error({ err }, "Transcription failed");
    const status = err?.status ?? err?.statusCode;
    if (status === 429) {
      res.status(429).json({ error: "rate_limit", message: "Too many requests — please wait a moment and try again." });
    } else {
      res.status(500).json({ error: "Transcription failed" });
    }
  }
});

export default router;
