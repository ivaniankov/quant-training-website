// Vercel Serverless Function (Node.js)
// POST /api/explain  { question, userAnswer, correctAnswer, method }
import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });
  const { question, userAnswer, correctAnswer, method } = req.body || {};
  if (!question) return res.status(400).json({ error: "Missing question" });

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `
You are a quant interview coach. Explain the fastest mental-math path.
Question: ${question}
Candidate's answer: ${userAnswer}
Correct answer: ${correctAnswer}
If helpful, mention a 1–2 line quick-check. Be concise, 4–7 bullets max.
${method ? `Internal method context from the app: ${method}` : ""}
  `.trim();

  try {
    const resp = await client.responses.create({
      model: "gpt-4.1-mini", // or "gpt-4o-mini"
      instructions: "Explain like a quant interviewer: crisp steps, mental anchors, rounding sanity check.",
      input: prompt,
    });
    res.status(200).json({ explanation: resp.output_text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "AI error. Try again." });
  }
}
