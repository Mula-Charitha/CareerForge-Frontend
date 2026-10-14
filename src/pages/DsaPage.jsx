import React, { useState, useEffect } from 'react';
import {
  getDsaProblems,
  createDsaProblem,
  updateDsaProblem,
  deleteDsaProblem,
  getDsaStatistics,
  getDsaTopics,
} from '../services/api';
import './DsaPage.css';

const DsaPage = () => {
  const [problems, setProblems] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filters, setFilters] = useState({
    topic: '',
    difficulty: '',
    status: '',
    platform: '',
    search: '',
  });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    topic: 'Arrays',
    difficulty: 'EASY',
    platform: 'LEETCODE',
    problemUrl: '',
    status: 'NOT_STARTED',
    dateSolved: '',
    notes: '',
    programmingLanguage: 'Java',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Delete confirmation
  const [deleteId, setDeleteId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [problemsData, statsData, topicsData] = await Promise.all([
        getDsaProblems(filters),
        getDsaStatistics(),
        getDsaTopics(),
      ]);

      setProblems(problemsData);
      setStatistics(statsData);
      setTopics(topicsData);
    } catch (err) {
      console.error('Error fetching DSA data:', err);
      setErrorMsg('Failed to load DSA data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      topic: '',
      difficulty: '',
      status: '',
      platform: '',
      search: '',
    });
  };

  const openAddModal = () => {
    setEditingProblem(null);
    setFormData({
      title: '',
      topic: topics[0] || 'Arrays',
      difficulty: 'EASY',
      platform: 'LEETCODE',
      problemUrl: '',
      status: 'NOT_STARTED',
      dateSolved: '',
      notes: '',
      programmingLanguage: 'Java',
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (problem) => {
    setEditingProblem(problem);
    setFormData({
      title: problem.title || '',
      topic: problem.topic || 'Arrays',
      difficulty: problem.difficulty || 'EASY',
      platform: problem.platform || 'LEETCODE',
      problemUrl: problem.problemUrl || '',
      status: problem.status || 'NOT_STARTED',
      dateSolved: problem.dateSolved || '',
      notes: problem.notes || '',
      programmingLanguage: problem.programmingLanguage || 'Java',
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'status' && value === 'SOLVED' && !prev.dateSolved) {
        updated.dateSolved = new Date().toISOString().split('T')[0];
      }
      return updated;
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setErrorMsg('Problem title is required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        ...formData,
        dateSolved: formData.status === 'SOLVED' ? (formData.dateSolved || new Date().toISOString().split('T')[0]) : null,
      };

      if (editingProblem) {
        await updateDsaProblem(editingProblem.id, payload);
        setSuccessMsg('DSA Problem updated successfully!');
      } else {
        await createDsaProblem(payload);
        setSuccessMsg('DSA Problem added successfully!');
      }

      setModalOpen(false);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save DSA problem.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (problemId, newStatus) => {
    try {
      const target = problems.find((p) => p.id === problemId);
      if (!target) return;

      const payload = {
        ...target,
        status: newStatus,
        dateSolved: newStatus === 'SOLVED' ? (target.dateSolved || new Date().toISOString().split('T')[0]) : null,
      };

      await updateDsaProblem(problemId, payload);
      fetchData();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDsaProblem(deleteId);
      setDeleteId(null);
      setSuccessMsg('Problem deleted successfully!');
      fetchData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg('Failed to delete problem.');
    }
  };

  const getDifficultyClass = (diff) => {
    switch (diff) {
      case 'EASY': return 'diff-easy';
      case 'MEDIUM': return 'diff-medium';
      case 'HARD': return 'diff-hard';
      default: return '';
    }
  };

  const getStatusClass = (st) => {
    switch (st) {
      case 'SOLVED': return 'status-solved';
      case 'ATTEMPTED': return 'status-attempted';
      case 'NOT_STARTED': return 'status-not-started';
      default: return '';
    }
  };

  return (
    <div className="dsa-page-container">
      {/* Header */}
      <div className="dsa-header">
        <div>
          <h2>⚡ DSA Preparation Tracker</h2>
          <p className="dsa-subtitle">
            Track your problem-solving journey and stay placement-ready.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          ➕ Add Problem
        </button>
      </div>

      {successMsg && <div className="profile-alert success-alert">{successMsg}</div>}
      {errorMsg && <div className="profile-alert error-alert">{errorMsg}</div>}

      {/* Top Statistics Cards */}
      {statistics && (
        <>
          <div className="dsa-stats-grid">
            <div className="stat-card">
              <span className="stat-icon">🎯</span>
              <div className="stat-info">
                <span className="stat-label">Overall DSA Progress</span>
                <span className="stat-value">{statistics.overallProgress}%</span>
              </div>
              <div className="stat-bar">
                <div className="stat-bar-fill" style={{ width: `${statistics.overallProgress}%` }}></div>
              </div>
            </div>

            <div className="stat-card">
              <span className="stat-icon">✅</span>
              <div className="stat-info">
                <span className="stat-label">Problems Solved</span>
                <span className="stat-value">{statistics.solvedProblems} <span className="stat-total">/ {statistics.totalProblems}</span></span>
              </div>
            </div>

            <div className="stat-card">
              <span className="stat-icon">⏳</span>
              <div className="stat-info">
                <span className="stat-label">Attempted Problems</span>
                <span className="stat-value">{statistics.attemptedProblems}</span>
              </div>
            </div>

            <div className="stat-card">
              <span className="stat-icon">📌</span>
              <div className="stat-info">
                <span className="stat-label">Remaining / To Do</span>
                <span className="stat-value">{statistics.notStartedProblems}</span>
              </div>
            </div>
          </div>

          {/* Difficulty Breakdown Cards */}
          <div className="difficulty-cards-grid">
            <div className="diff-card diff-card-easy">
              <span className="diff-badge">EASY</span>
              <span className="diff-count">{statistics.easyProblems}</span>
              <span className="diff-label">Problems</span>
            </div>
            <div className="diff-card diff-card-medium">
              <span className="diff-badge">MEDIUM</span>
              <span className="diff-count">{statistics.mediumProblems}</span>
              <span className="diff-label">Problems</span>
            </div>
            <div className="diff-card diff-card-hard">
              <span className="diff-badge">HARD</span>
              <span className="diff-count">{statistics.hardProblems}</span>
              <span className="diff-label">Problems</span>
            </div>
          </div>

          {/* Topic-wise Progress Breakdown */}
          <div className="topic-progress-section">
            <h3>📚 Topic-Wise Progress</h3>
            <div className="topics-grid">
              {statistics.topicWiseProgress?.map((tp) => (
                <div
                  key={tp.topic}
                  className={`topic-card ${filters.topic === tp.topic ? 'selected-topic' : ''}`}
                  onClick={() => setFilters((prev) => ({ ...prev, topic: prev.topic === tp.topic ? '' : tp.topic }))}
                >
                  <div className="topic-card-header">
                    <span className="topic-name">{tp.topic}</span>
                    <span className="topic-percent">{tp.completionPercentage}%</span>
                  </div>
                  <div className="topic-bar">
                    <div className="topic-bar-fill" style={{ width: `${tp.completionPercentage}%` }}></div>
                  </div>
                  <span className="topic-count">{tp.solvedProblems} / {tp.totalProblems} Solved</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Filter & Search Controls */}
      <div className="dsa-controls-card">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            name="search"
            placeholder="Search problem title..."
            value={filters.search}
            onChange={handleFilterChange}
          />
        </div>

        <div className="filters-row">
          <select name="topic" value={filters.topic} onChange={handleFilterChange}>
            <option value="">All Topics</option>
            {topics.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select name="difficulty" value={filters.difficulty} onChange={handleFilterChange}>
            <option value="">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>

          <select name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="">All Statuses</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="ATTEMPTED">Attempted</option>
            <option value="SOLVED">Solved</option>
          </select>

          <select name="platform" value={filters.platform} onChange={handleFilterChange}>
            <option value="">All Platforms</option>
            <option value="LEETCODE">LeetCode</option>
            <option value="GFG">GeeksforGeeks</option>
            <option value="CODECHEF">CodeChef</option>
            <option value="OTHER">Other</option>
          </select>

          {(filters.topic || filters.difficulty || filters.status || filters.platform || filters.search) && (
            <button className="btn btn-secondary btn-sm" onClick={handleClearFilters}>
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Problem Table */}
      {loading ? (
        <div className="dsa-loading">
          <div className="auth-spinner"></div>
          <p>Loading problems...</p>
        </div>
      ) : problems.length > 0 ? (
        <div className="table-responsive-card">
          <table className="dsa-table">
            <thead>
              <tr>
                <th>Problem</th>
                <th>Topic</th>
                <th>Difficulty</th>
                <th>Platform</th>
                <th>Status</th>
                <th>Date Solved</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((prob) => (
                <tr key={prob.id}>
                  <td className="prob-title-cell">
                    {prob.problemUrl ? (
                      <a href={prob.problemUrl} target="_blank" rel="noopener noreferrer" className="prob-link">
                        {prob.title} ↗
                      </a>
                    ) : (
                      <span className="prob-title-text">{prob.title}</span>
                    )}
                    {prob.notes && <span className="prob-notes-snippet" title={prob.notes}>📝 Notes</span>}
                  </td>
                  <td><span className="topic-badge">{prob.topic}</span></td>
                  <td>
                    <span className={`diff-pill ${getDifficultyClass(prob.difficulty)}`}>
                      {prob.difficulty}
                    </span>
                  </td>
                  <td><span className="platform-pill">{prob.platform}</span></td>
                  <td>
                    <select
                      className={`status-select ${getStatusClass(prob.status)}`}
                      value={prob.status}
                      onChange={(e) => handleQuickStatusChange(prob.id, e.target.value)}
                    >
                      <option value="NOT_STARTED">NOT STARTED</option>
                      <option value="ATTEMPTED">ATTEMPTED</option>
                      <option value="SOLVED">SOLVED</option>
                    </select>
                  </td>
                  <td className="date-cell">{prob.dateSolved || '-'}</td>
                  <td className="actions-cell">
                    <button className="btn-icon" onClick={() => openEditModal(prob)} title="Edit Problem">
                      ✏️
                    </button>
                    <button className="btn-icon btn-delete" onClick={() => setDeleteId(prob.id)} title="Delete Problem">
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="dsa-empty-state">
          <div className="empty-icon">⚡</div>
          <h3>No DSA problems found</h3>
          <p>
            {filters.topic || filters.difficulty || filters.status || filters.platform || filters.search
              ? 'No problems match your filter criteria. Try resetting filters.'
              : 'No DSA problems added yet. Start tracking your DSA journey!'}
          </p>
          <button className="btn btn-primary" onClick={openAddModal}>
            ➕ Add Your First Problem
          </button>
        </div>
      )}

      {/* Add / Edit Problem Modal */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingProblem ? '✏️ Edit DSA Problem' : '➕ Add DSA Problem'}</h3>
              <button className="modal-close-btn" onClick={() => setModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleFormSubmit} className="modal-form">
              <div className="form-group">
                <label>Problem Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="e.g. Two Sum"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Topic *</label>
                  <select name="topic" value={formData.topic} onChange={handleFormChange} required>
                    {topics.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Difficulty *</label>
                  <select name="difficulty" value={formData.difficulty} onChange={handleFormChange} required>
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Platform *</label>
                  <select name="platform" value={formData.platform} onChange={handleFormChange} required>
                    <option value="LEETCODE">LeetCode</option>
                    <option value="GFG">GeeksforGeeks</option>
                    <option value="CODECHEF">CodeChef</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Status *</label>
                  <select name="status" value={formData.status} onChange={handleFormChange} required>
                    <option value="NOT_STARTED">NOT STARTED</option>
                    <option value="ATTEMPTED">ATTEMPTED</option>
                    <option value="SOLVED">SOLVED</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Problem URL</label>
                  <input
                    type="url"
                    name="problemUrl"
                    value={formData.problemUrl}
                    onChange={handleFormChange}
                    placeholder="https://leetcode.com/problems/two-sum/"
                  />
                </div>

                <div className="form-group">
                  <label>Date Solved</label>
                  <input
                    type="date"
                    name="dateSolved"
                    value={formData.dateSolved}
                    onChange={handleFormChange}
                    disabled={formData.status !== 'SOLVED'}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Programming Language</label>
                <input
                  type="text"
                  name="programmingLanguage"
                  value={formData.programmingLanguage}
                  onChange={handleFormChange}
                  placeholder="e.g. Java, C++, Python"
                />
              </div>

              <div className="form-group">
                <label>Notes / Solution Hints</label>
                <textarea
                  name="notes"
                  rows="3"
                  value={formData.notes}
                  onChange={handleFormChange}
                  placeholder="e.g. Used HashMap to achieve O(n) time complexity..."
                ></textarea>
              </div>

              {errorMsg && <div className="profile-alert error-alert">{errorMsg}</div>}

              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingProblem ? '💾 Update Problem' : '➕ Add Problem'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="modal-backdrop">
          <div className="modal-card small-modal">
            <h3>⚠️ Confirm Deletion</h3>
            <p>Are you sure you want to delete this DSA problem? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={confirmDelete}>
                Yes, Delete
              </button>
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DsaPage;
