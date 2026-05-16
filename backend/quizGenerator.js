const express = require("express");
const router = express.Router();

router.post("/generate-quiz", (req, res) => {
  const { role, classLevel, topic } = req.body;

  const questions = [
    {
      question: `What is ${topic}?`,
      options: ["A", "B", "C", "D"],
      answer: "A",
    },
  ];

  res.json({ questions });
});

module.exports = router;