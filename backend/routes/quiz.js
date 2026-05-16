const express = require("express");
const router = express.Router();

router.post("/generate-quiz", async (req, res) => {
  try {
    const { topic } = req.body;

    const quizzes = {
      earthquake: [
        {
          question: "What should you do during an earthquake?",
          options: [
            "Run outside immediately",
            "Hide under a table",
            "Use elevator",
            "Stand near windows"
          ],
          answer: "Hide under a table"
        },
        {
          question: "Which scale measures earthquakes?",
          options: [
            "Richter Scale",
            "Celsius Scale",
            "Pascal Scale",
            "Kelvin Scale"
          ],
          answer: "Richter Scale"
        }
      ],

      floods: [
        {
          question: "What should you avoid during floods?",
          options: [
            "Walking in flood water",
            "Listening to alerts",
            "Using flashlight",
            "Moving to higher ground"
          ],
          answer: "Walking in flood water"
        }
      ],

      fire: [
        {
          question: "What is the emergency number for fire services?",
          options: ["101", "100", "108", "112"],
          answer: "101"
        }
      ]
    };

    const selectedQuiz =
      quizzes[topic?.toLowerCase()] || [
        {
          question: `What is ${topic}?`,
          options: ["Disaster", "Safety", "Emergency", "Risk"],
          answer: "Disaster"
        }
      ];

    res.json({
      success: true,
      questions: selectedQuiz
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Quiz generation failed"
    });
  }
});

module.exports = router;
