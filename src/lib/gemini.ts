import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export type ExtractedTask = { title: string; due_at: string | null };

/**
 * Turns pasted syllabus text / a task list / a calendar export into
 * structured {title, due_at} tasks.
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

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Gemini extractTasks failed:", err);
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
