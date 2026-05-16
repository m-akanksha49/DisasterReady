const express = require("express");
const router = express.Router();
const axios = require("axios");

router.post("/generate-quiz", async (req, res) => {
  try {
    const { role, classLevel, topic } = req.body;

    const prompt = `
Generate 5 MCQ questions for:
Role: ${role || "Student"}
Class: ${classLevel || "General"}
Topic: ${topic}

Return ONLY JSON:
{
  "questions": [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "answer": "A"
    }
  ]
}
`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let aiText = response.data.choices[0].message.content;

    let json;
    try {
      json = JSON.parse(aiText);
    } catch (err) {
      return res.status(500).json({
        error: "AI returned invalid JSON",
        raw: aiText,
      });
    }

    res.json(json);

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Quiz generation failed" });
  }
});

module.exports = router;
