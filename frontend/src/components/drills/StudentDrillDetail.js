// src/components/drills/StudentDrillDetail.js
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, MapPin, AlertTriangle, FileText, CheckCircle, 
  X, Bell, Shield, Users, Award, MessageSquare, Star, 
  ChevronRight, Timer, ShieldAlert, Footprints, Home, Flag,
  Send, ThumbsUp, AlertCircle, Play, Pause
} from 'lucide-react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const StudentDrillDetail = ({ drill, onClose, user }) => {
  const [drillState, setDrillState] = useState({
    currentStep: 0,
    isActive: false,
    completedSteps: [],
    feedbackSubmitted: false,
    quizCompleted: false,
    quizScore: null,
    isSafe: false,
    timeRemaining: null,
    showFeedback: false,
    showQuiz: false
  });
  
  const [feedback, setFeedback] = useState({
    rating: 0,
    comment: '',
    suggestions: ''
  });
  
  const [quizAnswers, setQuizAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Define timeline steps
  const timelineSteps = [
    {
      id: 'alert',
      title: 'Alert Received',
      description: 'Emergency drill notification sent',
      icon: Bell,
      duration: 'Immediate',
      instructions: 'Stay calm and prepare for the drill'
    },
    {
      id: 'instructions',
      title: 'Safety Instructions',
      description: 'Review safety protocols',
      icon: FileText,
      duration: '2 minutes',
      instructions: 'Read all safety instructions carefully'
    },
    {
      id: 'evacuation',
      title: 'Evacuation Started',
      description: 'Proceed to assembly point',
      icon: Footprints,
      duration: '5-10 minutes',
      instructions: 'Follow marked evacuation routes'
    },
    {
      id: 'safe_zone',
      title: 'Safe Zone Reached',
      description: 'Arrived at designated area',
      icon: Home,
      duration: 'Varies',
      instructions: 'Wait for headcount and further instructions'
    },
    {
      id: 'completed',
      title: 'Drill Completed',
      description: 'Exercise finished',
      icon: Flag,
      duration: 'End',
      instructions: 'Return to normal activities'
    }
  ];

  // Quiz questions based on drill type
  const getQuizQuestions = () => {
    const baseQuestions = [
      {
        id: 1,
        question: 'What is the first thing you should do when you hear the emergency alarm?',
        options: [
          'Gather your belongings',
          'Stay calm and listen for instructions',
          'Run immediately',
          'Call your family'
        ],
        correct: 1
      },
      {
        id: 2,
        question: 'Where is the designated safe assembly point for this drill?',
        options: [
          drill.location_name || 'Main Assembly Point',
          'Your classroom',
          'Parking lot',
          'Building entrance'
        ],
        correct: 0
      },
      {
        id: 3,
        question: 'What should you do if you cannot reach the assembly point?',
        options: [
          'Hide in a closet',
          'Find an alternate safe location and notify authorities',
          'Wait for help',
          'Try to leave the building'
        ],
        correct: 1
      }
    ];
    
    // Add drill-specific questions
    if (drill.drill_type?.toLowerCase().includes('fire')) {
      baseQuestions.push({
        id: 4,
        question: 'What is the correct way to exit during a fire drill?',
        options: [
          'Use the elevator',
          'Stay low and follow exit signs',
          'Run as fast as possible',
          'Wait for others to go first'
        ],
        correct: 1
      });
    } else if (drill.drill_type?.toLowerCase().includes('earthquake')) {
      baseQuestions.push({
        id: 4,
        question: 'What is the proper earthquake response?',
        options: [
          'Run outside immediately',
          'Drop, Cover, and Hold On',
          'Stand in a doorway',
          'Get under a desk'
        ],
        correct: 1
      });
    }
    
    return baseQuestions;
  };

  // Calculate drill duration
  const calculateDuration = () => {
    if (!drill.scheduled_time) return 'Not specified';
    const [hours, minutes] = drill.scheduled_time.split(':');
    const endHour = (parseInt(hours) + 1) % 24;
    return `${drill.scheduled_time} - ${endHour.toString().padStart(2, '0')}:${minutes}`;
  };

  // Countdown timer logic
  useEffect(() => {
    if (!drill.scheduled_date || !drill.scheduled_time) return;
    
    const calculateTimeRemaining = () => {
      const now = new Date();
      const drillDateTime = new Date(`${drill.scheduled_date}T${drill.scheduled_time}`);
      const diff = drillDateTime - now;
      
      if (diff <= 0) {
        setDrillState(prev => ({ ...prev, isActive: true, timeRemaining: null }));
        return null;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      return { hours, minutes, seconds };
    };
    
    const updateTimer = () => {
      const remaining = calculateTimeRemaining();
      setDrillState(prev => ({ ...prev, timeRemaining: remaining }));
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [drill.scheduled_date, drill.scheduled_time]);

  // Auto-advance timeline based on drill status
  useEffect(() => {
    if (drill.status === 'running') {
      setDrillState(prev => ({ ...prev, isActive: true }));
      
      // Simulate timeline progression based on drill status
      const intervals = [];
      
      if (drill.status === 'running' && drillState.currentStep < 2) {
        const timer = setTimeout(() => {
          setDrillState(prev => ({
            ...prev,
            currentStep: Math.min(prev.currentStep + 1, timelineSteps.length - 1),
            completedSteps: [...prev.completedSteps, prev.currentStep]
          }));
        }, 3000);
        intervals.push(timer);
      }
      
      return () => intervals.forEach(clearTimeout);
    } else if (drill.status === 'completed') {
      setDrillState(prev => ({
        ...prev,
        currentStep: timelineSteps.length - 1,
        completedSteps: timelineSteps.map((_, idx) => idx),
        isActive: false
      }));
    }
  }, [drill.status, drillState.currentStep]);

  const handleStepClick = (stepId, index) => {
    if (drillState.completedSteps.includes(index) || drillState.currentStep >= index) {
      // Allow viewing completed steps
      setDrillState(prev => ({ ...prev, currentStep: index }));
    }
  };

  const handleMarkSafe = async () => {
    setLoading(true);
    try {
      // API call to mark user as safe
      const res = await fetch(`${API}/api/drills/${drill.id}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.uid || user?.id })
      });
      
      if (res.ok) {
        setDrillState(prev => ({ ...prev, isSafe: true }));
        // Advance to next step if current is evacuation or safe zone
        if (drillState.currentStep === 2 || drillState.currentStep === 3) {
          setDrillState(prev => ({
            ...prev,
            currentStep: prev.currentStep + 1,
            completedSteps: [...prev.completedSteps, prev.currentStep]
          }));
        }
      }
    } catch (err) {
      console.error('Error marking safe:', err);
      setError('Failed to mark as safe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (feedback.rating === 0) {
      setError('Please provide a rating');
      return;
    }
    
    setLoading(true);
    try {
      // Save feedback to backend
      const res = await fetch(`${API}/api/drills/${drill.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.uid || user?.id,
          rating: feedback.rating,
          comment: feedback.comment,
          suggestions: feedback.suggestions
        })
      });
      
      if (res.ok) {
        setDrillState(prev => ({ ...prev, feedbackSubmitted: true, showFeedback: false }));
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleQuizSubmit = () => {
    const questions = getQuizQuestions();
    let correct = 0;
    
    questions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct) correct++;
    });
    
    const score = Math.round((correct / questions.length) * 100);
    setDrillState(prev => ({ ...prev, quizCompleted: true, quizScore: score, showQuiz: false }));
  };

  const getStepStatus = (index) => {
    if (drillState.completedSteps.includes(index)) return 'completed';
    if (drillState.currentStep === index && drillState.isActive) return 'active';
    if (drillState.currentStep > index) return 'completed';
    return 'pending';
  };

  const getStepColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white';
      case 'active': return 'bg-blue-500 text-white animate-pulse';
      default: return 'bg-gray-700 text-gray-400';
    }
  };

  const progress = ((drillState.currentStep + 1) / timelineSteps.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 50 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700"
      >
        {/* Header with gradient */}
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-red-600/20 via-orange-600/20 to-yellow-600/20 rounded-t-2xl" />
          <div className="relative px-6 py-4 border-b border-gray-700 flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold text-white">{drill.title}</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  drill.status === 'running' ? 'bg-red-500/20 text-red-400 animate-pulse' :
                  drill.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {drill.status?.toUpperCase()}
                </span>
              </div>
              <p className="text-gray-400 text-sm">{drill.description}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-xl transition"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Drill Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                <span className="text-gray-400 text-sm">Date & Time</span>
              </div>
              <p className="text-white font-semibold">
                {new Date(drill.scheduled_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="text-gray-400 text-sm mt-1">{drill.scheduled_time}</p>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                <span className="text-gray-400 text-sm">Disaster Type</span>
              </div>
              <p className="text-white font-semibold">{drill.drill_type}</p>
              <p className="text-gray-400 text-sm mt-1">Severity: {drill.severity_level?.toUpperCase()}</p>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-green-400" />
                <span className="text-gray-400 text-sm">Duration</span>
              </div>
              <p className="text-white font-semibold">{calculateDuration()}</p>
              <p className="text-gray-400 text-sm mt-1">Est. 1 hour</p>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-5 h-5 text-purple-400" />
                <span className="text-gray-400 text-sm">Location</span>
              </div>
              <p className="text-white font-semibold">{drill.location_name || 'Main Building'}</p>
              <p className="text-gray-400 text-sm mt-1">Assembly Point A</p>
            </div>
          </div>

          {/* Countdown Timer (if drill not started) */}
          {drillState.timeRemaining && drillState.timeRemaining.hours > 0 && (
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-6 border border-blue-500/30">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">Drill Starts In</p>
                <div className="flex justify-center gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">{drillState.timeRemaining.hours}</div>
                    <div className="text-xs text-gray-400">Hours</div>
                  </div>
                  <div className="text-3xl font-bold text-white">:</div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">{drillState.timeRemaining.minutes}</div>
                    <div className="text-xs text-gray-400">Minutes</div>
                  </div>
                  <div className="text-3xl font-bold text-white">:</div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">{drillState.timeRemaining.seconds}</div>
                    <div className="text-xs text-gray-400">Seconds</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Drill Progress</span>
              <span className="text-white font-semibold">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-full"
              />
            </div>
          </div>

          {/* Interactive Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Timer className="w-5 h-5 text-blue-400" />
              Drill Timeline
            </h3>
            
            <div className="relative">
              {/* Timeline connector line */}
              <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gray-700" />
              
              <div className="space-y-4">
                {timelineSteps.map((step, index) => {
                  const status = getStepStatus(index);
                  const statusColor = getStepColor(status);
                  const Icon = step.icon;
                  
                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`relative flex gap-4 cursor-pointer transition-all duration-300 ${
                        status === 'active' ? 'scale-105' : ''
                      }`}
                      onClick={() => handleStepClick(step.id, index)}
                    >
                      <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center ${statusColor} shadow-lg transition-all duration-300 ${
                        status === 'active' ? 'ring-4 ring-blue-500/50' : ''
                      }`}>
                        {status === 'completed' ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>
                      
                      <div className="flex-1 bg-gray-800/30 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-white">{step.title}</h4>
                            <p className="text-gray-400 text-sm">{step.description}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-gray-700 text-gray-500'
                          }`}>
                            {status === 'completed' ? '✓ Completed' :
                             status === 'active' ? '● In Progress' :
                             '○ Pending'}
                          </span>
                        </div>
                        
                        <AnimatePresence>
                          {status === 'active' && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="mt-3 pt-3 border-t border-gray-700"
                            >
                              <p className="text-blue-400 text-sm flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                {step.instructions}
                              </p>
                              <p className="text-gray-500 text-xs mt-1">Estimated time: {step.duration}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* I Am Safe Button */}
          {drillState.isActive && !drillState.isSafe && drillState.currentStep >= 2 && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-xl p-6 border border-green-500/30 text-center"
            >
              <h3 className="text-xl font-bold text-white mb-2">Are you safe?</h3>
              <p className="text-gray-400 mb-4">Confirm that you have reached the safe zone</p>
              <button
                onClick={handleMarkSafe}
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl text-white font-semibold transition flex items-center gap-2 mx-auto disabled:opacity-50"
              >
                <ThumbsUp className="w-5 h-5" />
                {loading ? 'Confirming...' : '✓ I Am Safe'}
              </button>
            </motion.div>
          )}

          {/* Feedback Section */}
          {drill.status === 'completed' && !drillState.feedbackSubmitted && (
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  Share Your Feedback
                </h3>
                <button
                  onClick={() => setDrillState(prev => ({ ...prev, showFeedback: !prev.showFeedback }))}
                  className="text-blue-400 text-sm hover:underline"
                >
                  {drillState.showFeedback ? 'Cancel' : 'Write Feedback'}
                </button>
              </div>
              
              <AnimatePresence>
                {drillState.showFeedback && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setFeedback(prev => ({ ...prev, rating: star }))}
                            className="text-2xl transition-transform hover:scale-110"
                          >
                            <Star className={`w-8 h-8 ${star <= feedback.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Comments</label>
                      <textarea
                        value={feedback.comment}
                        onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
                        rows="3"
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Share your experience..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Suggestions for improvement</label>
                      <textarea
                        value={feedback.suggestions}
                        onChange={(e) => setFeedback(prev => ({ ...prev, suggestions: e.target.value }))}
                        rows="2"
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Any suggestions to improve future drills?"
                      />
                    </div>
                    
                    <button
                      onClick={handleFeedbackSubmit}
                      disabled={loading}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Submit Feedback
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Quiz Section */}
          {drill.status === 'completed' && !drillState.quizCompleted && (
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-400" />
                  Knowledge Check Quiz
                </h3>
                <button
                  onClick={() => setDrillState(prev => ({ ...prev, showQuiz: !prev.showQuiz }))}
                  className="text-purple-400 text-sm hover:underline"
                >
                  {drillState.showQuiz ? 'Cancel' : 'Take Quiz'}
                </button>
              </div>
              
              <AnimatePresence>
                {drillState.showQuiz && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-6"
                  >
                    {getQuizQuestions().map((q, idx) => (
                      <div key={q.id} className="space-y-3">
                        <p className="text-white font-medium">{idx + 1}. {q.question}</p>
                        <div className="space-y-2">
                          {q.options.map((opt, optIdx) => (
                            <label
                              key={optIdx}
                              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${
                                quizAnswers[idx] === optIdx
                                  ? 'bg-blue-600/20 border border-blue-500'
                                  : 'bg-gray-700/50 border border-gray-600 hover:bg-gray-700'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`q${idx}`}
                                value={optIdx}
                                checked={quizAnswers[idx] === optIdx}
                                onChange={() => setQuizAnswers(prev => ({ ...prev, [idx]: optIdx }))}
                                className="w-4 h-4 text-blue-600"
                              />
                              <span className="text-gray-300 text-sm">{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    <button
                      onClick={handleQuizSubmit}
                      className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl text-white font-semibold transition flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Submit Quiz
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Quiz Results */}
          {drillState.quizCompleted && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-xl p-6 border border-green-500/30 text-center"
            >
              <Award className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-white mb-2">Quiz Completed!</h3>
              <p className="text-3xl font-bold text-green-400 mb-2">{drillState.quizScore}%</p>
              <p className="text-gray-400">
                {drillState.quizScore >= 70 
                  ? 'Great job! You have a good understanding of emergency procedures.' 
                  : 'Good try! Review the instructions and try again.'}
              </p>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 bg-gray-800/30">
          <p className="text-center text-gray-500 text-xs">
            Stay alert and follow all safety instructions. Your cooperation is appreciated.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StudentDrillDetail;