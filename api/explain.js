// api/explain.js — Groq (OpenAI-compatible) via fetch
export default async function handler(req, res) {
  // CORS for your static site
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  let body = {};
  try { body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {}); } catch {}
  const { question, userAnswer, correctAnswer, method } = body;
  if (!question) return res.status(400).json({ error: "Missing question" });

  const prompt = `Explain the fastest mental-math path.
Question: ${question}
Candidate's answer: ${userAnswer}
Correct answer: ${correctAnswer}
${method ? `Hint: ${method}` : ""} Keep it to 4–7 crisp bullets + a quick sanity check.`;

  const model = "llama-3.3-70b-versatile"; // or "llama-3.1-8b-instant" (cheaper/faster)

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are a quant interview coach: concise, stepwise, mental anchors, rounding checks." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2
      })
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: data.error?.message || data });
    }
    const text = data.choices?.[0]?.message?.content?.trim() || "No explanation.";
    res.status(200).json({ explanation: text });
  } catch (e) {
    res.status(500).json({ error: `Server error: ${e.message}` });
  }
}
