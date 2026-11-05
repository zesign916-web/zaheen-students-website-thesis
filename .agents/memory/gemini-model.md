---
name: Gemini model choice
description: Which Gemini model works with the user's API key and why earlier ones failed.
---

The project uses `gemini-2.5-flash` for both chat responses and memory extraction.

**Why:** The user's Gemini API key returned `limit: 0` (quota exhausted or not enabled) for `gemini-2.0-flash` and `gemini-1.5-flash` at the time of setup. Switching to `gemini-2.5-flash` resolved it.

**How to apply:** If the model ever needs changing, update both `model.getGenerativeModel` calls in `artifacts/api-server/src/routes/conversations.ts` and rebuild the api-server workflow.
