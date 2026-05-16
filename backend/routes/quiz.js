const express = require("express");
const router = express.Router();
const axios = require("axios");

router.post("/generate-quiz", async (req, res) => {
  try {
    const { role, classLevel, topic } = req.body;

    if (!topic) {
      return res.status(400).json({
        error: "Topic is required"
      });
    }

    const prompt = `
You are a quiz generator.

Generate 5 multiple-choice questions for:

Role: ${role || "Student"}
Class Level: ${classLevel || "General"}
Topic: ${topic}

STRICT RULES:
- Return ONLY valid JSON
- No markdown
- No explanation

Format:
{
  "questions": [
    {
      "question": "string",
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
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    let aiText = response.data.choices?.[0]?.message?.content;

    if (!aiText) {
      return res.status(500).json({
        error: "No response from AI"
      });
    }

    // SAFE JSON PARSE (IMPORTANT FIX)
    let json;
    try {
      json = JSON.parse(aiText);
    } catch (err) {
      console.error("AI returned invalid JSON:", aiText);

      return res.status(500).json({
        error: "AI response format error",
        raw: aiText
      });
    }

    res.json(json);

  } catch (error) {
    console.error("Quiz generation error:", error.message);

    res.status(500).json({
      error: "Failed to generate quiz",
      details: error.message
    });
  }
});

module.exports = router;
