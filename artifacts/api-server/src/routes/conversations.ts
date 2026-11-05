import { Router } from "express";
import type { ChatCompletionMessageParam } from "openai";
import { db } from "@workspace/db";
import { conversations, messages, memories } from "@workspace/db";
import { eq, asc, desc, and, count } from "drizzle-orm";
import { genAI } from "../lib/openai";
import { openrouter } from "../lib/openrouter";
import { requireUser } from "../middlewares/requireUser";
import {
  SendOpenaiMessageBody,
  GetOpenaiConversationParams,
  DeleteOpenaiConversationParams,
  SendOpenaiMessageParams,
  CreateOpenaiConversationBody,
} from "@workspace/api-zod";

const router = Router();

// Helper to determine which provider to use based on model name
function getProvider(model: string): "gemini" | "openrouter" {
  // OpenRouter models typically have a "/" in the name (e.g., "openai/gpt-4o", "anthropic/claude-3.5-sonnet")
  // or are known OpenRouter model IDs
  if (model.includes("/") || model.startsWith("openrouter/")) {
    return "openrouter";
  }
  // Default to Gemini for gemini-* models
  return "gemini";
}

// Helper to normalize model name for OpenRouter (strip openrouter/ prefix if present)
function normalizeOpenRouterModel(model: string): string {
  return model.replace(/^openrouter\//, "");
}

router.get("/openai/conversations", requireUser, async (req, res) => {
  try {
    const allConversations = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, req.userId))
      .orderBy(desc(conversations.updatedAt));
    res.json(allConversations);
  } catch (err) {
    req.log.error({ err }, "Failed to list conversations");
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

router.post("/openai/conversations", requireUser, async (req, res) => {
  try {
    const [conv] = await db
      .insert(conversations)
      .values({ title: null, userId: req.userId })
      .returning();
    res.status(201).json(conv);
  } catch (err) {
    req.log.error({ err }, "Failed to create conversation");
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

router.get("/openai/conversations/:id", requireUser, async (req, res) => {
  const parsed = GetOpenaiConversationParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, parsed.data.id), eq(conversations.userId, req.userId)));
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, parsed.data.id))
      .orderBy(asc(messages.createdAt));
    res.json({ ...conv, messages: msgs });
  } catch (err) {
    req.log.error({ err }, "Failed to get conversation");
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

router.delete("/openai/conversations/:id", requireUser, async (req, res) => {
  const parsed = DeleteOpenaiConversationParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, parsed.data.id), eq(conversations.userId, req.userId)));
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    await db.delete(conversations).where(eq(conversations.id, parsed.data.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete conversation");
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

router.post("/openai/conversations/:id/messages", requireUser, async (req, res) => {
  const paramsParsed = SendOpenaiMessageParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid conversation id" });
    return;
  }
  const bodyParsed = SendOpenaiMessageBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const conversationId = paramsParsed.data.id;
  const userContent = bodyParsed.data.content;
  const selectedModel = typeof bodyParsed.data.model === "string" && bodyParsed.data.model.trim()
    ? bodyParsed.data.model.trim()
    : "gemini-2.5-flash";
  const requestLanguage = typeof (req.body as { language?: string }).language === "string"
    ? (req.body as { language?: string }).language
    : "en";
  const skipMemory = (req.body as { skipMemory?: boolean }).skipMemory === true;
  const userId = req.userId;

  const provider = getProvider(selectedModel);

  try {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)));
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    await db.insert(messages).values({
      conversationId,
      role: "user",
      content: userContent,
    });

    const userMemories = await db
      .select()
      .from(memories)
      .where(eq(memories.userId, userId))
      .orderBy(asc(memories.createdAt));

    const enMemories = userMemories.filter(m => m.language === "en");
    const urMemories = userMemories.filter(m => m.language === "ur");
    const memoryContext =
      !skipMemory && userMemories.length > 0
        ? `\n\nHere are things you remember about the user (accumulated across both English and Urdu sessions):\n${
            enMemories.length > 0 ? `English session memories:\n${enMemories.map((m) => `- ${m.content}`).join("\n")}` : ""
          }${
            urMemories.length > 0 ? `\nUrdu session memories:\n${urMemories.map((m) => `- ${m.content}`).join("\n")}` : ""
          }\nUse all of the above memories together to give a complete, personalized response.`
        : "";

    const conversationHistory = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));

    const languageInstruction = requestLanguage === "ur"
      ? "LANGUAGE INSTRUCTION: The user has selected Urdu as their language. You MUST respond in Urdu (proper Urdu script). Write your entire response in Urdu. Do not switch to English unless the user explicitly writes to you in English.\n\n"
      : "LANGUAGE INSTRUCTION: The user has selected English. Respond in clear, simple English.\n\n";

    const systemInstruction = `${languageInstruction}You are Zaheen Student, an intelligent AI assistant built specifically to help students navigate Pakistan's university landscape. You were created by Faisal Sajjad.

Your purpose is to help Pakistani students with everything related to higher education in Pakistan — university admissions, entry tests, courses, fee structures, scholarships, deadlines, merit calculations, and more. You have deep knowledge of Pakistan's top universities including NUST, LUMS, IBA, FAST-NUCES, UET, Quaid-i-Azam University, Punjab University, COMSATS, GIKI, NED, Aga Khan University, and all other public and private universities across Pakistan.

What you help with:
University admissions, merit criteria, and deadlines. Entry test information including MDCAT, ECAT, NTS, HAT, SAT, NUST NET, LUMS SSE, and IBA Aptitude Test. Fee structures and semester breakdowns. Available programs, departments, and courses. Scholarship opportunities including HEC scholarships, merit-based, and need-based awards. Step-by-step application processes. University rankings, reputation, and campus life. Merit calculation formulas. Hostel availability and campus facilities. Guidance for students confused about which university or program suits them.

Key traits:
- You are warm, clear, and encouraging — students are often stressed about admissions.
- You are concise but thorough. Give actionable information, not vague advice.
- You remember what the student has shared (their marks, field of interest, city) and use that context naturally.
- You respond in whatever language the user writes in — Urdu, English, or mixed (Roman Urdu is common and totally fine).
- When information may have changed (e.g. fee structures, deadlines), always advise the student to verify from the official university website.
- When asked who made you, say: "I was created by Faisal Sajjad."
- When asked what you are, say: "I'm Zaheen Student — your daily education guide."

OPENING RESPONSE RULE — strictly follow this:
- Never open a response with a self-introduction or greeting like "Hello, I am Zaheen Student, created by Faisal Sajjad." Do not restate who you are or who made you unless the student directly asks.
- Get straight to answering the student's question in your very first sentence. No preamble, no filler greeting.
- Only mention your name or creator when explicitly asked "who are you" / "who made you", per the traits above.

SCOPE — strictly follow this:
- This is a strictly academic, education-focused platform for Pakistani students. Only engage with topics related to education: admissions, universities, courses, entry tests, scholarships, fees, career guidance tied to academics, and study help.
- Do not engage in personal, romantic, emotional, entertainment, or non-academic conversations, even if the student steers you there. Politely redirect back to education-related help.
- Never try to please, flatter, or emotionally appease the student to keep them engaged. Do not give compliments about their personality, looks, or non-academic choices. Stay factual, respectful, and strictly helpful — not sycophantic.
- If a student asks something entirely unrelated to education (e.g. personal advice, relationships, casual chit-chat), briefly and politely decline and steer the conversation back to their academic needs.

RESPONSE LENGTH — strictly follow these rules:
- Default: keep every response within ~1000 words. Be clear and complete but don't pad unnecessarily.
- Only exceed 1000 words if the student explicitly asks for a "detailed", "long", "in-depth", or "extended" response.
- Even then, never exceed 2000 words in a single reply. If a topic needs more, tell the student you can continue.
- Always end at a natural stopping point — don't cut off mid-thought.

FORMATTING RULES — follow these strictly in every response:
- Write in clear prose paragraphs first. Paragraphs should be the foundation of every response.
- Use **bold** (double asterisks) to highlight key terms, university names, test names, or important figures.
- Use bullet points (- item) only when you are listing 3 or more parallel items — e.g. a list of scholarships, a list of required documents. Do not bullet every sentence.
- Use numbered lists (1. step) only for sequential steps where order matters.
- Do NOT use # headers — they look bad in chat. Use a bold phrase to introduce a new topic instead.
- Keep the tone conversational, warm, and encouraging. Write like a knowledgeable friend, not a textbook.

REFERENCE LINKS — follow these rules strictly:
- Whenever you mention a fact, fee, deadline, ranking, or specific claim, link it with a readable label like: [NUST official site](https://nust.edu.pk) or [HEC scholarships](https://hec.gov.pk/scholarships).
- Format ALL links as markdown: [Label](https://url.com) — never paste a bare URL.
- Use short, descriptive labels — not "click here" or "source", but the actual name of the page or institution.
- Always link to official university websites, HEC, or well-known trusted sources.
- Never invent URLs. Only use real domains you are confident exist (nust.edu.pk, lums.edu.pk, hec.gov.pk, iba.edu.pk, uet.edu.pk, comsats.edu.pk, giki.edu.pk, fast.edu.pk, etc.).
- If unsure of the exact page URL, link to the main university domain and advise the student to navigate from there.
${memoryContext}`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullResponse = "";

    if (provider === "openrouter") {
      // OpenRouter (OpenAI-compatible) streaming
      const openRouterModel = normalizeOpenRouterModel(selectedModel);
      const openaiHistory: ChatCompletionMessageParam[] = conversationHistory.slice(0, -1).map((m) => ({
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: m.content,
      }));

      const stream = await openrouter.chat.completions.create({
        model: openRouterModel,
        messages: [
          { role: "system", content: systemInstruction },
          ...openaiHistory,
          { role: "user", content: userContent },
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 4000,
      });

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (text) {
          fullResponse += text;
          res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        }
      }
    } else {
      // Gemini streaming (existing logic)
      const geminiHistory = conversationHistory.slice(0, -1).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const model = genAI.getGenerativeModel({
        model: selectedModel,
        systemInstruction,
      });

      const chat = model.startChat({ history: geminiHistory });

      const result = await chat.sendMessageStream(userContent);

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          fullResponse += text;
          res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        }
      }
    }

    await db.insert(messages).values({
      conversationId,
      role: "assistant",
      content: fullResponse,
    });

    // Bump updatedAt
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

    // Async: extract memories + maybe generate title (skipped for community overlay to save API quota)
    if (!skipMemory) {
      const totalMessages = conversationHistory.length + 1;
      const shouldGenerateTitle = totalMessages >= 2;

      extractAndSaveMemories(userContent, fullResponse, userId, req.log, requestLanguage ?? "en").catch((err) => {
        req.log.error({ err }, "Memory extraction failed");
      });

      if (shouldGenerateTitle) {
        generateConversationTitle(conversationHistory, userContent, fullResponse)
          .then(async (title) => {
            if (title) {
              await db
                .update(conversations)
                .set({ title })
                .where(eq(conversations.id, conversationId));
              req.log.info({ conversationId, title }, "Conversation title generated");
            }
          })
          .catch((err) => {
            req.log.error({ err }, "Title generation failed");
          });
      }
    }
  } catch (err) {
    req.log.error({ err }, "Failed to send message");
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to send message" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
      res.end();
    }
  }
});

