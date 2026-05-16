const express = require("express");
const router = express.Router();

router.post("/generate-quiz", async (req, res) => {
  try {
    const { classLevel, topic } = req.body;

    const questions = [
      {
        question: `What should you do during a ${topic} emergency?`,
        options: [
          "Stay calm and follow safety rules",
          "Ignore warnings",
          "Run randomly",
          "Hide without informing anyone"
        ],
        answer: "Stay calm and follow safety rules"
      },
      {
        question: `Which emergency number is commonly used for help?`,
        options: ["100", "108", "112", "All of the above"],
        answer: "All of the above"
      }
    ];

    res.json({ questions });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Quiz generation failed"
    });
  }
});

module.exports = router;
