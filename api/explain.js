// api/explain.js
import OpenAI from "openai";

export default async function handler(req, res) {
  // CORS (you can replace * with your GitHub Pages domain)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  // Safely parse JSON body (Vercel may give you a string)
  let body = {};
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
  } catch (_) { body = {}; }

  const { question, userAnswer, correctAnswer, method } = body;
  if (!question) return res.status(400).json({ error: "Missing question" });

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `
You are a quant interview coach. Explain the fastest mental-math path.
Question: ${question}
Candidate's answer: ${userAnswer}
Correct answer: ${correctAnswer}
${method ? `Method hint: ${method}` : ""}
Keep it concise (4–7 bullets) and include a quick sanity check if useful.
`.trim();

    const r = await openai.responses.create({
      model: "gpt-4.1-mini",
      instructions: "Explain crisply like an interviewer: anchors, rounding checks, and pattern spotting.",
      input: prompt,
    });

    res.status(200).json({ explanation: r.output_text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "AI error. Check OPENAI_API_KEY and logs." });
  }
}
