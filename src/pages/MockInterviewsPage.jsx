import React, { useState, useEffect } from 'react';
import {
  getMockInterviews,
  createMockInterview,
  updateMockInterview,
  deleteMockInterview,
  getMockInterviewStats,
} from '../services/api';
import './MockInterviewsPage.css';

const INTERVIEW_TYPES = [
  { value: 'TECHNICAL', label: 'Technical & Coding' },
  { value: 'HR', label: 'HR & Cultural Fit' },
  { value: 'BEHAVIORAL', label: 'Behavioral (STAR)' },
  { value: 'SYSTEM_DESIGN', label: 'System Design & Arch' },
  { value: 'MIXED', label: 'Comprehensive / Mixed' },
];

const PRACTICE_QUESTIONS = [
  {
    type: 'TECHNICAL',
    question: 'How do you detect and break a cycle in a linked list? Explain Floyd’s Cycle-Finding Algorithm (Tortoise and Hare).',
    hint: 'Use two pointers moving at speeds 1x and 2x. If they meet, reset one pointer to head.',
  },
  {
    type: 'TECHNICAL',
    question: 'Explain the internal working of HashMap in Java. How are hash collisions resolved in Java 8+?',
    hint: 'Buckets, hash function, linked list up to threshold 8, then red-black tree conversion.',
  },
  {
    type: 'BEHAVIORAL',
    question: 'Tell me about a time you faced a tight deadline or high pressure on a software project. How did you prioritize tasks?',
    hint: 'Use the STAR method: Situation, Task, Action, and measurable Result.',
  },
  {
    type: 'HR',
    question: 'Why do you want to join our organization specifically, and where do you see your engineering career in 3 years?',
    hint: 'Align your personal growth goals with company culture, tech stack, and values.',
  },
  {
    type: 'SYSTEM_DESIGN',
    question: 'Design a scalable URL shortener service (like TinyURL or Bit.ly). How do you handle 10,000 requests/sec?',
    hint: 'Base62 encoding, distributed key-generation service, Redis caching layer, NoSQL/RDBMS storage.',
  },
];

