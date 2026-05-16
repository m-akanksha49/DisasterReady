import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Quiz.css";

const TOPIC_PRESETS = [
  { label: "🔥 Fire", value: "Fire" },
  { label: "🌊 Flood", value: "Flood" },
  { label: "🏔️ Earthquake", value: "Earthquake" },
  { label: "🌪️ Cyclone", value: "Cyclone" },
  { label: "⚡ Lightning", value: "Lightning" },
  { label: "🩺 First Aid", value: "First Aid" },
];

function QuizGenerator() {
  const navigate = useNavigate();
  const [classLevel, setClassLevel] = useState("");
  const [topic, setTopic] = useState("");
  const [quiz, setQuiz] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState("");
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const timerRef = useRef(null);

  // Use refs to always have fresh state inside the timer callback
  const currentRef = useRef(current);
  const selectedRef = useRef(selected);
  const answersRef = useRef(answers);
  const scoreRef = useRef(score);
  const quizRef = useRef(quiz);

  useEffect(() => { currentRef.current = current; }, [current]);
  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { quizRef.current = quiz; }, [quiz]);

  // ── KEY FIX 1: Normalize answer for comparison ──
  // Your API might return answer as "A", "B", "C", "D" (letter)
  // or as the full option text. This helper handles both.
  const getCorrectOptionText = (q) => {
    const ans = q.answer;
    // If answer is a single letter A/B/C/D, map to option text
    if (/^[A-D]$/i.test(ans)) {
      const idx = ans.toUpperCase().charCodeAt(0) - 65;
      return q.options[idx] ?? ans;
    }
    // Otherwise answer is already the full text
    return ans;
  };

  // ── KEY FIX 2: finishQuiz defined with useCallback so it's stable ──
  const finishQuiz = useCallback((finalAnswers, finalScore, topicVal, classVal, totalLen) => {
    clearInterval(timerRef.current);
    setShowResult(true);
    const result = {
      score: finalScore,
      total: totalLen,
      date: new Date().toLocaleString(),
      topic: topicVal,
      classLevel: classVal,
    };
    localStorage.setItem("quizResult", JSON.stringify(result));
  }, []);

  // ── KEY FIX 3: Auto-submit uses refs to avoid stale closure ──
  const handleAutoSubmit = useCallback(() => {
    clearInterval(timerRef.current);
    const q = quizRef.current[currentRef.current];
    if (!q) return;

    const correctText = getCorrectOptionText(q);
    const sel = selectedRef.current || ""; // no answer selected
    const isCorrect = sel === correctText;
    const newScore = isCorrect ? scoreRef.current + 1 : scoreRef.current;

    const newAnswers = [
      ...answersRef.current,
      {
        question: q.question,
        correct: correctText,
        selected: sel || "(no answer)",
        isCorrect,
        options: q.options,
      },
    ];

    setAnswers(newAnswers);
    if (isCorrect) setScore(newScore);
    finishQuiz(newAnswers, newScore, topic, classLevel, quizRef.current.length);
  }, [finishQuiz, topic, classLevel]);

  // ── KEY FIX 4: Timer effect re-runs on `current` change, properly resets ──
  useEffect(() => {
    if (quiz.length === 0 || showResult) return;

    setTimeLeft(60); // reset timer for each new question
    clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [quiz.length, current, showResult, handleAutoSubmit]);

  const generateQuiz = async () => {
    if (!classLevel || !topic) {
      setError("Please enter both class level and topic.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/quiz/generate-quiz", {
        classLevel,
        topic,
      });
      setQuiz(res.data.questions);
      setCurrent(0);
      setScore(0);
      setShowResult(false);
      setTimeLeft(60);
      setAnswers([]);
      setSelected("");
    } catch (err) {
      setError("Failed to generate quiz. Please check the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = (opt) => {
    if (selected) return;
    setSelected(opt);
  };

  const handleNext = () => {
    if (!selected) return;
    clearInterval(timerRef.current);

    const q = quiz[current];
    const correctText = getCorrectOptionText(q); // ← FIX: normalize answer
    const isCorrect = selected === correctText;
    const newScore = isCorrect ? score + 1 : score;

    const newAnswers = [
      ...answers,
      {
        question: q.question,
        correct: correctText,   // ← always store the full option text
        selected,
        isCorrect,
        options: q.options,
      },
    ];

    if (isCorrect) setScore(newScore);
    setAnswers(newAnswers);
    setSelected("");

    if (current + 1 < quiz.length) {
      setCurrent(current + 1);
      // timer resets via useEffect dependency on `current`
    } else {
      finishQuiz(newAnswers, newScore, topic, classLevel, quiz.length);
    }
  };

  const resetQuiz = () => {
    clearInterval(timerRef.current);
    setQuiz([]);
    setCurrent(0);
    setScore(0);
    setShowResult(false);
    setAnswers([]);
    setSelected("");
    setTimeLeft(60);
    setTopic("");
    setClassLevel("");
  };

  const timerPct = (timeLeft / 60) * 100;
  const timerColor = timeLeft > 30 ? "#6ee7b7" : timeLeft > 10 ? "#f59e0b" : "#ef4444";

  // ── SETUP SCREEN ──
  if (quiz.length === 0 && !showResult) {
    return (
      <div className="qz-root">
        <div className="qz-back" onClick={() => navigate(-1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          Back to Dashboard
        </div>

        <div className="qz-setup-card">
          <div className="qz-setup-header">
            <div className="qz-bolt-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 2v11h3v9l7-12h-4l4-8z" />
              </svg>
            </div>
            <div>
              <h1 className="qz-setup-title">AI Quiz Generator</h1>
              <p className="qz-setup-sub">Generate disaster-preparedness quizzes instantly</p>
            </div>
          </div>

          {error && (
            <div className="qz-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              {error}
            </div>
          )}

          <div className="qz-field">
            <label className="qz-label">Class / Grade Level</label>
            <input
              className="qz-input"
              type="number"
              min="1"
              max="12"
              placeholder="e.g. 8"
              value={classLevel}
              onChange={(e) => setClassLevel(e.target.value)}
            />
          </div>

          <div className="qz-field">
            <label className="qz-label">Disaster Topic</label>
            <div className="qz-topic-pills">
              {TOPIC_PRESETS.map((t) => (
                <button
                  key={t.value}
                  className={`qz-pill ${topic === t.value ? "active" : ""}`}
                  onClick={() => setTopic(t.value)}
                  type="button"
                >
                  {t.label}
                </button>
              ))}
            </div>
            <input
              className="qz-input"
              style={{ marginTop: 10 }}
              placeholder="Or type a custom topic…"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <button className="qz-generate-btn" onClick={generateQuiz} disabled={loading}>
            {loading ? (
              <><span className="qz-spinner" />Generating Quiz…</>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 2v11h3v9l7-12h-4l4-8z" />
                </svg>
                Generate AI Quiz
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ── QUIZ SCREEN ──
  if (quiz.length > 0 && !showResult) {
    const q = quiz[current];
    const progress = (current / quiz.length) * 100;

    return (
      <div className="qz-root">
        <div className="qz-quiz-card">
          <div className="qz-top-bar">
            <div className="qz-meta">
              <span className="qz-topic-tag">{topic}</span>
              <span className="qz-qnum">Question {current + 1} / {quiz.length}</span>
            </div>
            <div className="qz-timer-wrap">
              <svg width="52" height="52" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
                <circle
                  cx="26" cy="26" r="22"
                  fill="none"
                  stroke={timerColor}
                  strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 22}`}
                  strokeDashoffset={`${2 * Math.PI * 22 * (1 - timerPct / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s ease", transform: "rotate(-90deg)", transformOrigin: "center" }}
                />
              </svg>
              <span className="qz-timer-num" style={{ color: timerColor }}>{timeLeft}</span>
            </div>
          </div>

          <div className="qz-progress-track">
            <div className="qz-progress-fill" style={{ width: `${progress}%` }} />
          </div>

          <h2 className="qz-question">{q.question}</h2>

          <div className="qz-options">
            {q.options.map((opt, i) => {
              let cls = "qz-option";
              if (selected === opt) cls += " chosen";
              else if (selected && selected !== opt) cls += " dim";
              return (
                <button key={i} className={cls} onClick={() => handleOptionClick(opt)} type="button">
                  <span className="qz-opt-letter">{String.fromCharCode(65 + i)}</span>
                  <span className="qz-opt-text">{opt}</span>
                </button>
              );
            })}
          </div>

          <button className="qz-next-btn" onClick={handleNext} disabled={!selected} type="button">
            {current + 1 === quiz.length ? "Finish Quiz" : "Next Question"}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>

          <p className="qz-live-score">
            Score so far: <strong style={{ color: "#6ee7b7" }}>{score}</strong> / {current}
          </p>
        </div>
      </div>
    );
  }

  // ── RESULT SCREEN ──
  if (showResult) {
    const pct = Math.round((score / quiz.length) * 100);
    const grade = pct >= 85 ? { label: "Excellent!", color: "#10b981", emoji: "🏆" }
      : pct >= 65 ? { label: "Good Job!", color: "#3b82f6", emoji: "👍" }
      : pct >= 40 ? { label: "Keep Practicing", color: "#f59e0b", emoji: "📚" }
      : { label: "Needs Work", color: "#ef4444", emoji: "💪" };

    return (
      <div className="qz-root">
        <div className="qz-result-card">
          <div className="qz-score-hero">
            <div className="qz-score-ring" style={{ "--ring-color": grade.color }}>
              <span className="qz-score-emoji">{grade.emoji}</span>
              <span className="qz-score-num" style={{ color: grade.color }}>{pct}%</span>
              <span className="qz-score-frac">{score}/{quiz.length}</span>
            </div>
            <h2 className="qz-grade-label" style={{ color: grade.color }}>{grade.label}</h2>
            <p className="qz-result-sub">Topic: <strong>{topic}</strong> · Class {classLevel}</p>
          </div>

          <div className="qz-review-list">
            <h3 className="qz-review-title">Answer Review</h3>
            {answers.map((a, i) => (
              <div key={i} className={`qz-review-item ${a.isCorrect ? "correct" : "wrong"}`}>
                <div className="qz-review-q">
                  <span className="qz-review-num">Q{i + 1}</span>
                  <p className="qz-review-question">{a.question}</p>
                </div>
                <div className="qz-review-options">
                  {(a.options || []).map((opt, oi) => {
                    const isCorrectOpt = opt === a.correct;
                    const isSelectedOpt = opt === a.selected;
                    let optCls = "qz-review-opt";
                    if (isCorrectOpt) optCls += " rv-correct";
                    else if (isSelectedOpt && !a.isCorrect) optCls += " rv-wrong";
                    else optCls += " rv-neutral";
                    return (
                      <div key={oi} className={optCls}>
                        <span className="qz-rv-letter">{String.fromCharCode(65 + oi)}</span>
                        <span className="qz-rv-text">{opt}</span>
                        {isCorrectOpt && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: "auto", color: "#10b981", flexShrink: 0 }}>
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                          </svg>
                        )}
                        {isSelectedOpt && !a.isCorrect && !isCorrectOpt && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: "auto", color: "#ef4444", flexShrink: 0 }}>
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="qz-review-ans" style={{ marginTop: 8 }}>
                  {a.isCorrect
                    ? <span className="qz-ans-label correct-label">✅ Correct!</span>
                    : (
                      <>
                        <span className="qz-ans-label wrong-label">❌ Your answer: {a.selected}</span>
                        <span className="qz-ans-label correct-label">✅ Correct: {a.correct}</span>
                      </>
                    )
                  }
                </div>
              </div>
            ))}
          </div>

          <div className="qz-result-actions">
            <button className="qz-retry-btn" onClick={resetQuiz} type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
              </svg>
              Try Again
            </button>
            <button className="qz-dash-btn" onClick={() => navigate(-1)} type="button">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default QuizGenerator;