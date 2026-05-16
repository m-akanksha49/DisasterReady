const express = require("express");
const router = express.Router();
const axios = require("axios");

router.post("/generate-quiz", async (req, res) => {
  try {
    const { role, classLevel, topic } = req.body;

    const prompt = `
Generate 5 multiple-choice quiz questions for:
Role: ${role}
Class Level: ${classLevel}
Topic: ${topic}

Return ONLY JSON in this format:
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
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const aiText = response.data.choices[0].message.content;

    const json = JSON.parse(aiText);

    res.json(json);

  } catch (error) {
    console.error("Quiz generation error:", error.message);
    res.status(500).json({
      error: "Failed to generate quiz"
    });
  }
});

module.exports = router;
