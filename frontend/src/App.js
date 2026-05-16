// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext"; // Import AuthProvider

import Login from "./components/pages/Login";
import Signup from "./components/pages/Signup";
import ForgotPassword from "./components/Forgotpassword";
import StudentDashboard from "./components/pages/StudentDashboard";
import AdminDashboard from "./components/pages/AdminDashboard";
import QuizGenerator from "./components/pages/QuizGenerator";
import StudentAssignments from "./components/pages/StudentAssignments";

function App() {
  return (
    <AuthProvider> {/* Wrap everything with AuthProvider */}
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />  
          <Route path="/quiz-generator" element={<QuizGenerator />} />
          <Route path="/my-assignments" element={<StudentAssignments />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;