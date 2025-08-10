// api/explain.js  — no SDK, detailed error responses
export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  let body = {};
  try { body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {}); } catch {}
  const { question, userAnswer, correctAnswer, method } = body;
  if (!question) return res.status(400).json({ error: "Missing question" });

  const prompt =
`You are a quant interview coach. Explain the fastest mental-math path.
Question: ${question}
Candidate's answer: ${userAnswer}
Correct answer: ${correctAnswer}
${method ? `Method hint: ${method}` : ""}
Be concise (4–7 bullets). Include a quick sanity check if useful.`;

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",          // <- safe choice for chat/completions
        messages: [
          { role: "system", content: "Explain crisply like an interviewer: anchors, rounding checks, patterns." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2
      })
    });

    const data = await resp.json();
    if (!resp.ok) {
      // Bubble the real error up so we can see it in the browser
      return res.status(resp.status).json({ error: data.error?.message || data });
    }
    const text = data.choices?.[0]?.message?.content?.trim() || "No explanation returned.";
    res.status(200).json({ explanation: text });
  } catch (e) {
    res.status(500).json({ error: `Server error: ${e.message}` });
  }
}