const MockInterviewsPage = () => {
  const [interviews, setInterviews] = useState([]);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    completedCount: 0,
    scheduledCount: 0,
    cancelledCount: 0,
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Modal & Practice State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Interactive Practice Session Mode
  const [practiceActive, setPracticeActive] = useState(false);
  const [practiceQIndex, setPracticeQIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [practiceNotes, setPracticeNotes] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    interviewType: 'TECHNICAL',
    targetCompany: '',
    targetRole: '',
    scheduledDate: '',
    durationMinutes: 45,
    status: 'SCHEDULED',
    rating: 8,
    feedback: '',
    strengths: '',
    areasOfImprovement: '',
    notes: '',
  });

  useEffect(() => {
    fetchInterviews();
    fetchStats();
  }, [selectedStatus]);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      const data = await getMockInterviews(params);
      setInterviews(data || []);
    } catch (err) {
      console.error('Failed to load mock interviews:', err);
      showAlert('error', 'Failed to load mock interviews.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await getMockInterviewStats();
      if (statsData) setStats(statsData);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 5000);
  };

  const handleOpenScheduleModal = () => {
    setEditingItem(null);
    const nowLocal = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
    setFormData({
      title: '',
      interviewType: 'TECHNICAL',
      targetCompany: '',
      targetRole: 'Software Engineer',
      scheduledDate: nowLocal,
      durationMinutes: 45,
      status: 'SCHEDULED',
      rating: 8,
      feedback: '',
      strengths: '',
      areasOfImprovement: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title || '',
      interviewType: item.interviewType || 'TECHNICAL',
      targetCompany: item.targetCompany || '',
      targetRole: item.targetRole || '',
      scheduledDate: item.scheduledDate ? item.scheduledDate.slice(0, 16) : '',
      durationMinutes: item.durationMinutes || 45,
      status: item.status || 'SCHEDULED',
      rating: item.rating || 8,
      feedback: item.feedback || '',
      strengths: item.strengths || '',
      areasOfImprovement: item.areasOfImprovement || '',
      notes: item.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.scheduledDate) {
      showAlert('error', 'Title and Scheduled Date are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: formData.title.trim(),
        interviewType: formData.interviewType,
        targetCompany: formData.targetCompany.trim() || null,
        targetRole: formData.targetRole.trim() || null,
        scheduledDate: formData.scheduledDate,
        durationMinutes: parseInt(formData.durationMinutes, 10) || 45,
        status: formData.status,
        rating: formData.status === 'COMPLETED' ? parseInt(formData.rating, 10) : null,
        feedback: formData.feedback.trim() || null,
        strengths: formData.strengths.trim() || null,
        areasOfImprovement: formData.areasOfImprovement.trim() || null,
        notes: formData.notes.trim() || null,
      };

      if (editingItem) {
        await updateMockInterview(editingItem.id, payload);
        showAlert('success', 'Mock interview updated successfully!');
      } else {
        await createMockInterview(payload);
        showAlert('success', 'Mock interview scheduled successfully!');
      }

      handleCloseModal();
      fetchInterviews();
      fetchStats();
    } catch (err) {
      console.error('Failed to save mock interview:', err);
      showAlert('error', err.response?.data?.message || 'Failed to save mock interview.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMockInterview(id);
      showAlert('success', 'Mock interview session deleted.');
      setDeleteTargetId(null);
      fetchInterviews();
      fetchStats();
    } catch (err) {
      console.error('Failed to delete interview:', err);
      showAlert('error', 'Failed to delete mock interview.');
    }
  };

  // Practice session methods
  const startPractice = () => {
    setPracticeActive(true);
    setPracticeQIndex(0);
    setTimerSeconds(0);
    setIsTimerRunning(true);
    setPracticeNotes('');
  };

  const finishAndSavePractice = async () => {
    setIsTimerRunning(false);
    const q = PRACTICE_QUESTIONS[practiceQIndex];
    try {
      await createMockInterview({
        title: `Self-Practice: ${q.type} (${q.question.slice(0, 35)}...)`,
        interviewType: q.type,
        targetCompany: 'Self-Practice Drill',
        targetRole: 'Software Engineer',
        scheduledDate: new Date().toISOString(),
        durationMinutes: Math.max(1, Math.round(timerSeconds / 60)),
        status: 'COMPLETED',
        rating: 8,
        feedback: `Completed prompt in ${Math.floor(timerSeconds / 60)}m ${timerSeconds % 60}s.`,
        strengths: 'Clear explanation and structured thinking.',
        areasOfImprovement: 'Keep refining time management.',
        notes: practiceNotes,
      });
      showAlert('success', 'Practice drill saved to completed mock sessions!');
      setPracticeActive(false);
      fetchInterviews();
      fetchStats();
    } catch (err) {
      console.error('Failed to save practice:', err);
      showAlert('error', 'Could not record practice session.');
    }
  };

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mock-interviews-page-container">
      {/* Header */}
      <div className="page-header-flex">
        <div>
          <h1 className="page-title">Mock Interviews & Rehearsals</h1>
          <p className="page-subtitle">
            Schedule peer mock rounds, practice interview prompts with live timers, and log feedback.
          </p>
        </div>
        <div className="header-actions-group">
          <button className="btn-start-practice" onClick={startPractice}>
            ⚡ Practice Drill Mode
          </button>
          <button className="btn-add-interview" onClick={handleOpenScheduleModal}>
            + Schedule Mock Round
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {alert.message && (
        <div className={`alert-banner ${alert.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          <span>{alert.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{alert.message}</span>
        </div>
      )}

      {/* Interactive Practice Drill Banner */}
      {practiceActive && (
        <div className="practice-session-card">
          <div className="practice-header">
            <span className="practice-badge">⚡ Interactive Drill Mode</span>
            <div className="practice-timer">
              ⏱️ {formatTimer(timerSeconds)}
              <button
                className="btn-timer-toggle"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
              >
                {isTimerRunning ? 'Pause' : 'Resume'}
              </button>
            </div>
            <button className="btn-close-practice" onClick={() => setPracticeActive(false)}>
              ✕ Exit Drill
            </button>
          </div>

          <div className="practice-body">
            <div className="practice-type-tag">
              Category: <strong>{PRACTICE_QUESTIONS[practiceQIndex].type}</strong> (Question{' '}
              {practiceQIndex + 1} of {PRACTICE_QUESTIONS.length})
            </div>
            <h3 className="practice-question-text">
              "{PRACTICE_QUESTIONS[practiceQIndex].question}"
            </h3>
            <p className="practice-hint">💡 Hint: {PRACTICE_QUESTIONS[practiceQIndex].hint}</p>

            <div className="practice-notes-area">
              <label>Draft Your Solution & Speaking Notes:</label>
              <textarea
                rows="4"
                placeholder="Bullet points for approach, trade-offs, STAR situation, edge cases..."
                value={practiceNotes}
                onChange={(e) => setPracticeNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="practice-footer">
            <button
              className="btn-next-q"
              onClick={() => {
                setPracticeQIndex((prev) => (prev + 1) % PRACTICE_QUESTIONS.length);
                setTimerSeconds(0);
              }}
            >
              Next Question ➔
            </button>
            <button className="btn-finish-practice" onClick={finishAndSavePractice}>
              ✓ Finish & Log as Completed Session
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="interview-stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper icon-blue">🎙️</div>
          <div>
            <div className="stat-num">{stats.totalInterviews}</div>
            <div className="stat-text">Total Recorded</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper icon-green">🏆</div>
          <div>
            <div className="stat-num">{stats.completedCount}</div>
            <div className="stat-text">Completed Sessions</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper icon-amber">📅</div>
          <div>
            <div className="stat-num">{stats.scheduledCount}</div>
            <div className="stat-text">Scheduled Upcoming</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper icon-purple">⭐</div>
          <div>
            <div className="stat-num">{stats.averageRating > 0 ? `${stats.averageRating} / 10` : 'N/A'}</div>
            <div className="stat-text">Average Rating</div>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="interview-filter-row">
        {['ALL', 'SCHEDULED', 'COMPLETED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            className={`filter-pill ${selectedStatus === st ? 'pill-active' : ''}`}
            onClick={() => setSelectedStatus(st)}
          >
            {st === 'ALL' ? 'All Sessions' : st.charAt(0) + st.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Sessions List */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading mock interview records...</p>
        </div>
      ) : interviews.length === 0 ? (
        <div className="empty-mock-state">
          <div className="empty-icon">🎙️</div>
          <h3>No mock interviews found</h3>
          <p>
            Schedule your first practice session or launch the drill mode to test your technical and
            HR communication skills under realistic constraints.
          </p>
          <button className="btn-add-interview" onClick={handleOpenScheduleModal}>
            + Schedule Mock Interview
          </button>
        </div>
      ) : (
        <div className="interviews-grid">
          {interviews.map((item) => (
            <div key={item.id} className="interview-card">
              <div className="interview-card-header">
                <div>
                  <h3 className="interview-title">{item.title}</h3>
                  <div className="interview-company-role">
                    {item.targetCompany && <span>🏢 {item.targetCompany}</span>}
                    {item.targetRole && <span>💼 {item.targetRole}</span>}
                  </div>
                </div>
                <div className="badge-col">
                  <span
                    className={`status-tag status-${item.status.toLowerCase()}`}
                  >
                    {item.status}
                  </span>
                  <span className="type-tag">{item.interviewType}</span>
                </div>
              </div>

              <div className="interview-details-row">
                <span>📅 {item.scheduledDate ? item.scheduledDate.replace('T', ' ') : 'N/A'}</span>
                <span>⏱️ {item.durationMinutes} mins</span>
                {item.rating && <span className="rating-tag">⭐ {item.rating}/10</span>}
              </div>

              {item.feedback && (
                <div className="feedback-section">
                  <strong>Interviewer Feedback:</strong>
                  <p>{item.feedback}</p>
                </div>
              )}

              {(item.strengths || item.areasOfImprovement) && (
                <div className="feedback-split">
                  {item.strengths && (
                    <div className="strength-box">
                      <span className="box-title">💪 Strengths</span>
                      <p>{item.strengths}</p>
                    </div>
                  )}
                  {item.areasOfImprovement && (
                    <div className="improve-box">
                      <span className="box-title">🎯 Areas for Improvement</span>
                      <p>{item.areasOfImprovement}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="interview-card-footer">
                <button className="btn-card-edit" onClick={() => handleOpenEditModal(item)}>
                  ✏ Edit / Add Feedback
                </button>
                <button
                  className="btn-card-delete"
                  onClick={() => setDeleteTargetId(item.id)}
                  title="Delete"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Schedule / Log Feedback */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content interview-modal">
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Mock Session / Feedback' : 'Schedule Mock Interview'}</h2>
              <button className="btn-close-modal" onClick={handleCloseModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="interview-form">
              <div className="form-group">
                <label>Session Title *</label>
                <input
                  type="text"
                  placeholder="e.g. SDE-1 Technical Mock Round 1"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Interview Category *</label>
                  <select
                    value={formData.interviewType}
                    onChange={(e) => setFormData({ ...formData, interviewType: e.target.value })}
                  >
                    {INTERVIEW_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Target Company</label>
                  <input
                    type="text"
                    placeholder="e.g. Amazon, Google, Startups"
                    value={formData.targetCompany}
                    onChange={(e) => setFormData({ ...formData, targetCompany: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Target Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Backend Engineer"
                    value={formData.targetRole}
                    onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Duration (Minutes)</label>
                  <input
                    type="number"
                    min="15"
                    max="180"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                  />
                </div>
              </div>

              {formData.status === 'COMPLETED' && (
                <>
                  <div className="form-group">
                    <label>Overall Score / Rating (1 to 10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Interviewer Feedback</label>
                    <textarea
                      rows="3"
                      placeholder="Summary of questions asked, communication quality, code clarity..."
                      value={formData.feedback}
                      onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                    />
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Strengths</label>
                      <textarea
                        rows="2"
                        placeholder="e.g. Strong complexity analysis, edge cases addressed"
                        value={formData.strengths}
                        onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Areas for Improvement</label>
                      <textarea
                        rows="2"
                        placeholder="e.g. Need more practice with dynamic programming memoization"
                        value={formData.areasOfImprovement}
                        onChange={(e) =>
                          setFormData({ ...formData, areasOfImprovement: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingItem ? 'Save Updates' : 'Schedule Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTargetId && (
        <div className="modal-backdrop">
          <div className="modal-content delete-modal">
            <h3>Delete Session Record?</h3>
            <p>Are you sure you want to delete this mock interview record? This cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setDeleteTargetId(null)}>
                Cancel
              </button>
              <button className="btn-confirm-delete" onClick={() => handleDelete(deleteTargetId)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockInterviewsPage;
