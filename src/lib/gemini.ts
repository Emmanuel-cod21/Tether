import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export type ExtractedTask = { title: string; due_at: string | null };

/**
 * Thrown when the Gemini API call itself fails (quota, auth, network) —
 * as opposed to the model succeeding but returning something we can't
 * parse into tasks, which just yields an empty list.
 */
export class GeminiExtractionError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "GeminiExtractionError";
    this.status = status;
  }
}

function classifyGeminiError(err: unknown): GeminiExtractionError {
  const status = (err as { status?: number } | null)?.status;
  if (status === 429) {
    return new GeminiExtractionError(
      "Gemini's free-tier quota for this Google Cloud project is used up for today. Use an API key from a different Google Cloud project/account, or enable billing on this one, then try again.",
      429
    );
  }
  if (status === 401 || status === 403) {
    return new GeminiExtractionError(
      "Gemini rejected the API key (invalid, revoked, or missing access). Check GEMINI_API_KEY on the server.",
      status
    );
  }
  return new GeminiExtractionError(
    "Couldn't reach Gemini to extract tasks. Check server logs and try again.",
    status
  );
}

/**
 * Turns pasted syllabus text / a task list / a calendar export into
 * structured {title, due_at} tasks.
 *
 * Throws GeminiExtractionError if the Gemini API call itself fails
 * (quota exceeded, bad key, network). Returns [] only when the call
 * succeeded but the response couldn't be parsed into tasks.
 */
export async function extractTasks(rawText: string): Promise<ExtractedTask[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

  const prompt = `You extract a list of tasks/assignments with due dates from raw text (a syllabus, a to-do list, or a calendar export).
Today's date is ${new Date().toISOString().slice(0, 10)}.

Return ONLY valid JSON: an array of objects like {"title": string, "due_at": string | null}.
- due_at must be an ISO 8601 date (YYYY-MM-DD) if a date is stated or can be reasonably inferred, otherwise null.
- Keep titles short and specific.
- Do not include commentary, markdown fences, or any text outside the JSON array.

TEXT:
"""
${rawText}
"""`;

  let text: string;
  try {
    const result = await model.generateContent(prompt);
    text = result.response.text().trim();
  } catch (err) {
    console.error("Gemini extractTasks failed:", err);
    throw classifyGeminiError(err);
  }

  try {
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Gemini extractTasks: response wasn't valid JSON:", err, text);
    return [];
  }
}

/**
 * Writes the one-line message sent to the accountability partner.
 */
export async function craftNotification(
  taskTitle: string,
  status: "done" | "missed",
  ownerName: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

  const prompt =
    status === "done"
      ? `Write one short, warm, encouraging sentence (under 25 words) telling someone that ${ownerName} just completed the task "${taskTitle}". No emoji, no surrounding quotes, just the sentence.`
      : `Write one short, honest, direct but not mean sentence (under 25 words) telling someone that ${ownerName} did not complete the task "${taskTitle}" by the deadline. No emoji, no surrounding quotes, just the sentence.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error("Gemini craftNotification failed:", err);
    return status === "done"
      ? `${ownerName} just completed "${taskTitle}".`
      : `${ownerName} missed the deadline for "${taskTitle}".`;
  }
}
