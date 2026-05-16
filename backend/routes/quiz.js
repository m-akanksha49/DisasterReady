const express = require("express");
const router = express.Router();
const axios = require("axios");

router.post("/generate-quiz", async (req, res) => {
  try {
    const { classLevel, topic } = req.body;

    const prompt = `
Generate 10 multiple choice quiz questions for Class ${classLevel}
about ${topic} disaster preparedness.

Return ONLY valid JSON in this format:

{
  "questions": [
    {
      "question": "Question here",
      "options": ["Option1", "Option2", "Option3", "Option4"],
      "answer": "Correct option text"
    }
  ]
}

Rules:
- Generate exactly 10 questions
- Make questions educational
- Make options realistic
- Do NOT include explanations
- Response must be pure JSON only
`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let aiText = response.data.choices[0].message.content;

    // remove markdown if AI sends ```json
    aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();

    const quizData = JSON.parse(aiText);

    res.json(quizData);

  } catch (error) {
    console.error(
      "Quiz generation error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      error: "Failed to generate AI quiz",
    });
  }
});

module.exports = router;
