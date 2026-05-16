import React, { useState } from "react";
import axios from "axios";

const QuizGenerator = () => {
  const [role, setRole] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [topic, setTopic] = useState("");

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const generateQuiz = async () => {
    try {
      setLoading(true);

      const response = await axios.post(
        "https://disasterready-backend.onrender.com/api/generate-quiz",
        {
          role,
          classLevel,
          topic,
        }
      );

      console.log("Quiz Response:", response.data);

      if (response.data.questions) {
        setQuestions(response.data.questions);
      } else {
        alert("No quiz questions received");
      }

    } catch (error) {
      console.error("Quiz Error:", error);

      alert("Failed to generate quiz. Please check the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>AI Quiz Generator</h1>

      <input
        type="text"
        placeholder="Enter Role"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        style={{
          display: "block",
          marginBottom: "10px",
          padding: "10px",
          width: "300px"
        }}
      />

      <input
        type="text"
        placeholder="Enter Class Level"
        value={classLevel}
        onChange={(e) => setClassLevel(e.target.value)}
        style={{
          display: "block",
          marginBottom: "10px",
          padding: "10px",
          width: "300px"
        }}
      />

      <input
        type="text"
        placeholder="Enter Topic"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        style={{
          display: "block",
          marginBottom: "10px",
          padding: "10px",
          width: "300px"
        }}
      />

      <button
        onClick={generateQuiz}
        disabled={loading}
        style={{
          padding: "10px 20px",
          cursor: "pointer"
        }}
      >
        {loading ? "Generating..." : "Generate Quiz"}
      </button>

      <div style={{ marginTop: "30px" }}>
        {questions.map((q, index) => (
          <div
            key={index}
            style={{
              border: "1px solid #ccc",
              padding: "15px",
              marginBottom: "15px",
              borderRadius: "10px"
            }}
          >
            <h3>
              {index + 1}. {q.question}
            </h3>

            {q.options.map((option, i) => (
              <p key={i}>• {option}</p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuizGenerator;
