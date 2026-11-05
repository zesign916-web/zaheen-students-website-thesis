import { Router } from "express";
import { genAI } from "../lib/openai";
import { requireUser } from "../middlewares/requireUser";

const router = Router();

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "application/pdf",
  "image/png": "image/png",
  "image/jpeg": "image/jpeg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB raw

router.post("/career-match", requireUser, async (req, res) => {
  const { files } = req.body as {
    files: Array<{ name: string; type: string; data: string }>;
  };

  if (!Array.isArray(files) || files.length === 0) {
    res.status(400).json({ error: "At least one file is required." });
    return;
  }

  for (const file of files) {
    if (!ALLOWED_TYPES[file.type]) {
      res.status(400).json({ error: `File "${file.name}" is not allowed. Use PDF, PNG, JPG, or DOCX.` });
      return;
    }
    const buf = Buffer.from(file.data, "base64");
    if (buf.length > MAX_FILE_BYTES) {
      res.status(400).json({ error: `File "${file.name}" exceeds the 5 MB limit.` });
      return;
    }
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const parts: object[] = [];

    for (const file of files) {
      if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        try {
          // @ts-ignore
          const mammoth = await import("mammoth");
          const buf = Buffer.from(file.data, "base64");
          const result = await mammoth.extractRawText({ buffer: buf });
          parts.push({ text: `\n--- Document: ${file.name} ---\n${result.value}\n---\n` });
        } catch {
          parts.push({ text: `\n--- Document: ${file.name} (could not parse content) ---\n` });
        }
      } else {
        parts.push({ inlineData: { mimeType: file.type, data: file.data } });
      }
    }

    parts.push({
      text: `You are Zaheen Career Advisor — a warm, expert career guidance counselor for Pakistani students. You have just received the student's academic records, result cards, or CV/resume shown above.

Do NOT open with a greeting or self-introduction. Get straight to the analysis in your first sentence.

Carefully analyze the documents and do the following in your response:
1. Briefly summarize what you can see (subjects studied, grades/marks, skills, work experience if any) — no greeting, just the summary.
2. Based on their academic profile, list the top 5–8 most suitable career paths or job roles for them — be specific to Pakistan's job market. Mention real industries, companies, or sectors (e.g. IT, banking, FMCG, government, healthcare, education).
3. For each career path, briefly explain why it suits them and what next steps they should take.
4. End by asking: what would they like to explore further? (e.g. specific jobs, salaries, skill gaps, further education, freelancing, abroad opportunities)

Stay strictly focused on academics and career guidance tied to education. Do not engage in personal, romantic, or non-academic conversation. Never flatter or emotionally appease the student — stay factual, respectful, and helpful.

Keep your tone warm, encouraging, and specific. Use **bold** for career titles. Keep the response under 700 words.`,
    });

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContentStream({
      contents: [{ role: "user", parts }],
    });

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Career match failed");
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: "Analysis failed. Please try again." })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: "Failed to analyse documents." });
    }
  }
});

router.post("/career-match/chat", requireUser, async (req, res) => {
  const { history, message } = req.body as {
    history: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>;
    message: string;
  };

  if (!message?.trim()) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `You are Zaheen Career Advisor — an expert career guidance counselor for Pakistani students. You have already analysed their academic documents. Continue the conversation giving specific, actionable career and job advice tailored to Pakistan's job market. Be warm, encouraging, and practical. Mention real Pakistani companies, HEC-recognised fields, industries, and opportunities where relevant. Keep each response concise (under 400 words) unless the student explicitly asks for more detail.

Never open a reply with a greeting or self-introduction — answer directly. Stay strictly focused on academics and career guidance tied to education; do not engage in personal, romantic, or non-academic conversation, and never flatter or emotionally appease the student — stay factual and helpful.`,
    });

    const chat = model.startChat({ history: history ?? [] });
    const result = await chat.sendMessageStream(message.trim());

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Career chat failed");
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: "Chat failed." })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: "Failed to respond." });
    }
  }
});

export default router;
