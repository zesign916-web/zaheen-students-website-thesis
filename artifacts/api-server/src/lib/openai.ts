import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY must be set.");
}

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
