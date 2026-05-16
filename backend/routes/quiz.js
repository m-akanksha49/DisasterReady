const express = require("express");
const router = express.Router();

router.post("/generate-quiz", async (req, res) => {
  try {
    const { topic } = req.body;

    // Clean topic text (removes emojis/special characters)
    const cleanTopic = topic
      ?.toLowerCase()
      .replace(/[^\w\s]/gi, "")
      .trim();

    const quizzes = {
      fire: [
        {
          question: "What is the emergency number for fire services?",
          options: ["101", "100", "108", "112"],
          answer: "101"
        },
        {
          question: "What should you do during a fire accident?",
          options: [
            "Use elevator",
            "Stay inside room",
            "Move to safe exit",
            "Hide under bed"
          ],
          answer: "Move to safe exit"
        },
        {
          question: "Which item is used to stop fires?",
          options: [
            "Fire Extinguisher",
            "Helmet",
            "Blanket",
            "Torch"
          ],
          answer: "Fire Extinguisher"
        }
      ],

      flood: [
        {
          question: "What should you avoid during floods?",
          options: [
            "Walking in flood water",
            "Listening to alerts",
            "Using flashlight",
            "Moving to higher ground"
          ],
          answer: "Walking in flood water"
        },
        {
          question: "Where should people move during floods?",
          options: [
            "Basement",
            "Higher ground",
            "River side",
            "Underground tunnel"
          ],
          answer: "Higher ground"
        }
      ],

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
      ]
    };

    const selectedQuiz =
      quizzes[cleanTopic] || [
        {
          question: `What is ${topic}?`,
          options: [
            "Natural Disaster",
            "Safety Measure",
            "Emergency Situation",
            "Risk Event"
          ],
          answer: "Natural Disaster"
        }
      ];

    res.json({
      success: true,
      questions: selectedQuiz
    });

  } catch (error) {
    console.error("Quiz Error:", error);

    res.status(500).json({
      error: "Quiz generation failed"
    });
  }
});

module.exports = router;