router.patch("/openai/conversations/:id", requireUser, async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { title } = req.body ?? {};
  if (typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "title must be a non-empty string" }); return;
  }
  try {
    const [conv] = await db
      .select().from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, req.userId)));
    if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }
    const [updated] = await db
      .update(conversations)
      .set({ title: title.trim() })
      .where(eq(conversations.id, id))
      .returning();
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to rename conversation");
    res.status(500).json({ error: "Failed to rename conversation" });
  }
});

router.delete("/openai/conversations/:id/messages/last", requireUser, async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, req.userId)));
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(desc(messages.createdAt));

    // Delete the last assistant message
    const lastAssistant = msgs.find((m) => m.role === "assistant");
    if (lastAssistant) {
      await db.delete(messages).where(eq(messages.id, lastAssistant.id));
    }
    // Find the last user message to re-send
    const lastUser = msgs.find((m) => m.role === "user");
    res.json({ lastUserMessage: lastUser?.content ?? null });
  } catch (err) {
    req.log.error({ err }, "Failed to delete last message");
    res.status(500).json({ error: "Failed to delete last message" });
  }
});

async function generateConversationTitle(
  history: Array<{ role: string; content: string }>,
  lastUserMessage: string,
  lastAssistantMessage: string,
): Promise<string | null> {
  const allMessages = [
    ...history,
    { role: "user", content: lastUserMessage },
    { role: "assistant", content: lastAssistantMessage },
  ].slice(-10);

  const transcript = allMessages
    .map((m) => `${m.role === "assistant" ? "Assistant" : "User"}: ${m.content}`)
    .join("\n");

  const prompt = `Generate a short 3-6 word title for this conversation. Only return the title, no quotes, no punctuation, clean text only.\n\n${transcript}`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const clean = raw.replace(/[""''']/g, "").replace(/[.!?,;:]$/, "").trim();
    const words = clean.split(/\s+/).slice(0, 6).join(" ");
    return words || null;
  } catch {
    return null;
  }
}

async function extractAndSaveMemories(
  userMessage: string,
  assistantResponse: string,
  userId: string,
  log: { info: (obj: object, msg: string) => void; error: (obj: object, msg: string) => void },
  language: string = "en",
): Promise<void> {
  const extractionPrompt = `Analyze this conversation exchange and extract any important, long-term facts about the user worth remembering for future conversations.

User said: "${userMessage}"
Assistant said: "${assistantResponse}"

Extract ONLY facts that are:
- Personal identity or background (name, profession, location, etc.)
- User preferences and tastes
- Goals, interests, or hobbies
- Important life details
- Work, career, or skills

Do NOT extract:
- Passwords or sensitive data
- Casual greetings or short messages
- Questions the user asked
- Temporary or situational info

Respond with a JSON array of fact strings. Each fact should be a short, clear sentence about the user.
If there are no facts worth saving, respond with an empty array [].

Example: ["User is a graphic designer", "User prefers dark color schemes", "User is interested in AI tools"]

Respond ONLY with the JSON array, nothing else.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(extractionPrompt);
    const raw = result.response.text().trim();

    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    const facts: string[] = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    if (Array.isArray(facts) && facts.length > 0) {
      for (const fact of facts) {
        if (typeof fact === "string" && fact.trim()) {
          await db.insert(memories).values({ content: fact.trim(), userId, language });
          log.info({ fact }, "Memory saved");
        }
      }
    }
  } catch (err) {
    log.error({ err }, "Failed to extract memories");
  }
}

export default router;