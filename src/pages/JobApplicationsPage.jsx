import React, { useState, useEffect } from 'react';
import {
  getJobApplications,
  createJobApplication,
  updateJobApplication,
  deleteJobApplication,
  getJobApplicationStats,
} from '../services/api';
import './JobApplicationsPage.css';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Applications' },
  { value: 'SAVED', label: 'Saved / Wishlist', badgeClass: 'badge-saved' },
  { value: 'APPLIED', label: 'Applied', badgeClass: 'badge-applied' },
  { value: 'ONLINE_ASSESSMENT', label: 'Online Assessment (OA)', badgeClass: 'badge-oa' },
  { value: 'INTERVIEW', label: 'Interview Scheduled', badgeClass: 'badge-interview' },
  { value: 'OFFER', label: 'Offer Received', badgeClass: 'badge-offer' },
  { value: 'REJECTED', label: 'Rejected', badgeClass: 'badge-rejected' },
  { value: 'WITHDRAWN', label: 'Withdrawn', badgeClass: 'badge-withdrawn' },
];

const JOB_TYPE_OPTIONS = ['Full-Time', 'Internship', 'Contract', 'Part-Time', 'Remote'];

const JobApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    totalApplications: 0,
    appliedCount: 0,
    onlineAssessmentCount: 0,
    interviewCount: 0,
    offerCount: 0,
    rejectedCount: 0,
    savedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    companyName: '',
    jobRole: '',
    jobLink: '',
    location: '',
    jobType: 'Full-Time',
    applicationDate: new Date().toISOString().split('T')[0],
    deadline: '',
    status: 'APPLIED',
    interviewDate: '',
    notes: '',
  });

  useEffect(() => {
    fetchApplications();
    fetchStats();
  }, [selectedStatus]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedStatus !== 'ALL') {
        params.status = selectedStatus;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const data = await getJobApplications(params);
      setApplications(data || []);
    } catch (err) {
      console.error('Failed to load applications:', err);
      showAlert('error', 'Failed to load job applications.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await getJobApplicationStats();
      if (statsData) setStats(statsData);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert({ type: '', message: '' });
    }, 5000);
  };

  const handleOpenAddModal = () => {
    setEditingApp(null);
    setFormData({
      companyName: '',
      jobRole: '',
      jobLink: '',
      location: '',
      jobType: 'Full-Time',
      applicationDate: new Date().toISOString().split('T')[0],
      deadline: '',
      status: 'APPLIED',
      interviewDate: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (app) => {
    setEditingApp(app);
    setFormData({
      companyName: app.companyName || '',
      jobRole: app.jobRole || '',
      jobLink: app.jobLink || '',
      location: app.location || '',
      jobType: app.jobType || 'Full-Time',
      applicationDate: app.applicationDate || '',
      deadline: app.deadline || '',
      status: app.status || 'APPLIED',
      interviewDate: app.interviewDate || '',
      notes: app.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingApp(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.companyName.trim() || !formData.jobRole.trim() || !formData.applicationDate) {
      showAlert('error', 'Please fill in Company Name, Job Role, and Application Date.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        companyName: formData.companyName.trim(),
        jobRole: formData.jobRole.trim(),
        jobLink: formData.jobLink.trim() || null,
        location: formData.location.trim() || null,
        jobType: formData.jobType || null,
        applicationDate: formData.applicationDate,
        deadline: formData.deadline || null,
        status: formData.status,
        interviewDate: formData.interviewDate || null,
        notes: formData.notes.trim() || null,
      };

      if (editingApp) {
        await updateJobApplication(editingApp.id, payload);
        showAlert('success', 'Application updated successfully!');
      } else {
        await createJobApplication(payload);
        showAlert('success', 'Application tracked successfully!');
      }

      handleCloseModal();
      fetchApplications();
      fetchStats();
    } catch (err) {
      console.error('Failed to save application:', err);
      showAlert('error', err.response?.data?.message || 'Failed to save application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (appId, newStatus) => {
    try {
      const app = applications.find((a) => a.id === appId);
      if (!app) return;
      await updateJobApplication(appId, {
        companyName: app.companyName,
        jobRole: app.jobRole,
        jobLink: app.jobLink,
        location: app.location,
        jobType: app.jobType,
        applicationDate: app.applicationDate,
        deadline: app.deadline,
        status: newStatus,
        interviewDate: app.interviewDate,
        notes: app.notes,
      });
      showAlert('success', `Status updated to ${newStatus.replace('_', ' ')}.`);
      fetchApplications();
      fetchStats();
    } catch (err) {
      console.error('Failed to change status:', err);
      showAlert('error', 'Failed to update application status.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteJobApplication(id);
      showAlert('success', 'Job application deleted.');
      setDeleteTargetId(null);
      fetchApplications();
      fetchStats();
    } catch (err) {
      console.error('Failed to delete application:', err);
      showAlert('error', 'Failed to delete job application.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SAVED':
        return <span className="app-badge badge-saved">Saved</span>;
      case 'APPLIED':
        return <span className="app-badge badge-applied">Applied</span>;
      case 'ONLINE_ASSESSMENT':
        return <span className="app-badge badge-oa">Online Assessment</span>;
      case 'INTERVIEW':
        return <span className="app-badge badge-interview">Interview</span>;
      case 'OFFER':
        return <span className="app-badge badge-offer">Offer 🎉</span>;
      case 'REJECTED':
        return <span className="app-badge badge-rejected">Rejected</span>;
      case 'WITHDRAWN':
        return <span className="app-badge badge-withdrawn">Withdrawn</span>;
      default:
        return <span className="app-badge">{status}</span>;
    }
  };

  const filteredApps = applications.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.companyName.toLowerCase().includes(q) ||
      app.jobRole.toLowerCase().includes(q) ||
      (app.location && app.location.toLowerCase().includes(q))
    );
  });

  return (
    <div className="job-applications-page-container">
      {/* Page Header */}
      <div className="page-header-flex">
        <div>
          <h1 className="page-title">Job & Internship Applications</h1>
          <p className="page-subtitle">
            Track campus placement drives, referrals, deadlines, OA rounds, and interview offers.
          </p>
        </div>
        <button className="btn-add-app" onClick={handleOpenAddModal}>
          + New Application
        </button>
      </div>

      {/* Alert Banner */}
      {alert.message && (
        <div className={`alert-banner ${alert.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          <span>{alert.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{alert.message}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="app-stats-grid">
        <div className="app-stat-card">
          <div className="app-stat-icon icon-blue">💼</div>
          <div>
            <div className="app-stat-value">{stats.totalApplications}</div>
            <div className="app-stat-label">Total Tracked</div>
          </div>
        </div>
        <div className="app-stat-card">
          <div className="app-stat-icon icon-purple">📝</div>
          <div>
            <div className="app-stat-value">{stats.appliedCount + stats.onlineAssessmentCount}</div>
            <div className="app-stat-label">Active (Applied / OA)</div>
          </div>
        </div>
        <div className="app-stat-card">
          <div className="app-stat-icon icon-amber">🎯</div>
          <div>
            <div className="app-stat-value">{stats.interviewCount}</div>
            <div className="app-stat-label">Interviews Scheduled</div>
          </div>
        </div>
        <div className="app-stat-card">
          <div className="app-stat-icon icon-green">🏆</div>
          <div>
            <div className="app-stat-value">{stats.offerCount}</div>
            <div className="app-stat-label">Offers Received</div>
          </div>
        </div>
      </div>

      {/* Search and Status Filter Row */}
      <div className="filter-controls-row">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by company, job role, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="status-pills-scroll">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`status-filter-pill ${selectedStatus === opt.value ? 'pill-selected' : ''}`}
              onClick={() => setSelectedStatus(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List / Empty State */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading applications...</p>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="empty-app-state">
          <div className="empty-icon">💼</div>
          <h3>{searchQuery || selectedStatus !== 'ALL' ? 'No applications match your filter' : 'No job applications tracked yet'}</h3>
          <p>
            {searchQuery || selectedStatus !== 'ALL'
              ? 'Try selecting a different status filter or clearing your search keywords.'
              : 'Keep all your campus recruitment drives, off-campus referrals, and company applications organized in one unified board.'}
          </p>
          {!searchQuery && selectedStatus === 'ALL' && (
            <button className="btn-add-app-empty" onClick={handleOpenAddModal}>
              + Track First Application
            </button>
          )}
        </div>
      ) : (
        <div className="apps-grid">
          {filteredApps.map((app) => (
            <div key={app.id} className="app-card">
              <div className="app-card-header">
                <div>
                  <h3 className="app-company-name">{app.companyName}</h3>
                  <div className="app-role-title">{app.jobRole}</div>
                </div>
                <div className="app-status-wrapper">
                  {getStatusBadge(app.status)}
                </div>
              </div>

              <div className="app-meta-tags">
                {app.location && <span className="meta-tag">📍 {app.location}</span>}
                {app.jobType && <span className="meta-tag">💼 {app.jobType}</span>}
                <span className="meta-tag">📅 Applied: {app.applicationDate}</span>
                {app.deadline && <span className="meta-tag deadline-tag">⏰ Deadline: {app.deadline}</span>}
                {app.interviewDate && <span className="meta-tag interview-tag">🎯 Interview: {app.interviewDate}</span>}
              </div>

              {app.notes && <p className="app-notes-preview">{app.notes}</p>}

              <div className="app-card-footer">
                <div className="footer-left">
                  {app.jobLink && (
                    <a
                      href={app.jobLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="job-link-btn"
                    >
                      Job Post ↗
                    </a>
                  )}
                  {/* Quick status dropdown */}
                  <select
                    className="quick-status-select"
                    value={app.status}
                    onChange={(e) => handleQuickStatusChange(app.id, e.target.value)}
                  >
                    {STATUS_OPTIONS.filter((s) => s.value !== 'ALL').map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="footer-actions">
                  <button className="btn-icon-action" onClick={() => handleOpenEditModal(app)} title="Edit">
                    ✏
                  </button>
                  <button className="btn-icon-action btn-delete-action" onClick={() => setDeleteTargetId(app.id)} title="Delete">
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Application Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content app-modal">
            <div className="modal-header">
              <h2>{editingApp ? 'Edit Job Application' : 'Track New Application'}</h2>
              <button className="btn-close-modal" onClick={handleCloseModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="app-form">
              <div className="form-row-2">
                <div className="form-group">
                  <label>Company Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Google, Microsoft, Infosys"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Job Role *</label>
                  <input
                    type="text"
                    placeholder="e.g. Software Development Engineer"
                    value={formData.jobRole}
                    onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru, Hyderabad, Remote"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Employment Type</label>
                  <select
                    value={formData.jobType}
                    onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                  >
                    {JOB_TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Job Posting URL</label>
                <input
                  type="url"
                  placeholder="https://careers.google.com/jobs/..."
                  value={formData.jobLink}
                  onChange={(e) => setFormData({ ...formData, jobLink: e.target.value })}
                />
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label>Application Date *</label>
                  <input
                    type="date"
                    value={formData.applicationDate}
                    onChange={(e) => setFormData({ ...formData, applicationDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    {STATUS_OPTIONS.filter((s) => s.value !== 'ALL').map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Deadline</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
              </div>

              {['INTERVIEW', 'ONLINE_ASSESSMENT'].includes(formData.status) && (
                <div className="form-group">
                  <label>Scheduled Assessment / Interview Date</label>
                  <input
                    type="date"
                    value={formData.interviewDate}
                    onChange={(e) => setFormData({ ...formData, interviewDate: e.target.value })}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Notes & Referral Details</label>
                <textarea
                  rows="3"
                  placeholder="Referral contact, tech stack requested, rounds completed, salary details..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                ></textarea>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingApp ? 'Update Application' : 'Save Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="modal-backdrop">
          <div className="modal-content delete-modal">
            <h3>Delete Application?</h3>
            <p>Are you sure you want to remove this job application from your tracker? This action cannot be undone.</p>
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

export default JobApplicationsPage;
