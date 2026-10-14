import React, { useState, useEffect } from 'react';
import {
  getAptitudeCategories,
  getAptitudeStatistics,
  getAptitudeHistory,
  createAptitudeSession,
  getAptitudeSessionQuestions,
  submitAptitudeAnswer,
  completeAptitudeSession,
  getAptitudeSessionResults,
} from '../services/api';
import './AptitudePage.css';

const AptitudePage = () => {
  // Main view state: 'overview' | 'practice' | 'results'
  const [viewMode, setViewMode] = useState('overview');

  // Categories & metadata from backend
  const [categories, setCategories] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Practice Setup Form State
  const [selectedCategory, setSelectedCategory] = useState('QUANTITATIVE');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [startingSession, setStartingSession] = useState(false);
  const [setupError, setSetupError] = useState('');

  // Active Practice Session State
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionQuestions, setSessionQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [currentAnswerResult, setCurrentAnswerResult] = useState(null);

  // Results State
  const [sessionResults, setSessionResults] = useState(null);
  const [reviewModalSession, setReviewModalSession] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);

  // Load Overview Data (Categories, Stats, History)
  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      setError('');
      const [catsData, statsData, histData] = await Promise.all([
        getAptitudeCategories(),
        getAptitudeStatistics(),
        getAptitudeHistory(),
      ]);
      setCategories(catsData || []);
      setStatistics(statsData);
      setHistory(histData || []);
      if (catsData && catsData.length > 0 && !selectedCategory) {
        setSelectedCategory(catsData[0].category);
      }
    } catch (err) {
      console.error('Error fetching aptitude overview:', err);
      setError('Failed to load aptitude preparation data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  // Available topics for chosen category
  const activeCategoryObj = categories.find((c) => c.category === selectedCategory);
  const currentTopics = activeCategoryObj ? activeCategoryObj.topics : [];

  // Reset topic filter if category changes
  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setSelectedTopic('');
    setSetupError('');
  };

  // Start a Practice Session
  const handleStartPractice = async (e) => {
    e.preventDefault();
    setSetupError('');
    setStartingSession(true);

    try {
      const payload = {
        category: selectedCategory,
        topic: selectedTopic || null,
        difficulty: selectedDifficulty || null,
        numberOfQuestions: parseInt(questionCount, 10),
      };

      const sessionData = await createAptitudeSession(payload);
      setCurrentSession(sessionData);
      setSessionQuestions(sessionData.questions || []);
      setCurrentQuestionIndex(0);
      setSelectedOption('');
      setCurrentAnswerResult(null);
      setViewMode('practice');
    } catch (err) {
      console.error('Error creating practice session:', err);
      const msg = err.response?.data?.message || err.message || 'Could not start practice session.';
      setSetupError(msg);
    } finally {
      setStartingSession(false);
    }
  };

  // Current Question
  const activeQuestion = sessionQuestions[currentQuestionIndex] || null;

  // Sync active question state (if already answered)
  useEffect(() => {
    if (activeQuestion) {
      if (activeQuestion.answered) {
        setSelectedOption(activeQuestion.selectedOption || '');
        setCurrentAnswerResult({
          questionId: activeQuestion.id,
          selectedOption: activeQuestion.selectedOption,
          isCorrect: activeQuestion.isCorrect,
          correctOption: activeQuestion.correctOption,
          explanation: activeQuestion.explanation,
        });
      } else {
        setSelectedOption('');
        setCurrentAnswerResult(null);
      }
    }
  }, [currentQuestionIndex, sessionQuestions]);

  // Submit Answer for Current Question
  const handleSubmitAnswer = async () => {
    if (!selectedOption || !activeQuestion || activeQuestion.answered) return;

    setSubmittingAnswer(true);
    try {
      const res = await submitAptitudeAnswer(currentSession.sessionId, {
        questionId: activeQuestion.id,
        selectedOption: selectedOption,
      });

      setCurrentAnswerResult(res);

      // Update question state in session list
      setSessionQuestions((prev) =>
        prev.map((q, idx) =>
          idx === currentQuestionIndex
            ? {
                ...q,
                answered: true,
                selectedOption: selectedOption,
                isCorrect: res.isCorrect,
                correctOption: res.correctOption,
                explanation: res.explanation,
              }
            : q
        )
      );
    } catch (err) {
      console.error('Error submitting answer:', err);
      alert(err.response?.data?.message || 'Error submitting answer. Please try again.');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Finish / Complete Session
  const handleFinishSession = async () => {
    if (!currentSession) return;
    setLoadingResults(true);
    try {
      const results = await completeAptitudeSession(currentSession.sessionId);
      setSessionResults(results);
      setViewMode('results');
      // Refresh stats & history in background
      getAptitudeStatistics().then(setStatistics).catch(console.error);
      getAptitudeHistory().then(setHistory).catch(console.error);
    } catch (err) {
      console.error('Error completing session:', err);
      alert('Failed to complete session. Please try again.');
    } finally {
      setLoadingResults(false);
    }
  };

  // Next / Previous Navigation
  const handleNextQuestion = () => {
    if (currentQuestionIndex < sessionQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      handleFinishSession();
    }
  };

  // View Past Session Results Modal
  const handleViewHistoricalResults = async (sessionId) => {
    setLoadingResults(true);
    try {
      const res = await getAptitudeSessionResults(sessionId);
      setReviewModalSession(res);
    } catch (err) {
      console.error('Error fetching past session results:', err);
      alert('Could not load session results.');
    } finally {
      setLoadingResults(false);
    }
  };

  // Return to Overview
  const handleBackToOverview = () => {
    setViewMode('overview');
    setCurrentSession(null);
    setSessionResults(null);
    fetchOverviewData();
  };

  if (loading && viewMode === 'overview' && !statistics) {
    return (
      <div className="aptitude-loading-screen">
        <div className="spinner"></div>
        <p>Loading Aptitude Preparation Tracker...</p>
      </div>
    );
  }

  return (
    <div className="aptitude-page-container">
      {/* ============================================================== */}
      {/* 1. OVERVIEW & SETUP VIEW */}
      {/* ============================================================== */}
      {viewMode === 'overview' && (
        <div className="aptitude-overview-view">
          {/* Header Banner */}
          <div className="aptitude-header-card">
            <div className="header-info">
              <div className="header-badge">Placement Preparation</div>
              <h1>📐 Aptitude Preparation Tracker</h1>
              <p>
                Practice Quantitative Aptitude, Logical Reasoning, and Verbal Ability tests.
                Get instant step-by-step explanations, master key topics, and evaluate placement readiness.
              </p>
            </div>
            <div className="header-quick-stats">
              <div className="qstat-pill">
                <span className="qstat-num">{statistics?.totalQuestionsInBank || 0}</span>
                <span className="qstat-label">Questions in Bank</span>
              </div>
              <div className="qstat-pill highlight-pill">
                <span className="qstat-num">{statistics?.overallAccuracyPercentage || 0}%</span>
                <span className="qstat-label">Overall Accuracy</span>
              </div>
            </div>
          </div>

          {error && <div className="aptitude-alert error-alert">{error}</div>}

          {/* Metric Cards Grid */}
          <div className="aptitude-metrics-grid">
            <div className="apt-metric-card primary-border">
              <div className="metric-header">
                <span className="m-icon">🎯</span>
                <span className="m-tag">Live Progress</span>
              </div>
              <span className="metric-val">{statistics?.totalQuestionsAttempted || 0}</span>
              <span className="metric-lbl">Total Questions Attempted</span>
              <div className="metric-subdetail">
                <span className="text-success font-bold">{statistics?.totalCorrectAnswers || 0} Correct</span>
                <span className="bullet-sep">•</span>
                <span className="text-danger font-bold">{statistics?.totalIncorrectAnswers || 0} Incorrect</span>
              </div>
            </div>

            <div className="apt-metric-card accent-border">
              <div className="metric-header">
                <span className="m-icon">⚡</span>
                <span className="m-tag">Accuracy</span>
              </div>
              <span className="metric-val">{statistics?.overallAccuracyPercentage || 0}%</span>
              <span className="metric-lbl">Overall Accuracy</span>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${Math.min(statistics?.overallAccuracyPercentage || 0, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="apt-metric-card info-border">
              <div className="metric-header">
                <span className="m-icon">🏆</span>
                <span className="m-tag">Completed</span>
              </div>
              <span className="metric-val">{statistics?.completedSessions || 0}</span>
              <span className="metric-lbl">Practice Sessions Finished</span>
              <span className="metric-subdetail">Consistent practice builds speed and confidence</span>
            </div>
          </div>

          {/* Category Progress Row */}
          <div className="category-progress-section">
            <h3 className="section-title">Category-wise Performance</h3>
            <div className="category-cards-grid">
              {statistics?.categoryPerformance?.map((cat) => (
                <div key={cat.name} className="category-stat-card">
                  <div className="cat-card-top">
                    <h4>{cat.name}</h4>
                    <span className="cat-acc-badge">{cat.accuracy}% Accuracy</span>
                  </div>
                  <div className="cat-card-body">
                    <div className="cat-stat-line">
                      <span>Attempted:</span>
                      <strong>{cat.attempted} / {cat.totalQuestions} questions</strong>
                    </div>
                    <div className="cat-stat-line">
                      <span>Correct Answers:</span>
                      <strong className="text-success">{cat.correct}</strong>
                    </div>
                  </div>
                  <div className="progress-bar-bg small-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${Math.min(cat.accuracy, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Practice Setup Form & Recent History 2-Column Section */}
          <div className="setup-and-history-row">
            {/* Practice Setup Card */}
            <div className="practice-setup-card">
              <div className="card-top-header">
                <span className="setup-icon">🚀</span>
                <div>
                  <h3>Start a Practice Test</h3>
                  <p>Customize your topic, difficulty, and question count.</p>
                </div>
              </div>

              {setupError && <div className="aptitude-alert error-alert">{setupError}</div>}

              <form onSubmit={handleStartPractice} className="setup-form">
                <div className="form-group">
                  <label htmlFor="category-select">1. Category</label>
                  <select
                    id="category-select"
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="custom-select"
                  >
                    {categories.map((c) => (
                      <option key={c.category} value={c.category}>
                        {c.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="topic-select">2. Topic (Optional)</label>
                  <select
                    id="topic-select"
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="custom-select"
                  >
                    <option value="">All Topics in {activeCategoryObj?.displayName || 'Category'}</option>
                    {currentTopics.map((top) => (
                      <option key={top} value={top}>
                        {top}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row-2col">
                  <div className="form-group">
                    <label htmlFor="diff-select">3. Difficulty</label>
                    <select
                      id="diff-select"
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                      className="custom-select"
                    >
                      <option value="">All Difficulties</option>
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="count-select">4. Questions</label>
                    <select
                      id="count-select"
                      value={questionCount}
                      onChange={(e) => setQuestionCount(e.target.value)}
                      className="custom-select"
                    >
                      <option value={5}>5 Questions</option>
                      <option value={10}>10 Questions</option>
                      <option value={15}>15 Questions</option>
                      <option value={20}>20 Questions</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-start-practice"
                  disabled={startingSession}
                >
                  {startingSession ? 'Preparing Questions...' : '⚡ Start Practice Session'}
                </button>
              </form>
            </div>

            {/* Practice History Card */}
            <div className="practice-history-card">
              <div className="card-top-header">
                <span className="setup-icon">📜</span>
                <div>
                  <h3>Recent Practice History</h3>
                  <p>Your previous aptitude test attempts and scores.</p>
                </div>
              </div>

              {history.length === 0 ? (
                <div className="history-empty-state">
                  <span className="empty-icon">📝</span>
                  <h4>No practice tests yet</h4>
                  <p>Start your first practice session on the left to track your scores and review explanations!</p>
                </div>
              ) : (
                <div className="history-table-container">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Score</th>
                        <th>Accuracy</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.slice(0, 7).map((s) => (
                        <tr key={s.id}>
                          <td>{new Date(s.startedAt).toLocaleDateString()}</td>
                          <td>
                            <span className="hist-cat">{s.categoryDisplayName || s.category}</span>
                            {s.topicFilter && <small className="hist-topic">{s.topicFilter}</small>}
                          </td>
                          <td>
                            <strong>{s.correctAnswers}</strong> / {s.totalQuestions}
                          </td>
                          <td>
                            <span
                              className={`accuracy-badge ${
                                s.accuracyPercentage >= 70
                                  ? 'badge-high'
                                  : s.accuracyPercentage >= 40
                                  ? 'badge-mid'
                                  : 'badge-low'
                              }`}
                            >
                              {s.accuracyPercentage}%
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-view"
                              onClick={() => handleViewHistoricalResults(s.id)}
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. ACTIVE PRACTICE SCREEN */}
      {/* ============================================================== */}
      {viewMode === 'practice' && activeQuestion && (
        <div className="aptitude-practice-view">
          {/* Practice Top Bar */}
          <div className="practice-top-bar">
            <div className="session-info-left">
              <button className="btn btn-secondary btn-back-exit" onClick={handleBackToOverview}>
                ← Exit Practice
              </button>
              <div className="session-title-tags">
                <span className="tag category-tag">{activeQuestion.categoryDisplayName || activeQuestion.category}</span>
                <span className="tag topic-tag">{activeQuestion.topic}</span>
                <span className={`tag diff-tag diff-${activeQuestion.difficulty?.toLowerCase()}`}>
                  {activeQuestion.difficulty}
                </span>
              </div>
            </div>

            <div className="session-info-right">
              <span className="question-counter">
                Question <strong>{currentQuestionIndex + 1}</strong> of <strong>{sessionQuestions.length}</strong>
              </span>
              <button
                className="btn btn-finish-early"
                onClick={handleFinishSession}
                disabled={loadingResults}
              >
                {loadingResults ? 'Finishing...' : 'Finish Test 🏁'}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="progress-bar-bg session-progress">
            <div
              className="progress-bar-fill"
              style={{
                width: `${((currentQuestionIndex + 1) / sessionQuestions.length) * 100}%`,
              }}
            ></div>
          </div>

          {/* Question Container Card */}
          <div className="question-main-card">
            <div className="question-header">
              <span className="q-badge">Question #{currentQuestionIndex + 1}</span>
            </div>

            <div className="question-body">
              <p className="question-text">{activeQuestion.questionText}</p>
            </div>

            {/* Options List */}
            <div className="options-grid">
              {['A', 'B', 'C', 'D'].map((optKey) => {
                const optText = activeQuestion[`option${optKey}`];
                const isSelected = selectedOption === optKey;
                const isAnswered = activeQuestion.answered;
                const isCorrectOpt = currentAnswerResult?.correctOption === optKey;
                const isUserChosen = currentAnswerResult?.selectedOption === optKey;

                let optionClass = 'option-card';
                if (isSelected) optionClass += ' selected';
                if (isAnswered) {
                  optionClass += ' locked';
                  if (isCorrectOpt) {
                    optionClass += ' correct-option';
                  } else if (isUserChosen && !currentAnswerResult?.isCorrect) {
                    optionClass += ' incorrect-option';
                  }
                }

                return (
                  <button
                    key={optKey}
                    type="button"
                    className={optionClass}
                    onClick={() => {
                      if (!isAnswered) {
                        setSelectedOption(optKey);
                      }
                    }}
                    disabled={isAnswered}
                  >
                    <span className="opt-letter">{optKey}</span>
                    <span className="opt-text">{optText}</span>
                    {isAnswered && isCorrectOpt && <span className="opt-status-icon">✓</span>}
                    {isAnswered && isUserChosen && !currentAnswerResult?.isCorrect && (
                      <span className="opt-status-icon">✗</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Submit / Action Bar */}
            {!activeQuestion.answered ? (
              <div className="practice-action-bar">
                <button
                  className="btn btn-primary btn-submit-ans"
                  onClick={handleSubmitAnswer}
                  disabled={!selectedOption || submittingAnswer}
                >
                  {submittingAnswer ? 'Evaluating...' : '✓ Submit Answer'}
                </button>
                {!selectedOption && (
                  <span className="select-prompt">Please select an option to submit</span>
                )}
              </div>
            ) : (
              <div className="post-submission-container">
                {/* Immediate Feedback Badge */}
                <div
                  className={`feedback-banner ${
                    currentAnswerResult?.isCorrect ? 'banner-correct' : 'banner-incorrect'
                  }`}
                >
                  <div className="banner-icon">{currentAnswerResult?.isCorrect ? '🎉' : '❌'}</div>
                  <div className="banner-content">
                    <h4>
                      {currentAnswerResult?.isCorrect
                        ? 'Correct Answer!'
                        : `Incorrect. The correct answer is Option ${currentAnswerResult?.correctOption}.`}
                    </h4>
                  </div>
                </div>

                {/* Detailed Explanation */}
                <div className="explanation-card">
                  <div className="exp-header">
                    <span className="exp-icon">💡</span>
                    <h5>Step-by-Step Explanation</h5>
                  </div>
                  <div className="exp-body">
                    <p>{currentAnswerResult?.explanation}</p>
                  </div>
                </div>

                {/* Next Question / Finish Session Button */}
                <div className="practice-action-bar right-align">
                  {currentQuestionIndex < sessionQuestions.length - 1 ? (
                    <button className="btn btn-primary btn-next-q" onClick={handleNextQuestion}>
                      Next Question →
                    </button>
                  ) : (
                    <button
                      className="btn btn-success btn-next-q"
                      onClick={handleFinishSession}
                      disabled={loadingResults}
                    >
                      {loadingResults ? 'Calculating Results...' : 'View Session Results 🏆'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. SESSION RESULTS SCREEN */}
      {/* ============================================================== */}
      {viewMode === 'results' && sessionResults && (
        <div className="aptitude-results-view">
          <div className="results-header-card">
            <div className="results-hero">
              <span className="hero-emoji">
                {sessionResults.accuracyPercentage >= 70
                  ? '🎯'
                  : sessionResults.accuracyPercentage >= 40
                  ? '👍'
                  : '📚'}
              </span>
              <h2>Practice Session Completed!</h2>
              <p>
                {sessionResults.categoryDisplayName || sessionResults.category}
                {sessionResults.topicFilter && ` • ${sessionResults.topicFilter}`}
              </p>
            </div>

            <div className="results-score-tiles">
              <div className="score-tile">
                <span className="tile-num">{sessionResults.totalQuestions}</span>
                <span className="tile-label">Total Questions</span>
              </div>
              <div className="score-tile">
                <span className="tile-num text-success">{sessionResults.correctAnswers}</span>
                <span className="tile-label">Correct</span>
              </div>
              <div className="score-tile">
                <span className="tile-num text-danger">{sessionResults.incorrectAnswers}</span>
                <span className="tile-label">Incorrect</span>
              </div>
              <div className="score-tile highlight-tile">
                <span className="tile-num">{sessionResults.accuracyPercentage}%</span>
                <span className="tile-label">Accuracy</span>
              </div>
            </div>

            <div className="results-actions-row">
              <button className="btn btn-primary" onClick={handleBackToOverview}>
                ⚡ Practice Another Topic
              </button>
            </div>
          </div>

          {/* Question-by-Question Review List */}
          <div className="results-review-section">
            <h3>Detailed Question Review & Explanations</h3>
            <div className="review-cards-list">
              {sessionResults.questionReviews?.map((rev, index) => (
                <div
                  key={rev.questionId}
                  className={`review-card ${rev.isCorrect ? 'review-correct' : 'review-incorrect'}`}
                >
                  <div className="review-header">
                    <span className="rev-num">Question {index + 1}</span>
                    <span className="rev-topic">{rev.topic}</span>
                    <span className={`tag diff-tag diff-${rev.difficulty?.toLowerCase()}`}>
                      {rev.difficulty}
                    </span>
                    <span className={`status-pill ${rev.isCorrect ? 'pill-success' : 'pill-danger'}`}>
                      {rev.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                  </div>

                  <p className="rev-qtext">{rev.questionText}</p>

                  <div className="review-options-grid">
                    {['A', 'B', 'C', 'D'].map((opt) => (
                      <div
                        key={opt}
                        className={`rev-opt ${
                          opt === rev.correctOption
                            ? 'rev-opt-correct'
                            : opt === rev.selectedOption && !rev.isCorrect
                            ? 'rev-opt-incorrect'
                            : ''
                        }`}
                      >
                        <strong>{opt}:</strong> {rev[`option${opt}`]}
                        {opt === rev.correctOption && ' (Correct Answer)'}
                        {opt === rev.selectedOption && opt !== rev.correctOption && ' (Your Answer)'}
                      </div>
                    ))}
                  </div>

                  <div className="review-explanation">
                    <strong>💡 Explanation:</strong> {rev.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. HISTORICAL SESSION REVIEW MODAL */}
      {/* ============================================================== */}
      {reviewModalSession && (
        <div className="modal-overlay" onClick={() => setReviewModalSession(null)}>
          <div className="modal-card review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                Session Review — {reviewModalSession.categoryDisplayName || reviewModalSession.category}
              </h3>
              <button className="btn-close" onClick={() => setReviewModalSession(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-summary-pills">
                <span>Total: {reviewModalSession.totalQuestions}</span>
                <span className="text-success">Correct: {reviewModalSession.correctAnswers}</span>
                <span className="text-danger">Incorrect: {reviewModalSession.incorrectAnswers}</span>
                <strong>Accuracy: {reviewModalSession.accuracyPercentage}%</strong>
              </div>

              <div className="modal-review-list">
                {reviewModalSession.questionReviews?.map((r, i) => (
                  <div
                    key={r.questionId}
                    className={`modal-q-item ${r.isCorrect ? 'border-success' : 'border-danger'}`}
                  >
                    <div className="modal-q-meta">
                      <strong>Q{i + 1}. {r.topic}</strong>
                      <span className={r.isCorrect ? 'text-success' : 'text-danger'}>
                        {r.isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                    <p className="modal-q-text">{r.questionText}</p>
                    <div className="modal-ans-info">
                      <div>Your Answer: <strong>Option {r.selectedOption || 'None'}</strong></div>
                      <div>Correct Answer: <strong className="text-success">Option {r.correctOption}</strong></div>
                    </div>
                    <div className="modal-explanation">
                      <em>Explanation:</em> {r.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setReviewModalSession(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AptitudePage;
