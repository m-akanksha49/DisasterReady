const generateQuiz = async () => {
  try {
    const response = await fetch(
      "https://disasterready-backend.onrender.com/api/generate-quiz",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: "fire",
        }),
      }
    );

    const data = await response.json();

    console.log(data);

    if (data.questions) {
      setQuestions(data.questions);
    } else {
      alert("No questions returned");
    }

  } catch (err) {
    console.error(err);
    alert("Server connection failed");
  }
};
