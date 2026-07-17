import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, XCircle, RotateCcw, Flag, Clock, Eye, Mic } from 'lucide-react';

export default function AssessmentPlatform() {
  const [stage, setStage] = useState('input'); // 'input', 'home', 'checklist', 'quiz', 'results'
  const [jsonInput, setJsonInput] = useState('');
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [confidence, setConfidence] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const [error, setError] = useState('');
  const [proctoringEnabled, setProctoringEnabled] = useState(true);
  const [fullscreenMode, setFullscreenMode] = useState(false);

  // Timer effect
  useEffect(() => {
    let timer;
    if (timerActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      handleSubmit();
    }
    return () => clearInterval(timer);
  }, [timerActive, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const sampleJSON = `[
  {
    "id": "test_1",
    "name": "TCS Placement Aptitude Assessment",
    "duration": 600,
    "questions": [
      {
        "id": 1,
        "question": "A mixture contains milk and water in ratio 4:1. If 10 litres water added, ratio becomes 2:1. Find original quantity.",
        "category": "Quantitative Aptitude",
        "difficulty": "medium",
        "options": ["30 litres", "40 litres", "50 litres", "60 litres"],
        "correctAnswer": 2
      },
      {
        "id": 2,
        "question": "Which one does not belong to the group?",
        "category": "Logical Reasoning",
        "difficulty": "easy",
        "options": ["Triangle", "Square", "Circle", "Cube"],
        "correctAnswer": 3
      }
    ]
  }
]`;

  const handleJsonPaste = (e) => {
    setJsonInput(e.target.value);
    setError('');
  };

  const validateAndLoadTests = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) {
        setError('JSON must be array of tests');
        return;
      }

      parsed.forEach(test => {
        if (!test.name || !Array.isArray(test.questions) || test.questions.length === 0) {
          throw new Error('Each test needs: name, questions array');
        }
        test.questions.forEach(q => {
          if (!q.question || !Array.isArray(q.options) || q.correctAnswer === undefined) {
            throw new Error('Each question needs: question, options, correctAnswer');
          }
        });
      });

      setTests(parsed);
      setStage('home');
      setError('');
    } catch (e) {
      setError('Invalid JSON: ' + e.message);
    }
  };

  const startTest = (test) => {
    setSelectedTest(test);
    setQuestions(test.questions);
    setAnswers({});
    setFlagged(new Set());
    setConfidence({});
    setTimeLeft(test.duration || 3600);
    setTimerActive(false);
    setStage('checklist');
  };

  const beginQuiz = () => {
    setTimerActive(true);
    setStage('quiz');
  };

  const handleAnswer = (qId, optIdx, conf = 'medium') => {
    setAnswers({ ...answers, [qId]: optIdx });
    setConfidence({ ...confidence, [qId]: conf });
  };

  const toggleFlag = (qId) => {
    const newFlagged = new Set(flagged);
    if (newFlagged.has(qId)) {
      newFlagged.delete(qId);
    } else {
      newFlagged.add(qId);
    }
    setFlagged(newFlagged);
  };

  const handleSubmit = () => {
    const unanswered = questions.filter(q => answers[q.id] === undefined);
    if (unanswered.length > 0) {
      const proceed = window.confirm(
        `${unanswered.length} questions unanswered. Submit anyway?`
      );
      if (!proceed) return;
    }
    setTimerActive(false);
    setStage('results');
  };

  const calculateResults = () => {
    const results = {
      correct: 0,
      incorrect: 0,
      skipped: 0,
      byCategory: {},
      byDifficulty: {},
      byConfidence: {},
      questionDetails: []
    };

    questions.forEach(q => {
      const userAns = answers[q.id];
      const isCorrect = userAns === q.correctAnswer;
      const conf = confidence[q.id] || 'medium';

      // Overall
      if (userAns === undefined) results.skipped++;
      else if (isCorrect) results.correct++;
      else results.incorrect++;

      // By category
      if (!results.byCategory[q.category]) {
        results.byCategory[q.category] = { correct: 0, total: 0 };
      }
      results.byCategory[q.category].total++;
      if (isCorrect) results.byCategory[q.category].correct++;

      // By difficulty
      if (!results.byDifficulty[q.difficulty]) {
        results.byDifficulty[q.difficulty] = { correct: 0, total: 0 };
      }
      results.byDifficulty[q.difficulty].total++;
      if (isCorrect) results.byDifficulty[q.difficulty].correct++;

      // By confidence
      if (!results.byConfidence[conf]) {
        results.byConfidence[conf] = { correct: 0, total: 0 };
      }
      results.byConfidence[conf].total++;
      if (isCorrect) results.byConfidence[conf].correct++;

      results.questionDetails.push({
        id: q.id,
        question: q.question,
        category: q.category,
        difficulty: q.difficulty,
        isCorrect,
        userAnswer: q.options[userAns] || 'Not answered',
        correctAnswer: q.options[q.correctAnswer],
        confidence: conf,
        flagged: flagged.has(q.id)
      });
    });

    return results;
  };

  const getScorePercentage = () => {
    const total = questions.length;
    const correct = Object.keys(answers).filter(qId => 
      answers[qId] === questions.find(q => q.id == qId)?.correctAnswer
    ).length;
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  };

  // ===== INPUT STAGE =====
  if (stage === 'input') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-3">Assessment Platform</h1>
            <p className="text-slate-400 text-lg">Professional placement exam simulator</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-800 rounded-xl shadow-2xl p-8 border border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-4">Paste Test JSON</h2>
              <textarea
                value={jsonInput}
                onChange={handleJsonPaste}
                placeholder="Paste JSON here..."
                className="w-full h-96 p-4 bg-slate-700 border border-slate-600 text-white rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              {error && (
                <div className="mt-4 p-4 bg-red-900/30 border-l-4 border-red-500 rounded flex gap-3">
                  <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}
              <button
                onClick={validateAndLoadTests}
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition transform hover:scale-105"
              >
                Load Tests
              </button>
            </div>

            <div className="bg-slate-800 rounded-xl shadow-2xl p-8 border border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-4">JSON Format</h2>
              <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-xs overflow-auto max-h-96 font-mono border border-slate-700">
{sampleJSON}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== HOME STAGE =====
  if (stage === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-2">Available Tests</h1>
            <p className="text-slate-400">Select a test to begin your assessment</p>
          </div>

          <div className="space-y-4">
            {tests.map((test, idx) => (
              <div key={idx} className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-blue-500 transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{test.name}</h3>
                    <p className="text-slate-400 mt-2">{test.questions.length} questions</p>
                  </div>
                  <button
                    onClick={() => startTest(test)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition"
                  >
                    Start Test
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-slate-700 p-3 rounded">
                    <div className="text-2xl font-bold text-blue-400">{test.questions.length}</div>
                    <div className="text-xs text-slate-400">Questions</div>
                  </div>
                  <div className="bg-slate-700 p-3 rounded">
                    <div className="text-2xl font-bold text-orange-400">
                      {Math.floor((test.duration || 3600) / 60)}
                    </div>
                    <div className="text-xs text-slate-400">Minutes</div>
                  </div>
                  <div className="bg-slate-700 p-3 rounded">
                    <div className="text-2xl font-bold text-purple-400">
                      {new Set(test.questions.map(q => q.category)).size}
                    </div>
                    <div className="text-xs text-slate-400">Categories</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setStage('input');
              setTests([]);
              setJsonInput('');
            }}
            className="mt-8 w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg transition"
          >
            Load Different Test
          </button>
        </div>
      </div>
    );
  }

  // ===== CHECKLIST STAGE =====
  if (stage === 'checklist') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-800 rounded-xl p-8 border border-slate-700">
            <h2 className="text-3xl font-bold text-white mb-2">Before You Begin</h2>
            <p className="text-slate-400 mb-8">Please review the instructions and confirm your environment</p>

            <div className="bg-slate-700/50 p-6 rounded-lg mb-8 border-l-4 border-blue-500">
              <div className="flex gap-3 mb-2">
                <CheckCircle2 className="text-blue-400 flex-shrink-0" size={24} />
                <div>
                  <p className="font-bold text-white">{selectedTest.name}</p>
                  <p className="text-sm text-slate-300 mt-1">
                    {selectedTest.questions.length} Questions • {Math.floor((selectedTest.duration || 3600) / 60)} min
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-slate-700/30 p-6 rounded-lg border border-slate-600">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-green-400" />
                  Candidate Checklist
                </h3>
                <ul className="space-y-3 text-slate-300">
                  <li className="flex gap-2">
                    <CheckCircle2 size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                    Stable internet connection
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                    Quiet, distraction-free environment
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                    Calculator not allowed
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                    Complete in one sitting
                  </li>
                </ul>
              </div>

              <div className="bg-slate-700/30 p-6 rounded-lg border border-slate-600">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Eye size={20} className="text-blue-400" />
                  Assessment Options
                </h3>
                <label className="flex items-center gap-3 mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={proctoringEnabled}
                    onChange={(e) => setProctoringEnabled(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-slate-300">Enable proctoring (webcam required)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fullscreenMode}
                    onChange={(e) => setFullscreenMode(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-slate-300">Fullscreen mode (immersive experience)</span>
                </label>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStage('home')}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg transition"
              >
                ← Back
              </button>
              <button
                onClick={beginQuiz}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
              >
                Begin Assessment →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== QUIZ STAGE =====
  if (stage === 'quiz') {
    const currentQIdx = Object.keys(answers).length;
    const totalQ = questions.length;
    const answeredCount = Object.keys(answers).length;
    const flaggedCount = flagged.size;

    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 ${fullscreenMode ? 'fixed inset-0' : ''}`}>
        <div className="max-w-7xl mx-auto">
          {/* Top Bar */}
          <div className="flex justify-between items-center mb-6 bg-slate-800 p-4 rounded-lg border border-slate-700">
            <div>
              <h2 className="text-xl font-bold text-white">{selectedTest.name}</h2>
              <p className="text-sm text-slate-400">{answeredCount} of {totalQ} answered</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400 font-mono">{formatTime(timeLeft)}</div>
                <div className="text-xs text-slate-400">Time Remaining</div>
              </div>
              <button
                onClick={handleSubmit}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded transition"
              >
                Submit
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Question Navigator */}
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 h-fit">
              <h3 className="font-bold text-white mb-4">Question Navigator</h3>
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-slate-300">Answered</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span className="text-slate-300">Flagged</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-slate-600 rounded"></div>
                  <span className="text-slate-300">Not visited</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {questions.map((q, idx) => {
                  let bgColor = 'bg-slate-600 hover:bg-slate-500';
                  if (answers[q.id] !== undefined) bgColor = 'bg-green-600';
                  if (flagged.has(q.id)) bgColor = 'bg-orange-600';

                  return (
                    <button
                      key={idx}
                      onClick={() => document.getElementById(`q-${q.id}`)?.scrollIntoView({ behavior: 'smooth' })}
                      className={`${bgColor} text-white text-sm font-bold py-2 px-2 rounded transition`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Questions */}
            <div className="lg:col-span-3 space-y-6">
              {questions.map((q, idx) => (
                <div key={q.id} id={`q-${q.id}`} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl font-bold text-blue-400">{idx + 1}</span>
                        <span className="text-xs px-2 py-1 bg-blue-900 text-blue-300 rounded">{q.category}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          q.difficulty === 'easy' ? 'bg-green-900 text-green-300' :
                          q.difficulty === 'medium' ? 'bg-orange-900 text-orange-300' :
                          'bg-red-900 text-red-300'
                        }`}>
                          {q.difficulty}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white">{q.question}</h3>
                    </div>
                    <button
                      onClick={() => toggleFlag(q.id)}
                      className={`flex-shrink-0 p-2 rounded transition ${
                        flagged.has(q.id)
                          ? 'bg-orange-600 text-orange-200'
                          : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      }`}
                    >
                      <Flag size={18} />
                    </button>
                  </div>

                  <div className="space-y-3 mb-4">
                    {q.options.map((opt, optIdx) => (
                      <label key={optIdx} className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                        answers[q.id] === optIdx
                          ? 'border-blue-500 bg-blue-900/30'
                          : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                      }`}>
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          value={optIdx}
                          checked={answers[q.id] === optIdx}
                          onChange={() => handleAnswer(q.id, optIdx)}
                          className="w-4 h-4"
                        />
                        <span className="ml-3 text-white">{opt}</span>
                      </label>
                    ))}
                  </div>

                  {answers[q.id] !== undefined && (
                    <div className="p-3 bg-slate-700/50 rounded text-sm text-slate-300 border-l-2 border-blue-500">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`conf-${q.id}`}
                          value="high"
                          checked={confidence[q.id] === 'high'}
                          onChange={() => handleAnswer(q.id, answers[q.id], 'high')}
                        />
                        <span>Very Confident</span>
                      </label>
                      <label className="flex items-center gap-2 mt-2">
                        <input
                          type="radio"
                          name={`conf-${q.id}`}
                          value="medium"
                          checked={confidence[q.id] === 'medium' || !confidence[q.id]}
                          onChange={() => handleAnswer(q.id, answers[q.id], 'medium')}
                        />
                        <span>Somewhat Sure</span>
                      </label>
                      <label className="flex items-center gap-2 mt-2">
                        <input
                          type="radio"
                          name={`conf-${q.id}`}
                          value="low"
                          checked={confidence[q.id] === 'low'}
                          onChange={() => handleAnswer(q.id, answers[q.id], 'low')}
                        />
                        <span>Not Sure</span>
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== RESULTS STAGE =====
  if (stage === 'results') {
    const results = calculateResults();
    const percentage = getScorePercentage();
    const categories = Object.entries(results.byCategory);
    const difficulties = Object.entries(results.byDifficulty);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Score Card */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 mb-8 border border-slate-700 shadow-2xl">
            <h1 className="text-4xl font-bold text-white mb-8">Assessment Results</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center mb-4">
                  <div>
                    <div className="text-4xl font-bold text-white">{percentage}%</div>
                    <div className="text-sm text-blue-200">Score</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/50 p-6 rounded-lg">
                <p className="text-slate-400 text-sm mb-2">OVERALL PERFORMANCE</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-green-400">✓ Correct</span>
                    <span className="text-white font-bold">{results.correct}/{questions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-400">✗ Incorrect</span>
                    <span className="text-white font-bold">{results.incorrect}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">⊘ Skipped</span>
                    <span className="text-white font-bold">{results.skipped}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/50 p-6 rounded-lg">
                <p className="text-slate-400 text-sm mb-4">READINESS SCORE</p>
                <div className="text-4xl font-bold text-orange-400 mb-2">{Math.round(percentage * 0.8)}</div>
                <div className="w-full bg-slate-600 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-red-500 h-full transition-all"
                    style={{ width: `${percentage * 0.8}%` }}
                  />
                </div>
                <p className="text-sm text-slate-300 mt-2">
                  {percentage > 80 ? '🟢 Ready' : percentage > 60 ? '🟡 Nearly Ready' : '🔴 Needs Work'}
                </p>
              </div>
            </div>
          </div>

          {/* Category Analysis */}
          <div className="bg-slate-800 rounded-xl p-8 mb-8 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">Category-wise Analysis</h2>
            <div className="space-y-4">
              {categories.map(([cat, stats]) => {
                const pct = Math.round((stats.correct / stats.total) * 100);
                return (
                  <div key={cat}>
                    <div className="flex justify-between mb-2">
                      <span className="text-white font-semibold">{cat}</span>
                      <span className="text-slate-400">{stats.correct}/{stats.total}</span>
                    </div>
                    <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          pct > 70 ? 'bg-green-500' :
                          pct > 40 ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Difficulty Analysis */}
          <div className="bg-slate-800 rounded-xl p-8 mb-8 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">Difficulty-wise Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {difficulties.map(([diff, stats]) => {
                const pct = Math.round((stats.correct / stats.total) * 100);
                const icon = diff === 'easy' ? '✓' : diff === 'medium' ? '◐' : '✕';
                const color = diff === 'easy' ? 'green' : diff === 'medium' ? 'orange' : 'red';
                return (
                  <div key={diff} className="bg-slate-700/50 p-6 rounded-lg text-center">
                    <div className={`text-4xl font-bold text-${color}-400 mb-2`}>{stats.correct}/{stats.total}</div>
                    <p className="text-slate-300 capitalize mb-2">{diff}</p>
                    <p className="text-sm text-slate-400">{pct}% accuracy</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Confidence Analysis */}
          <div className="bg-slate-800 rounded-xl p-8 mb-8 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">Confidence Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['high', 'medium', 'low'].map(conf => {
                const stats = results.byConfidence[conf] || { correct: 0, total: 0 };
                const acc = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                return (
                  <div key={conf} className="bg-slate-700/50 p-6 rounded-lg">
                    <p className="text-slate-400 text-sm mb-3 capitalize">{conf} Confidence</p>
                    <div className="text-3xl font-bold text-white mb-2">{stats.correct}/{stats.total}</div>
                    <div className="text-sm text-slate-300">Accuracy: {acc}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Review */}
          <div className="bg-slate-800 rounded-xl p-8 mb-8 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">Question Review</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {results.questionDetails.map((detail, idx) => (
                <div key={idx} className={`p-4 rounded-lg border-l-4 ${
                  detail.isCorrect ? 'bg-green-900/20 border-green-600' : 'bg-red-900/20 border-red-600'
                }`}>
                  <div className="flex gap-3 mb-2">
                    {detail.isCorrect ? (
                      <CheckCircle2 className="text-green-400 flex-shrink-0" size={20} />
                    ) : (
                      <XCircle className="text-red-400 flex-shrink-0" size={20} />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-white">Q{detail.id}: {detail.question}</p>
                      <div className="text-xs text-slate-300 mt-1">{detail.category} • {detail.difficulty}</div>
                    </div>
                  </div>
                  <div className="text-sm ml-8">
                    <p className="text-slate-300">Your answer: <span className="text-white">{detail.userAnswer}</span></p>
                    {!detail.isCorrect && (
                      <p className="text-slate-300 mt-1">Correct: <span className="text-green-300">{detail.correctAnswer}</span></p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => {
                setStage('home');
                setAnswers({});
                setFlagged(new Set());
                setConfidence({});
              }}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              <RotateCcw size={20} />
              Take Another Test
            </button>
            <button
              onClick={() => {
                setStage('input');
                setTests([]);
                setJsonInput('');
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition"
            >
              Load New Tests
            </button>
          </div>
        </div>
      </div>
    );
  }
}
