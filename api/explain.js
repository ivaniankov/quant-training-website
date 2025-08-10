// api/explain.js
import OpenAI from "openai";

export default async function handler(req, res) {
  // CORS for calls from GitHub Pages (you can replace * with your domain)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  const { question, userAnswer, correctAnswer, method } = req.body || {};
  if (!question) return res.status(400).json({ error: "Missing question" });

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = `
You are a quant interview coach. Explain the fastest mental-math path.
Question: ${question}
Candidate's answer: ${userAnswer}
Correct answer: ${correctAnswer}
${method ? `Method hint: ${method}` : ""}
Be concise: 4–7 bullet points, include a quick sanity check if useful.
`.trim();

    const r = await client.responses.create({
      model: "gpt-4.1-mini",
      instructions: "Explain crisply like an interviewer. Prefer anchors, rounding checks.",
      input: prompt,
    });

    res.status(200).json({ explanation: r.output_text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "AI error. Try again." });
  }
}
